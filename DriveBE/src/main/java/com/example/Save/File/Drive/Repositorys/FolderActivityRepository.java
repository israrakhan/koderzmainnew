package com.example.Save.File.Drive.Repositorys;

import com.example.Save.File.Drive.Entity.FolderActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

@org.springframework.stereotype.Repository
public interface FolderActivityRepository extends JpaRepository<FolderActivityEntity, Long> {
    List<FolderActivityEntity> findAllByOrderByActionTimeDesc();
}
