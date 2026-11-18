package com.example.Save.File.Drive.Repositorys;

import com.example.Save.File.Drive.Entity.FileActivityEntity;
import com.example.Save.File.Drive.Entity.FileEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

@org.springframework.stereotype.Repository
public interface FileActivityRepository extends JpaRepository<FileActivityEntity, Long> {
    List<FileActivityEntity> findAllByOrderByActionTimeDesc();

    java.util.Optional<FileActivityEntity> findTopByFile_IdAndActionTypeOrderByActionTimeAsc(Long fileId, String actionType);

    @Query("SELECT DISTINCT a.file, a.actionTime FROM FileActivityEntity a WHERE a.actionType = 'UPLOAD' AND a.userEmail = :userEmail ORDER BY a.actionTime DESC")
    List<FileEntity> findUploadedFilesByUserEmail(String userEmail);

    @Modifying
    @Transactional
    @Query("DELETE FROM FileActivityEntity a WHERE a.file.id = :fileId")
    void deleteByFileId(Long fileId);
}
