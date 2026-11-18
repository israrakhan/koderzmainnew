package com.example.Save.File.Drive.Controllers;

import com.example.Save.File.Drive.Dto.DeleteFileResponseDTO;
import com.example.Save.File.Drive.Services.DeleteFileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
@RestController
public class DeleteController {
    
    private final DeleteFileService deleteFileService;

    public DeleteController(DeleteFileService deleteFileService) {
        this.deleteFileService = deleteFileService;
    }
    @GetMapping("/deleteActivity")
    public ResponseEntity<List<DeleteFileResponseDTO>> getAllDeleteFile(){
        return ResponseEntity.ok(deleteFileService.getAllDeleteFile());
    }
}
