package com.example.Save.File.Drive.Entity;

import com.example.Save.File.Drive.Utils.UUIDGenerator;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
        name = "Folders",
        indexes = {
                @Index(name = "idx_folders_uuid", columnList = "uuid")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FolderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

    @Column(nullable = false, unique = true, updatable = false, length = 36)
    private String uuid;

    private String folderName;

    private String  userName;

    private LocalDateTime createdDate;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    @JsonBackReference
    private FolderEntity parentFolder;

    @OneToMany(mappedBy = "parentFolder", cascade = CascadeType.ALL)
    @JsonManagedReference
    @JsonIgnore
    private List<FolderEntity> subFolder;

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
