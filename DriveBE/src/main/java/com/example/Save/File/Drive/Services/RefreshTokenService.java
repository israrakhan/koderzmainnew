package com.example.Save.File.Drive.Services;

import com.example.Save.File.Drive.Entity.RefreshToken;
import com.example.Save.File.Drive.Repositorys.RefreshTokenRepository;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Log4j2
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepo;
    
    @Value("${jwt.refresh.expiration:604800000}")  // Default: 7 days in milliseconds
    private long refreshTokenExpiration;

    public RefreshToken createRefreshToken(String email, String userType) {
        // Delete any existing refresh tokens for this user (single device session)
        refreshTokenRepo.deleteByUserEmail(email);
        
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUserEmail(email);
        refreshToken.setUserType(userType);
        
        // Use configurable expiration (default 7 days)
        refreshToken.setExpiryDate(Instant.now().plus(refreshTokenExpiration, ChronoUnit.MILLIS));
        
        log.info("Refresh token created for user: {}", email);
        return refreshTokenRepo.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepo.delete(token);
            log.warn("Refresh token expired for user: {}", token.getUserEmail());
            throw new RuntimeException("Refresh Token Expired");
        }
        return token;
    }
}
