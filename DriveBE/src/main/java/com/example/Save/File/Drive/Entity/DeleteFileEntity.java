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
        name = "file_delete_history",
        indexes = {
                @Index(name = "idx_file_delete_history_uuid", columnList = "uuid")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeleteFileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false, length = 36)
    private String uuid;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "delete_time", nullable = false)
    private LocalDateTime deleteTime;

    private Long fileSize;

    private String userName;

    @PrePersist
    public void prePersist() {
        if (uuid == null || uuid.isBlank()) {
            uuid = UUIDGenerator.generateULID();
        }
        if (deleteTime == null) {
            deleteTime = LocalDateTime.now();
        }
    }


}
