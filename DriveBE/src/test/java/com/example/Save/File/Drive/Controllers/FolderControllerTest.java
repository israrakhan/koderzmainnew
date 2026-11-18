package com.example.Save.File.Drive.Controllers;

import com.example.Save.File.Drive.Entity.FolderEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

class FolderControllerTest {

    @Test
    @DisplayName("TC_UP_004: FolderEntity creation test")
    void folderEntity_Creation_Test() {
        FolderEntity folder = new FolderEntity();
        folder.setFolderName("My Documents");

        assertEquals("My Documents", folder.getFolderName());
        assertNotNull(folder.getFolderName());
    }

    @Test
    @DisplayName("TC_UP_005: Folder name not empty test")
    void folderEntity_Name_NotEmpty_Test() {
        FolderEntity folder = new FolderEntity();
        folder.setFolderName("Test Folder");

        assertFalse(folder.getFolderName().isEmpty());
    }

    @Test
    @DisplayName("TC_UP_008: Folder UUID test")
    void folderEntity_UUID_Test() {
        FolderEntity folder = new FolderEntity();
        folder.setUuid("folder-uuid-abc");

        assertEquals("folder-uuid-abc", folder.getUuid());
        assertNotNull(folder.getUuid());
    }

    @Test
    @DisplayName("Folder rename test")
    void folderEntity_Rename_Test() {
        FolderEntity folder = new FolderEntity();
        folder.setFolderName("Old Name");
        folder.setFolderName("New Name");

        assertEquals("New Name", folder.getFolderName());
    }

    @Test
    @DisplayName("Folder ID test")
    void folderEntity_Id_Test() {
        FolderEntity folder = new FolderEntity();
        folder.setId(1L);

        assertEquals(1L, folder.getId());
    }

    @Test
    @DisplayName("Folder username test")
    void folderEntity_UserName_Test() {
        FolderEntity folder = new FolderEntity();
        folder.setUserName("testuser@koderztechnology.com");

        assertEquals("testuser@koderztechnology.com", folder.getUserName());
    }
}
