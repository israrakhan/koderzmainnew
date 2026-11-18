package com.example.Save.File.Drive.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "file_chunks")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FileChunkEntity {

    @EmbeddedId
    private FileChunkId id;

    @MapsId("fileId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    @Lob
    @Column(name = "chunk_data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] chunkData;


}
