package com.example.Save.File.Drive.Services;

import com.example.Save.File.Drive.Dto.FileDto;
import com.example.Save.File.Drive.Dto.FolderTreeDto;
import com.example.Save.File.Drive.Entity.FileEntity;
import com.example.Save.File.Drive.Entity.FolderEntity;
import com.example.Save.File.Drive.Repositorys.FileActivityRepository;
import com.example.Save.File.Drive.Repositorys.FileChunkRepository;
import com.example.Save.File.Drive.Repositorys.FolderRepository;
import com.example.Save.File.Drive.Repositorys.Repository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FolderService {

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private Repository repository;

    @Autowired
    private FolderActivityService folderActivityService;

    @Autowired
    private FileChunkRepository fileChunkRepository;

    @Autowired
    private FileActivityRepository fileActivityRepository;

    @Autowired
    private DeleteFileService deleteFileService;

    public  FolderEntity createFolder(String folderName, Long parentId, String username)
    {
        FolderEntity folderEntity = new FolderEntity();
        folderEntity.setFolderName(folderName);
        folderEntity.setUserName(username);
        folderEntity.setCreatedDate(LocalDateTime.now());

        if(parentId != null) {
            FolderEntity parent = folderRepository.findById(parentId).orElseThrow(() -> new RuntimeException("Parent folder not found"));
            folderEntity.setParentFolder(parent);
        }
        FolderEntity savedFolder = folderRepository.save(folderEntity);
        folderActivityService.logCreate(savedFolder, username);
        return savedFolder;
    }
    public List<FolderEntity> getSubFolders(Long parentId) {
        return folderRepository.findByParentFolderId(parentId);
    }

    public List<FolderEntity> getSubFoldersByParentUuid(String parentUuid) {
        return folderRepository.findByParentFolderUuid(parentUuid);
    }

    public List<FolderEntity> getRootFolders() {
        return folderRepository.findByParentFolderIsNull();
    }

    public List<FolderEntity> getAllFolders() {
        return folderRepository.findAll();
    }

    public FolderEntity getById(Long folderId) {
        return folderRepository.findById(folderId).orElse(null);
    }

    public FolderEntity getByUuid(String folderUuid) {
        return folderRepository.findByUuid(folderUuid).orElse(null);
    }

    @Transactional
    public FolderEntity renameFolder(Long folderId, String folderName) {
        if (folderName == null || folderName.isBlank()) {
            throw new IllegalArgumentException("Folder name cannot be empty.");
        }

        FolderEntity folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found with ID: " + folderId));
        folder.setFolderName(folderName.trim());
        return folderRepository.save(folder);
    }

    @Transactional
    public FolderEntity renameFolder(FolderEntity folder, String folderName) {
        if (folderName == null || folderName.isBlank()) {
            throw new IllegalArgumentException("Folder name cannot be empty.");
        }
        if (folder == null) {
            throw new RuntimeException("Folder not found.");
        }

        FolderEntity managedFolder = folderRepository.findById(folder.getId())
                .orElseThrow(() -> new RuntimeException("Folder not found with ID: " + folder.getId()));
        managedFolder.setFolderName(folderName.trim());
        return folderRepository.save(managedFolder);
    }

    @Transactional
    public void deleteFolder(Long folderId) {
        FolderEntity folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found with ID: " + folderId));
        deleteFolderRecursively(folder);
    }

    @Transactional
    public void deleteFolder(FolderEntity folder) {
        if (folder == null) {
            throw new RuntimeException("Folder not found.");
        }
        deleteFolderRecursively(folder);
    }

    private void deleteFolderRecursively(FolderEntity folder) {
        List<FolderEntity> subFolders = folderRepository.findByParentFolderId(folder.getId());
        for (FolderEntity subFolder : subFolders) {
            deleteFolderRecursively(subFolder);
        }

        List<FileEntity> files = repository.findByFolderId(folder.getId());
        for (FileEntity file : files) {
            deleteFileService.deleteFile(file, folder.getUserName());
            fileActivityRepository.deleteByFileId(file.getId());
            fileChunkRepository.deleteByFileId(file.getId());
            repository.delete(file);
        }

        folderActivityService.logDelete(folder, folder.getUserName());
        folderRepository.delete(folder);
    }

    public List<FolderTreeDto> getFolderTreeAllUsers() {
        List<FolderEntity> folders = folderRepository.findAll();
        List<FileEntity> files = repository.findByFolderIsNotNull();

        Map<Long, FolderTreeDto> folderById = new LinkedHashMap<>();
        for (FolderEntity folder : folders) {
            FolderTreeDto dto = new FolderTreeDto();
            dto.setId(folder.getUuid());
            dto.setFolderName(folder.getFolderName());
            dto.setUserName(folder.getUserName());
            dto.setCreatedDate(folder.getCreatedDate());
            folderById.put(folder.getId(), dto);
        }

        for (FileEntity file : files) {
            if (file.getFolder() == null || file.getFolder().getId() == null) {
                continue;
            }
            FolderTreeDto parent = folderById.get(file.getFolder().getId());
            if (parent == null) {
                continue;
            }
            FileDto fileDto = new FileDto();
            fileDto.setId(file.getUuid());
            fileDto.setFileName(file.getFileName());
            fileDto.setFileType(file.getFileType());
            fileDto.setTotalSize(file.getTotalSize());
            fileDto.setFolderId(file.getFolder().getUuid());
            parent.getFiles().add(fileDto);
        }

        List<FolderTreeDto> roots = new ArrayList<>();
        for (FolderEntity folder : folders) {
            FolderTreeDto current = folderById.get(folder.getId());
            FolderEntity parentFolder = folder.getParentFolder();
            if (parentFolder == null || parentFolder.getId() == null) {
                roots.add(current);
                continue;
            }
            FolderTreeDto parent = folderById.get(parentFolder.getId());
            if (parent == null) {
                roots.add(current);
            } else {
                parent.getSubFolders().add(current);
            }
        }
        return roots;
    }
}
