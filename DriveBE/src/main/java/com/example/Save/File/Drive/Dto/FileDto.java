package com.example.Save.File.Drive.Dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class FileDto {
    private String id;
    private String fileName;
    private String fileType;
    private Long totalSize;
    private String folderId;

}
