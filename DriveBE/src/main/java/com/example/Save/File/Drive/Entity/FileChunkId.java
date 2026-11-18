package com.example.Save.File.Drive.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileChunkId implements Serializable {

    @Column(name = "file_id")
    private Long fileId;

    @Column(name = "chunk_index")
    private Long chunkIndex;


    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof FileChunkId that)) {
            return false;
        }
        return Objects.equals(fileId, that.fileId) && Objects.equals(chunkIndex, that.chunkIndex);
    }

    @Override
    public int hashCode() {
        return Objects.hash(fileId, chunkIndex);
    }
}
