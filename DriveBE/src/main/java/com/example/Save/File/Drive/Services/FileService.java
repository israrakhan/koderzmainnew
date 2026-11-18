package com.example.Save.File.Drive.Services;

import com.example.Save.File.Drive.Entity.FileChunkEntity;
import com.example.Save.File.Drive.Entity.FileChunkId;
import com.example.Save.File.Drive.Entity.FileEntity;
import com.example.Save.File.Drive.Entity.FolderEntity;
import com.example.Save.File.Drive.Repositorys.FileActivityRepository;
import com.example.Save.File.Drive.Repositorys.FileChunkRepository;
import com.example.Save.File.Drive.Repositorys.FolderRepository;
import com.example.Save.File.Drive.Repositorys.Repository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.nio.channels.WritableByteChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class FileService {

    @Value("${spring.servlet.multipart.location}")
    private String uploadTempPath;

    int chunkSizeBytes = 100 * 1024 * 1024;

    private final Repository repository;

    private final FileChunkRepository fileChunkRepository;

    private final FileActivityRepository fileActivityRepository;

    private final FileActivityService fileActivityService;

    private final FolderRepository folderRepository;

    public FileService(Repository repository, FileChunkRepository fileChunkRepository, FileActivityRepository fileActivityRepository, FileActivityService fileActivityService, FolderRepository folderRepository) {
        this.repository = repository;
        this.fileChunkRepository = fileChunkRepository;
        this.fileActivityRepository = fileActivityRepository;
        this.fileActivityService = fileActivityService;
        this.folderRepository = folderRepository;
    }



    @PostConstruct
    public void init() {
        try {
            // This will clean up any weird leading slashes from the properties file
            Path path = Paths.get(uploadTempPath).toAbsolutePath().normalize();
            Files.createDirectories(path);
        } catch (Exception e) {
            throw new RuntimeException("Fatal: Multipart location invalid", e);
        }
    }

    @PostConstruct
    void validateChunkSize() {
        if (chunkSizeBytes <= 0) {
            throw new IllegalArgumentException("Chunk size must be greater than zero.");
        }
    }



    @Transactional
    public FileEntity saveFiles(MultipartFile file, String userEmail, Long folderId) throws IOException {
        FolderEntity folderEntity = null;
        if (folderId != null) {
            folderEntity = folderRepository.findById(folderId)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found with ID: " + folderId));
        }
        return saveFiles(file, userEmail, folderEntity);
    }

    @Transactional
    public FileEntity saveFiles(MultipartFile file, String userEmail, String folderUuid) throws IOException {
        FolderEntity folderEntity = null;
        if (folderUuid != null && !folderUuid.isBlank()) {
            folderEntity = folderRepository.findByUuid(folderUuid)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found with UUID: " + folderUuid));
        }
        return saveFiles(file, userEmail, folderEntity);
    }

    private FileEntity saveFiles(MultipartFile file, String userEmail, FolderEntity folderEntity) throws IOException {
        String originalFileName = file.getOriginalFilename();
        long fileSize = file.getSize();
        try {
            FileEntity fileEntity = new FileEntity();
            fileEntity.setFileName(originalFileName);
            fileEntity.setFileType(file.getContentType());
            fileEntity.setTotalSize(fileSize);
            fileEntity.setFolder(folderEntity);

            FileEntity savedFile = repository.saveAndFlush(fileEntity);
            Long savedFileId = savedFile.getId();
            if (savedFileId == null) {
                throw new IllegalStateException("File ID was not generated for uploaded file");
            }

            try(ReadableByteChannel channel = Channels.newChannel(file.getInputStream())){
                long chunkIndex = 0;

                ByteBuffer buffer = ByteBuffer.allocate(chunkSizeBytes);

                while(channel.read(buffer) != -1) {
                    buffer.flip();
                    if (!buffer.hasRemaining()) {
                        buffer.clear();
                        continue;
                    }
                    FileChunkEntity chunk = new FileChunkEntity();
                    chunk.setId(new FileChunkId(savedFileId, chunkIndex));
                    chunk.setFile(savedFile);

                    byte[] chunkData = new byte[buffer.remaining()];
                    buffer.get(chunkData);
                    chunk.setChunkData(chunkData);

                    fileChunkRepository.save(chunk);
                    chunkIndex++;

                    buffer.clear();
                }
            }

            fileActivityService.logActivity(savedFile, "UPLOAD", userEmail);
            return savedFile;
        } catch (Exception e) {
            throw new RuntimeException("Could not save file: " + e.getMessage(), e);
        }
    }

    public FileEntity getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public FileEntity getByUuid(String uuid) {
        return repository.findByUuid(uuid).orElse(null);
    }

    @Transactional
    public FileEntity renameFile(Long id, String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("File name cannot be empty.");
        }

        FileEntity fileEntity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found with ID: " + id));
        fileEntity.setFileName(fileName.trim());
        return repository.save(fileEntity);
    }

    @Transactional
    public FileEntity renameFile(FileEntity fileEntity, String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("File name cannot be empty.");
        }
        if (fileEntity == null) {
            throw new RuntimeException("File not found.");
        }

        FileEntity managedFile = repository.findById(fileEntity.getId())
                .orElseThrow(() -> new RuntimeException("File not found with ID: " + fileEntity.getId()));
        managedFile.setFileName(fileName.trim());
        return repository.save(managedFile);
    }

    @Transactional
    public FileEntity save(FileEntity fileEntity) {
        return repository.save(fileEntity);
    }


