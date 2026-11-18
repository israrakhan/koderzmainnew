package com.example.Save.File.Drive.Controllers;

import com.example.Save.File.Drive.Dto.FolderTreeDto;
import com.example.Save.File.Drive.Entity.FolderEntity;
import com.example.Save.File.Drive.Services.FolderService;
import com.example.Save.File.Drive.Services.UserInfoDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/folder")
public class FolderController {

    @Autowired
    private FolderService  folderService;

    @PostMapping("/create")
    public FolderEntity createFolder(@RequestParam String folderName, @RequestParam(required = false) String parentId, Authentication authentication) {
        String username = "anonymous";
        org.springframework.security.core.Authentication currentAuth = authentication != null ? authentication : SecurityContextHolder.getContext().getAuthentication();
        if (currentAuth != null && currentAuth.isAuthenticated() && currentAuth.getPrincipal() instanceof UserInfoDetails) {
            UserInfoDetails principal = (UserInfoDetails) currentAuth.getPrincipal();
            username = principal.getName();
        }
        if (parentId == null || parentId.isBlank()) {
            return folderService.createFolder(folderName, null, username);
        }
        FolderEntity parent = resolveFolderReference(parentId);
        if (parent == null) {
            throw new RuntimeException("Parent folder not found");
        }
        return folderService.createFolder(folderName, parent.getId(), username);
    }
    @GetMapping("/list")
    public List<FolderEntity> listFolders(@RequestParam(required = false) String parentId) {
        if (parentId != null && !parentId.isBlank()) {
            try {
                return folderService.getSubFolders(Long.valueOf(parentId));
            } catch (NumberFormatException ignored) {
                return folderService.getSubFoldersByParentUuid(parentId);
            }
        }
        return folderService.getRootFolders();
    }

    @GetMapping("/all")
    public List<FolderEntity> listAllFolders() {
        return folderService.getAllFolders();
    }

    @GetMapping("/tree")
    public List<FolderTreeDto> listFolderTree() {
        return folderService.getFolderTreeAllUsers();
    }

    @PutMapping({ "/{uuid}/rename"})
    public ResponseEntity<?> renameFolder(@PathVariable("uuid") String id,
                                          @RequestParam(required = false) String folderName,
                                          @RequestBody(required = false) Map<String, Object> requestBody) {
        try {
            FolderEntity folder = resolveFolderReference(id);
            if (folder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Folder not found with ID: " + id);
            }
            return ResponseEntity.ok(folderService.renameFolder(folder.getId(), extractName(folderName, requestBody)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (RuntimeException ex) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteFolder(@PathVariable String id) {
        try {
            FolderEntity folder = resolveFolderReference(id);
            if (folder == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Folder not found with ID: " + id);
            }
            folderService.deleteFolder(folder);
            return ResponseEntity.ok("Deleted folder with ID: " + id + " and all files inside it.");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete folder with ID: " + id);
        }
    }

    private FolderEntity resolveFolderReference(String folderReference) {
        if (folderReference == null || folderReference.isBlank()) {
            return null;
        }

        FolderEntity byUuid = folderService.getByUuid(folderReference);
        if (byUuid != null) {
            return byUuid;
        }

        try {
            return folderService.getById(Long.valueOf(folderReference));
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
            bodyName = requestBody.get("folderName");
        }
        return bodyName == null ? null : bodyName.toString();
    }
}
