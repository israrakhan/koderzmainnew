package com.example.Save.File.Drive.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FolderActivityResponseDTO {
    private Long id;
    private Long folderId;
    private String folderName;
    private String actionType;
    private String userEmail;
    private LocalDateTime actionTime;
    private Long parentFolderId;

}
