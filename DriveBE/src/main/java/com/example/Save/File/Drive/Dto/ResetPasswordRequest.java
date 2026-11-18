package com.example.Save.File.Drive.Dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {

    private String email;
    private String newPassword;
    private String otp;
}
