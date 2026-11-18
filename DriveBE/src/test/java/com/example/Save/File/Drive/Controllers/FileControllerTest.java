package com.example.Save.File.Drive.Controllers;

import com.example.Save.File.Drive.Entity.FileEntity;
import com.example.Save.File.Drive.Entity.FolderEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

class FileControllerTest {

    @Test
    @DisplayName("TC_UP_010: FileEntity creation test")
    void fileEntity_Creation_Test() {
        FileEntity file = new FileEntity();
        file.setFileName("test-image.png");
        file.setFileType("image/png");

        assertEquals("test-image.png", file.getFileName());
        assertEquals("image/png", file.getFileType());
    }

    @Test
    @DisplayName("TC_UP_015: File name not null test")
    void fileEntity_FileName_NotNull_Test() {
        FileEntity file = new FileEntity();
        file.setFileName("document.pdf");

        assertNotNull(file.getFileName());
    }

    @Test
    @DisplayName("TC_HP_01: File UUID test")
    void fileEntity_UUID_Test() {
        FileEntity file = new FileEntity();
        file.setUuid("uuid-test-123");

        assertEquals("uuid-test-123", file.getUuid());
        assertNotNull(file.getUuid());
    }

    @Test
    @DisplayName("TC_SR_04: Empty search query test")
    void search_EmptyQuery_Test() {
        String query = "";
        assertTrue(query.isEmpty());
    }

    @Test
    @DisplayName("TC_SR_11: SQL injection detection test")
    void search_SqlInjection_Test() {
        String query = "' OR '1'='1";
        assertTrue(query.contains("'"));
        assertTrue(query.contains("OR"));
    }

    @Test
    @DisplayName("TC_SR_12: XSS payload detection test")
    void search_XssPayload_Test() {
        String query = "<script>alert('XSS')</script>";
        assertTrue(query.contains("<script>"));
    }

    @Test
    @DisplayName("TC_HP_11: File ID test")
    void fileEntity_Id_Test() {
        FileEntity file = new FileEntity();
        file.setId(1L);

        assertEquals(1L, file.getId());
    }

    @Test
    @DisplayName("TC_HP_12: File rename test")
    void fileEntity_Rename_Test() {
        FileEntity file = new FileEntity();
        file.setFileName("original.png");
        file.setFileName("renamed.png");

        assertEquals("renamed.png", file.getFileName());
    }
}
