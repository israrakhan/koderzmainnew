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
public class DeleteFileResponseDTO {

    private Long id;
    private String filename;
    private LocalDateTime deleteTime;
    private String userName;
    private Long fileSize;


}
