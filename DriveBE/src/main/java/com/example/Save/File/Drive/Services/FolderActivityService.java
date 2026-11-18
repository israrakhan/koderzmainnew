package com.example.Save.File.Drive.Services;

import com.example.Save.File.Drive.Dto.FolderActivityResponseDTO;
import com.example.Save.File.Drive.Entity.FolderActivityEntity;
import com.example.Save.File.Drive.Entity.FolderEntity;
import com.example.Save.File.Drive.Repositorys.FolderActivityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FolderActivityService {

    private final FolderActivityRepository folderActivityRepository;

    public FolderActivityService(FolderActivityRepository folderActivityRepository) {
        this.folderActivityRepository = folderActivityRepository;
    }

    public void logCreate(FolderEntity folder, String userEmail) {
        logActivity(folder, "CREATE", userEmail);
    }

    public void logDelete(FolderEntity folder, String userEmail) {
        logActivity(folder, "DELETE", userEmail);
    }

    private void logActivity(FolderEntity folder, String actionType, String userEmail) {
        FolderActivityEntity activity = new FolderActivityEntity();
        activity.setFolderId(folder.getId());
        activity.setFolderName(folder.getFolderName());
        activity.setActionType(actionType);
        activity.setUserEmail(userEmail);
        activity.setActionTime(LocalDateTime.now());
        if (folder.getParentFolder() != null) {
            activity.setParentFolderId(folder.getParentFolder().getId());
        }
        folderActivityRepository.save(activity);
    }

    public List<FolderActivityResponseDTO> getAllActivities() {
        return folderActivityRepository.findAllByOrderByActionTimeDesc()
                .stream()
                .map(activity -> new FolderActivityResponseDTO(
                        activity.getId(),
                        activity.getFolderId(),
                        activity.getFolderName(),
                        activity.getActionType(),
                        activity.getUserEmail(),
                        activity.getActionTime(),
                        activity.getParentFolderId()
                ))
                .toList();
    }
}
