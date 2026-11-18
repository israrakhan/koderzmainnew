package com.example.Save.File.Drive.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class FileActivityResponseDTO {
    private Long id;
    private Long fileId;
    private String fileName;
    private String actionType;
    private String userEmail;
    private LocalDateTime actionTime;
    private Long totalSize;


}
