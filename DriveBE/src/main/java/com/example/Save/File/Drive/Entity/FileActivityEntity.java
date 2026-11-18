package com.example.Save.File.Drive.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_activity")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FileActivityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "action_time", nullable = false)
    private LocalDateTime actionTime;
    @Column(name = "totalSize", nullable = false)
    private  Long TotalSize;


}
