package com.example.Save.File.Drive.Controllers;


import com.example.Save.File.Drive.Entity.FileEntity;
import com.example.Save.File.Drive.Repositorys.*;
import com.example.Save.File.Drive.Services.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;


import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@RestController
public class FileController {


    private final FileService fileService;
    private final FileActivityService fileActivityService;


    private final Repository repository;
    private final FolderRepository folderRepository;

    private final FileChunkRepository  fileChunkRepository;
    private final FileActivityRepository fileActivityRepository;

  private final DeleteFileService deleteFileService;


    public FileController(FileService fileService, FileActivityService fileActivityService,Repository repository, FolderRepository folderRepository, FileChunkRepository fileChunkRepository, FileActivityRepository fileActivityRepository, DeleteFileService deleteFileService) {
        this.fileService = fileService;
        this.fileActivityService = fileActivityService;

        this.repository = repository;
        this.folderRepository = folderRepository;
        this.fileChunkRepository = fileChunkRepository;
        this.fileActivityRepository = fileActivityRepository;
        this.deleteFileService = deleteFileService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> upload(@RequestParam(value = "file", required = false) MultipartFile file, Authentication  authentication, @RequestParam(required = false) String folderId) {
       try {
           UserInfoDetails userDetails = (UserInfoDetails) authentication.getPrincipal();
           assert userDetails != null;
           String userName = userDetails.getName();

           if (file == null || file.isEmpty()) {
               return ResponseEntity.ok("No file uploaded.");
           }

           try {
               FileEntity savedFile;
               if (folderId == null || folderId.isBlank()) {
                   savedFile = fileService.saveFiles(file, userName, (Long) null);
               } else if (folderRepository.existsByUuid(folderId)) {
                   savedFile = fileService.saveFiles(file, userName, folderId);
               } else {
                   savedFile = fileService.saveFiles(file, userName, Long.valueOf(folderId));
               }
               return ResponseEntity.ok(
                       "File uploaded successfully with ID: " + savedFile.getId() + ", name: " + savedFile.getFileName()
               );
           } catch (NumberFormatException ex) {
               return ResponseEntity.badRequest().body("Invalid folder identifier: " + folderId);
           } catch (IllegalArgumentException ex) {
               return ResponseEntity.badRequest().body(ex.getMessage());
           } catch (RuntimeException ex) {
               return ResponseEntity.internalServerError().body(ex.getMessage());
           }
       }
       catch (Exception ex) {
       return ResponseEntity.badRequest().body(ex.getMessage()) ;
       }
    }

@GetMapping("/files")
public ResponseEntity<Page<FileEntity>> listFiles(@RequestParam(required = false) String folderId, Pageable pageable) {
    if (folderId != null && !folderId.isBlank()) {
        return resolveFolderPage(folderId, pageable);
    }
    return ResponseEntity.ok(fileService.getAllFiles(pageable));
}

    @GetMapping("/files/folder/{uuid}")
    public ResponseEntity<Page<FileEntity>> listFilesByFolderUuid(@PathVariable String uuid, Pageable pageable) {
        if (!folderRepository.existsByUuid(uuid)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(fileService.getFilesByFolderUuid(uuid, pageable));
    }

    @GetMapping("/files/search")
    public ResponseEntity<?> searchFiles(
            @RequestParam String query,
            @RequestParam(required = false) String folderId,
            Pageable pageable
    ) {
        try {
            if (folderId != null && !folderId.isBlank()) {
                return resolveFolderSearchPage(query, folderId, pageable);
            }
            return ResponseEntity.ok(fileService.searchFiles(query, null, pageable));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping({"/files/rename/{id}", "/files/{id}/rename"})
    public ResponseEntity<?> renameFile(@PathVariable String id,
                                        @RequestParam(required = false) String fileName,
                                        @RequestBody(required = false) Map<String, Object> requestBody) {
        try {
            FileEntity file = resolveFileReference(id);
            if (file == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found with ID: " + id);
            }
            return ResponseEntity.ok(fileService.renameFile(file.getId(), extractName(fileName, requestBody)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
        }
    }

    @GetMapping("/files/my")
    public ResponseEntity<List<FileEntity>> listMyFiles(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserInfoDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserInfoDetails userDetails = (UserInfoDetails) authentication.getPrincipal();
        String userEmail = userDetails.getName();
        return ResponseEntity.ok(fileService.getUserFiles(userEmail));
    }

    @GetMapping("/download/{uuid}")
    public ResponseEntity<StreamingResponseBody> download(@PathVariable("uuid") String uuId, Authentication authentication) {
        FileEntity file = resolveFileReference(uuId);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }
        Long fileId = file.getId();
        if (fileId == null) {
            return ResponseEntity.notFound().build();
        }
        // Track the download
        String username = "anonymous";
        Authentication currentAuth = authentication != null ? authentication : SecurityContextHolder.getContext().getAuthentication();
        if (currentAuth != null && currentAuth.isAuthenticated() && currentAuth.getPrincipal() instanceof UserInfoDetails) {
            UserInfoDetails principal = (UserInfoDetails) currentAuth.getPrincipal();
            username = principal.getName();
        }
        fileService.save(file);
        fileActivityService.logActivity(file, "DOWNLOAD",username);
        System.out.println(" get Name : " + username);

        String contentType = file.getFileType();
        String filename = file.getFileName();
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (contentType != null && !contentType.isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(contentType);
            } catch (IllegalArgumentException ignored) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        StreamingResponseBody responseBody = outputStream -> {
            try {
                fileService.writeFileTo(fileId, outputStream);
                outputStream.flush();
            } catch (Exception e) {
                e.printStackTrace();
            }
        };
        return ResponseEntity.ok()
                .contentType(mediaType)
//                .contentLength(file.getTotalSize())
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(responseBody);
    }




    @DeleteMapping("/delete/{uuid}")
    public ResponseEntity<String> deleteById(@PathVariable("uuid") String uuId) {

        try {
            AtomicReference<String> userName = new AtomicReference<>("");
            FileEntity file = resolveFileReference(uuId);

            if (file == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("File not found with ID: " + uuId);
            }

            Long fileId = file.getId();
            if (fileId == null || !repository.existsById(fileId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("File not found with ID: " + uuId);
            }

            // Prefer uploader name from activity log, fallback to deleter if not found
            fileActivityRepository
                    .findTopByFile_IdAndActionTypeOrderByActionTimeAsc(fileId, "UPLOAD")
                    .ifPresent(activity -> userName.set(activity.getUserEmail()));
            deleteFileService.deleteFile(file, userName.get());

            fileActivityRepository.deleteByFileId(fileId);
            fileChunkRepository.deleteByFileId(fileId);
            repository.deleteById(fileId);

            return ResponseEntity.ok("Deleted file with ID: " + uuId);

        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete file " + uuId + " due to related data constraints.");
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("File not found with ID: " + uuId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete file with ID: " + uuId);
        }

        }

    private ResponseEntity<Page<FileEntity>> resolveFolderPage(String folderReference, Pageable pageable) {
        if (folderRepository.existsByUuid(folderReference)) {
            return ResponseEntity.ok(fileService.getFilesByFolderUuid(folderReference, pageable));
        }

        try {
            Long numericFolderId = Long.valueOf(folderReference);
            return ResponseEntity.ok(fileService.getFilesByFolderId(numericFolderId, pageable));
        } catch (NumberFormatException ignored) {
            return ResponseEntity.badRequest().build();
        }
    }

    private ResponseEntity<Page<FileEntity>> resolveFolderSearchPage(String query, String folderReference, Pageable pageable) {
        if (folderRepository.existsByUuid(folderReference)) {
            return ResponseEntity.ok(fileService.searchFilesByFolderUuid(query, folderReference, pageable));
        }

        try {
            Long numericFolderId = Long.valueOf(folderReference);
            return ResponseEntity.ok(fileService.searchFiles(query, numericFolderId, pageable));
        } catch (NumberFormatException ignored) {
            return ResponseEntity.badRequest().build();
        }
    }

    private FileEntity resolveFileReference(String fileReference) {
        FileEntity file = fileService.getByUuid(fileReference);
        if (file != null) {
            return file;
        }

        try {
            return fileService.getById(Long.valueOf(fileReference));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String extractName(String requestParamName, Map<String, Object> requestBody) {
        if (requestParamName != null && !requestParamName.isBlank()) {
            return requestParamName;
        }
        if (requestBody == null) {
            return null;
        }

        Object bodyName = requestBody.get("name");
        if (bodyName == null) {
            bodyName = requestBody.get("fileName");
        }
        return bodyName == null ? null : bodyName.toString();
    }
}
