package com.example.Save.File.Drive.Entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthRequest {

    @JsonProperty("username")
    private String username;
    
    private String password;
    
    // Setter for email field (in case frontend sends 'email' instead of 'username')
    @JsonProperty("email")
    public void setEmail(String email) {
        this.username = email;
    }
    
    // Getter for email (if frontend expects 'email' in response)
    @JsonProperty("email")
    public String getEmail() {
        return this.username;
    }
}
