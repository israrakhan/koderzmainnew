package com.example.Save.File.Drive.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RefeshTokenRequest {
    private String refreshToken;
    private String accessToken;

}
