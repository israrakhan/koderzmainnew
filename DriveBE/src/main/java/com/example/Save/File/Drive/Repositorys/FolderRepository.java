package com.example.Save.File.Drive.Repositorys;

import com.example.Save.File.Drive.Entity.FolderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface FolderRepository extends JpaRepository<FolderEntity, Long> {
    List<FolderEntity> findByParentFolderId(Long parentId);

    List<FolderEntity> findByParentFolderIsNull();

    List<FolderEntity> findByParentFolderUuid(String parentUuid);

    Optional<FolderEntity> findByUuid(String uuid);

    boolean existsByUuid(String uuid);
}
