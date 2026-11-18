package com.example.Save.File.Drive.Repositorys;

//import com.example.Save.File.Drive.Entity.File;
import com.example.Save.File.Drive.Entity.FileEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Repository
public interface Repository  extends JpaRepository<FileEntity, Long> {
    List<FileEntity> findByFolderId(Long folderId);

    Optional<FileEntity> findByUuid(String uuid);

    List<FileEntity> findByFolderIsNotNull();

    Page<FileEntity> findByFolderId(Long folderId, Pageable pageable);

    Page<FileEntity> findByFolderUuid(String folderUuid, Pageable pageable);

    Page<FileEntity> findByFolderIsNull(Pageable pageable);

    Page<FileEntity> findByFileNameContainingIgnoreCase(String fileName, Pageable pageable);

    Page<FileEntity> findByFileNameContainingIgnoreCaseAndFolderId(String fileName, Long folderId, Pageable pageable);

    Page<FileEntity> findByFileNameContainingIgnoreCaseAndFolderUuid(String fileName, String folderUuid, Pageable pageable);


}
