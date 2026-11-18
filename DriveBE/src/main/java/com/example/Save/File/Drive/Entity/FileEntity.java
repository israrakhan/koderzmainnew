package com.example.Save.File.Drive.Entity;
import com.example.Save.File.Drive.Utils.UUIDGenerator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;

@Entity
@Table(
        name = "files",
        indexes = {
                @Index(name = "idx_files_uuid", columnList = "uuid")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false, length = 36)
    private String uuid;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "mime_type")
    private String fileType;

    @Column(name = "total_size", nullable = false)
    private Long totalSize;


    @ManyToOne
    @JoinColumn(name = "folder_id")
    @JsonIgnoreProperties({"subFolder", "parentFolder"})
    private FolderEntity folder;


    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @PrePersist
    public void prePersist() {
        if (uuid == null || uuid.isBlank()) {
            uuid = UUIDGenerator.generateULID();
        }
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
    }


}
