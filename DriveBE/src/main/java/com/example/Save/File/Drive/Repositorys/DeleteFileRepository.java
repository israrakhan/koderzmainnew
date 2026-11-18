package com.example.Save.File.Drive.Repositorys;

import com.example.Save.File.Drive.Entity.DeleteFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
@org.springframework.stereotype.Repository
public interface DeleteFileRepository extends JpaRepository<DeleteFileEntity, Long> {
    List<DeleteFileEntity> findAllByOrderByDeleteTimeDesc();
}
