package com.example.Save.File.Drive.Dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
public class FolderTreeDto {
    private String id;
    private String folderName;
    private String userName;
    private LocalDateTime createdDate;
    private List<FileDto> files = new ArrayList<>();
    private List<FolderTreeDto> subFolders = new ArrayList<>();

}
