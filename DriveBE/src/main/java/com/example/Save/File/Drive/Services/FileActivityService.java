package com.example.Save.File.Drive.Services;

import com.example.Save.File.Drive.Dto.FileActivityResponseDTO;
import com.example.Save.File.Drive.Entity.FileActivityEntity;
import com.example.Save.File.Drive.Entity.FileEntity;
import com.example.Save.File.Drive.Repositorys.FileActivityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FileActivityService {

    private final FileActivityRepository fileActivityRepository;

    public FileActivityService(FileActivityRepository fileActivityRepository) {
        this.fileActivityRepository = fileActivityRepository;
    }

    public void logActivity(FileEntity file, String actionType, String userEmail ) {
        FileActivityEntity activity = new FileActivityEntity();
        activity.setFile(file);
        activity.setFileName(file.getFileName());
        activity.setActionType(actionType);
        activity.setUserEmail(userEmail);
        activity.setActionTime(LocalDateTime.now());
        activity.setTotalSize(file.getTotalSize());
        fileActivityRepository.save(activity);
    }

    public List<FileActivityResponseDTO> getAllActivities() {
        return fileActivityRepository.findAllByOrderByActionTimeDesc()
                .stream()
                .map(activity -> new FileActivityResponseDTO(
                        activity.getId(),
                        activity.getFile().getId(),
                        activity.getFileName(),
                        activity.getActionType(),
                        activity.getUserEmail(),
                        activity.getActionTime(),
                        activity.getTotalSize()
                ))
                .toList();
    }


}