public void writeFileTo(Long fileId, OutputStream outputStream) throws IOException {

    int page = 0;
    int pageSize = 100;
    int totalChunks = 0;

    // REMOVE BufferedOutputStream
    WritableByteChannel channel = Channels.newChannel(outputStream);
    try {
        while(true) {
            List<byte[]> chunks = fileChunkRepository.findChunkDataByFileIdOrderByChunkIndexAsc(
                    fileId,
                    PageRequest.of(page, pageSize)
            );

            System.out.println("Page " + page + ": Found " + chunks.size() + " chunks");
            if(chunks.isEmpty()) {
                break;
            }
            for(byte[] chunkData : chunks) {
                System.out.println("Writing chunk of size: " + chunkData.length);
                ByteBuffer buffer = ByteBuffer.wrap(chunkData);
                while (buffer.hasRemaining()) {
                    channel.write(buffer);
                }
                totalChunks++;
            }
            // REMOVE outputStream.flush() here
            if(chunks.size() < pageSize){
                break;
            }



            page++;
        }
        // ADD final flush
        outputStream.flush();
    } finally {
        // ADD close channel (safe for StreamingResponseBody)
        channel.close();
    }

}


    public Page<FileEntity> getAllFiles(Pageable pageable) {
        return repository.findByFolderIsNull(pageable);
    }



    public List<FileEntity> getUserFiles(String userEmail) {
        return fileActivityRepository.findUploadedFilesByUserEmail(userEmail);
    }

    public Page<FileEntity> getFilesByFolderId(Long folderId, Pageable pageable) {
        return repository.findByFolderId(folderId, pageable);
    }

    public Page<FileEntity> getFilesByFolderUuid(String folderUuid, Pageable pageable) {
        return repository.findByFolderUuid(folderUuid, pageable);
    }



    public Page<FileEntity> searchFiles(String query, Long folderId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Search query cannot be empty.");
        }

        String normalizedQuery = query.trim();
        if (folderId != null) {
            return repository.findByFileNameContainingIgnoreCaseAndFolderId(normalizedQuery, folderId, pageable);
        }
        return repository.findByFileNameContainingIgnoreCase(normalizedQuery, pageable);
    }

    public Page<FileEntity> searchFilesByFolderUuid(String query, String folderUuid, Pageable pageable) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Search query cannot be empty.");
        }

        String normalizedQuery = query.trim();
        return repository.findByFileNameContainingIgnoreCaseAndFolderUuid(normalizedQuery, folderUuid, pageable);
    }

}



