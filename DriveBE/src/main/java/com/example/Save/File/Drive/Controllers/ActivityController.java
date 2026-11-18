package com.example.Save.File.Drive.Controllers;

import com.example.Save.File.Drive.Dto.FileActivityResponseDTO;
import com.example.Save.File.Drive.Dto.FolderActivityResponseDTO;
import com.example.Save.File.Drive.Services.FileActivityService;
import com.example.Save.File.Drive.Services.FolderActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
@RestController
public class ActivityController {

    private final FileActivityService fileActivityService;
    private final FolderActivityService folderActivityService;

    public ActivityController(FileActivityService fileActivityService, FolderActivityService folderActivityService) {
        this.fileActivityService = fileActivityService;
        this.folderActivityService = folderActivityService;
    }

    //show in Admin DashBord
    @GetMapping("/activities")
    public ResponseEntity<List<FileActivityResponseDTO>> getAllActivities() {
        return ResponseEntity.ok(fileActivityService.getAllActivities());
    }

    @GetMapping("/folder-activities")
    public ResponseEntity<List<FolderActivityResponseDTO>> getAllFolderActivities() {
        return ResponseEntity.ok(folderActivityService.getAllActivities());
    }
}
