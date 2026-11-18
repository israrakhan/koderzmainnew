package com.example.Save.File.Drive.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "folder_activity")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FolderActivityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "folder_id", nullable = false)
    private Long folderId;

    @Column(name = "folder_name", nullable = false)
    private String folderName;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "action_time", nullable = false)
    private LocalDateTime actionTime;

    @Column(name = "parent_folder_id")
    private Long parentFolderId;


}
