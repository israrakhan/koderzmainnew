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
public class UserResponseDTO {

    private String id;
    private String name;
    private String email;
    private String roles;
    private Boolean emailVerified;
    private Boolean isActive;
    private LocalDateTime createdAt;

}
