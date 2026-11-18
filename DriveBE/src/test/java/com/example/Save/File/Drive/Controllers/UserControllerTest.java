package com.example.Save.File.Drive.Controllers;

import com.example.Save.File.Drive.Entity.UserInfo;
import com.example.Save.File.Drive.Repositorys.RefreshTokenRepository;
import com.example.Save.File.Drive.Repositorys.UserInfoRepository;
import com.example.Save.File.Drive.Services.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.security.authentication.AuthenticationManager;
import static org.junit.jupiter.api.Assertions.*;

class UserControllerTest {

    @Test
    @DisplayName("TC_006: UserInfo object creation test")
    void userInfo_Creation_Test() {
        UserInfo user = new UserInfo();
        user.setName("Test User");
        user.setEmail("test@koderztechnology.com");
        user.setRoles("ROLE_USER");
        user.setEmailVerified(true);

        assertEquals("Test User", user.getName());
        assertEquals("test@koderztechnology.com", user.getEmail());
        assertEquals("ROLE_USER", user.getRoles());
        assertTrue(user.isEmailVerified());
    }

    @Test
    @DisplayName("TC_007: Unverified user email check")
    void userInfo_EmailVerified_False_Test() {
        UserInfo user = new UserInfo();
        user.setEmail("unverified@koderztechnology.com");
        user.setEmailVerified(false);

        assertFalse(user.isEmailVerified());
    }

    @Test
    @DisplayName("TC_008: User email not null test")
    void userInfo_Email_NotNull_Test() {
        UserInfo user = new UserInfo();
        user.setEmail("testuser@gmail.com");

        assertNotNull(user.getEmail());
    }

    @Test
    @DisplayName("TC_012: User with null email")
    void userInfo_NullEmail_Test() {
        UserInfo user = new UserInfo();
        user.setEmail(null);

        assertNull(user.getEmail());
    }

    @Test
    @DisplayName("User role assignment test")
    void userInfo_Role_Test() {
        UserInfo user = new UserInfo();
        user.setRoles("ROLE_ADMIN");

        assertEquals("ROLE_ADMIN", user.getRoles());
    }

    @Test
    @DisplayName("User name validation test")
    void userInfo_Name_NotEmpty_Test() {
        UserInfo user = new UserInfo();
        user.setName("John Doe");

        assertFalse(user.getName().isEmpty());
    }

    @Test
    @DisplayName("Email format basic check")
    void email_Contains_AtSymbol_Test() {
        String email = "user@koderztechnology.com";
        assertTrue(email.contains("@"));
        assertTrue(email.contains("."));
    }
}
