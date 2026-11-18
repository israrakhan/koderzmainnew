package com.example.Save.File.Drive.Services;

import com.example.Save.File.Drive.Dto.DeleteFileResponseDTO;
import com.example.Save.File.Drive.Entity.DeleteFileEntity;
import com.example.Save.File.Drive.Entity.FileActivityEntity;
import com.example.Save.File.Drive.Entity.FileEntity;
import com.example.Save.File.Drive.Repositorys.DeleteFileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeleteFileService {

    private final DeleteFileRepository deleteFileRepository;

    public DeleteFileService(DeleteFileRepository deleteFileRepository) {
        this.deleteFileRepository = deleteFileRepository;
    }

    public void deleteFile(FileEntity file, String userName){
        DeleteFileEntity  deleteFileEntity = new DeleteFileEntity();

        deleteFileEntity.setFileName(file.getFileName());
        deleteFileEntity.setDeleteTime(LocalDateTime.now());
        deleteFileEntity.setFileSize(file.getTotalSize());
        deleteFileEntity.setUserName(userName);
        deleteFileRepository.save(deleteFileEntity);
    }

    public List<DeleteFileResponseDTO> getAllDeleteFile(){
        return deleteFileRepository.findAllByOrderByDeleteTimeDesc()
                .stream()
                .map(deleteFileEntity -> new DeleteFileResponseDTO(
                                        deleteFileEntity.getId(),
                        deleteFileEntity.getFileName(),
                        deleteFileEntity.getDeleteTime(),
                        deleteFileEntity.getUserName(),
                        deleteFileEntity.getFileSize()
                                ))
                .toList();
    }
}
