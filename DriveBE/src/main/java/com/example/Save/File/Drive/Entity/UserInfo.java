package com.example.Save.File.Drive.Entity;


import com.example.Save.File.Drive.Utils.UUIDGenerator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_users_uuid", columnList = "uuid"),
                @Index(name = "idx_users_email", columnList = "email")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, updatable = false, length = 36)
    private String uuid;
    private String name;
    @Column(unique = true, nullable = false)
    private String email;
    private String password;
    private String roles;

    private Boolean emailVerified = false;
    private LocalDateTime createdDate;
    @JsonIgnore
    private String resetOtp;
    @JsonIgnore
    private LocalDateTime resetOtpCreatedAt;

    @PrePersist
    public void prePersist() {
        if (uuid == null || uuid.isBlank()) {
            uuid = UUIDGenerator.generateULID();
        }
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
    }

    public boolean isEmailVerified() {
        return emailVerified != null && emailVerified;
    }
}

