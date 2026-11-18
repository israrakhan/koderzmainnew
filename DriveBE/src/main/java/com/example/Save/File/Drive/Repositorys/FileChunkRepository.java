package com.example.Save.File.Drive.Repositorys;

import com.example.Save.File.Drive.Entity.FileChunkEntity;
import com.example.Save.File.Drive.Entity.FileChunkId;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@org.springframework.stereotype.Repository
public interface FileChunkRepository extends JpaRepository<FileChunkEntity, FileChunkId> {

    @Query("select fc.chunkData from FileChunkEntity fc where fc.file.id = :fileId order by fc.id.chunkIndex asc")
    List<byte[]> findChunkDataByFileIdOrderByChunkIndexAsc(@Param("fileId") Long fileId, Pageable pageable);
@Modifying
@Transactional
@Query("delete from FileChunkEntity fc where fc.file.id = :fileId")
void deleteByFileId(@Param("fileId") Long fileId);
}
