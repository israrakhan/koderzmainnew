package com.example.Save.File.Drive.Controllers;

import com.example.Save.File.Drive.Dto.*;
import com.example.Save.File.Drive.Entity.AuthRequest;
import com.example.Save.File.Drive.Entity.RefreshToken;
import com.example.Save.File.Drive.Entity.UserInfo;
import com.example.Save.File.Drive.Repositorys.RefreshTokenRepository;
import com.example.Save.File.Drive.Repositorys.UserInfoRepository;
import com.example.Save.File.Drive.Services.EmailVerificationService;
import com.example.Save.File.Drive.Services.JwtService;
import com.example.Save.File.Drive.Services.RefreshTokenService;
import com.example.Save.File.Drive.Services.UserInfoService;
import jakarta.mail.MessagingException;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/")
@Log4j2
public class UserController {

    private final UserInfoService userInfoService;
    private final UserInfoRepository userInfoRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private  final EmailVerificationService emailVerificationService;
    private final RefreshTokenRepository refreshTokenRepository;



    public UserController(
            UserInfoService userInfoService,
            UserInfoRepository userInfoRepository,
            JwtService jwtService,
            AuthenticationManager authenticationManager, RefreshTokenService refreshTokenService, EmailVerificationService emailVerificationService, RefreshTokenRepository refreshTokenRepository
    ) {
        this.userInfoService = userInfoService;
        this.userInfoRepository = userInfoRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.refreshTokenService = refreshTokenService;
        this.emailVerificationService = emailVerificationService;
        this.refreshTokenRepository = refreshTokenRepository;
    }
    @PostMapping("/register/send-otp")
    public ResponseEntity<String> sendOtp(@RequestBody EmailRequest request) {
        try {
            return ResponseEntity.ok(emailVerificationService.sendOtp(request.getEmail()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody OtpVerifyRequest request) {
        return ResponseEntity.ok(emailVerificationService.verifyOtp(request.getEmail(), request.getOtp()));
    }

    @PostMapping("/register")
    public String addNewUser(@RequestBody UserInfo userInfo) {
        try {
            return userInfoService.addUser(userInfo);
        } catch (UsernameNotFoundException e) {
            return e.getMessage();
        }
    }



    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            if (authRequest.getUsername() == null || authRequest.getPassword() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Email and password are required"));
            }

            Optional<UserInfo> users = userInfoRepository.findByEmail(authRequest.getUsername());

            if (users == null) {
                log.warn("Login attempt with non-existent email: {}", authRequest.getUsername());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid email or password"));
            }

            UserInfo storedUser = users.get();

            if (!storedUser.isEmailVerified()) {
                log.warn("Login attempt with unverified email: {}", authRequest.getUsername());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Email is not verified. Please verify your email."));
            }

            Authentication authentication = authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(
                            authRequest.getUsername(), authRequest.getPassword()
                    ));

            if (authentication.isAuthenticated()) {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();

                String accessToken = jwtService.generateToken(authRequest.getUsername(), userDetails);
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                        storedUser.getEmail(),
                        storedUser.getRoles()
                );

                RefeshTokenRequest response = new RefeshTokenRequest();
                response.setAccessToken(accessToken);
                response.setRefreshToken(refreshToken.getToken());
                
                log.info("User successfully logged in: {}", authRequest.getUsername());
                return ResponseEntity.status(HttpStatus.OK).body(response);
            } else {
                log.warn("Authentication failed for user: {}", authRequest.getUsername());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid email or password"));
            }
        } catch (Exception e) {
            log.error("Login error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Invalid email or password"));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", true);
        response.put("message", message);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }


    @GetMapping("/users/{uuid}")
    public ResponseEntity<UserResponseDTO> getUserByUuid(@PathVariable String uuid) {
        return userInfoRepository.findByUuid(uuid)
                .map(user -> new UserResponseDTO(
                        user.getUuid(),
                        user.getName(),
                        user.getEmail(),
                        user.getRoles(),
                        user.isEmailVerified(),
                        true,
                        user.getCreatedDate()
                ))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/refreshToken")
    public ResponseEntity<?> refreshToken(@RequestBody RefeshTokenRequest request) {
        try {
            Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(request.getRefreshToken());
            if (tokenOpt.isEmpty()) {
                log.warn("Invalid refresh token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid refresh token"));
            }

            RefreshToken token = refreshTokenService.verifyExpiration(tokenOpt.get());

            // Load user details
            UserDetails userDetails = userInfoService.loadUserByUsername(token.getUserEmail());

            // Generate new access token
            String newAccessToken = jwtService.generateToken(token.getUserEmail(), userDetails);

            RefeshTokenRequest response = new RefeshTokenRequest();
            response.setAccessToken(newAccessToken);
            response.setRefreshToken(token.getToken()); // Reuse the refresh token
            
            log.info("Refresh token used successfully for user: {}", token.getUserEmail());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Refresh token expired or invalid: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Refresh token expired"));
        } catch (Exception e) {
            log.error("Error during token refresh: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred during token refresh"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefeshTokenRequest request) {
        try {
            if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isEmpty()) {
                log.warn("Logout attempt with invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Refresh token is required"));
            }

            Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(request.getRefreshToken());
            
            if (tokenOpt.isEmpty()) {
                log.warn("Logout attempt with non-existent refresh token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or expired refresh token"));
            }

            RefreshToken refreshToken = tokenOpt.get();
            
            // Verify that the authenticated user matches the token owner
            String authenticatedUser = getAuthenticatedUserEmail();
            if (authenticatedUser != null && !authenticatedUser.equals(refreshToken.getUserEmail())) {
                log.warn("Logout attempt by user {} for another user's token", authenticatedUser);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Cannot logout another user's session"));
            }
            
            refreshTokenRepository.delete(refreshToken);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Logout successful");
            response.put("timestamp", LocalDateTime.now());
            
            log.info("User successfully logged out: {}", refreshToken.getUserEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error during logout: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred during logout"));
        }
    }

    @PostMapping("/forget-password")
    public ResponseEntity<?> forgetPassword(@RequestBody ForgetPasswordRequest request){
        try {
            String response = emailVerificationService.forgetPassword(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", response,
                    "timestamp", LocalDateTime.now()
            ));
        } catch (RuntimeException e) {
            log.warn("Forget password attempt for non-existent email: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (MessagingException e) {
            log.error("Error sending forget password email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while sending the email"));
        }
    }
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request){

        try {
            String response = emailVerificationService.resetPassword(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", response,
                    "timestamp", LocalDateTime.now()
            ));
        } catch (RuntimeException e) {
            log.warn("Reset password attempt with invalid OTP for email: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        }
    }
    
    private String getAuthenticatedUserEmail() {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            return authentication.getName();
        }
        return null;
    }

}
