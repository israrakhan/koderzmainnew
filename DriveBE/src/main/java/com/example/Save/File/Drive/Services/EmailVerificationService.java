package com.example.Save.File.Drive.Services;

import com.example.Save.File.Drive.Dto.ForgetPasswordRequest;
import com.example.Save.File.Drive.Dto.ResetPasswordRequest;
import com.example.Save.File.Drive.Entity.EmailOtpEntity;
import com.example.Save.File.Drive.Entity.UserInfo;
import com.example.Save.File.Drive.Repositorys.EmailOtpRepository;
import com.example.Save.File.Drive.Repositorys.UserInfoRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;


@Service
public class EmailVerificationService {

    private final EmailOtpRepository emailOtpRepository;
    private  final UserInfoRepository userInfoRepository;
    private final MailService mailService;
    private final Set<String> allowedDomains;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_EXPIRY_SECONDS = 300; // 5 minutes
     private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);




    public EmailVerificationService(
            EmailOtpRepository emailOtpRepository,
            UserInfoRepository userInfoRepository,
            MailService mailService,
            @Value("${app.allowed-domains}") String allowedDomains
    ) {
        this.emailOtpRepository = emailOtpRepository;
        this.userInfoRepository = userInfoRepository;
        this.mailService = mailService;
        this.allowedDomains = Arrays.stream(allowedDomains.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }
    public String sendOtp(String email) throws MessagingException {
        validateDomain(email);

        String otp = generateOtp();

        EmailOtpEntity emailOtpEntity = emailOtpRepository.findByEmail(email)
                .orElse(new EmailOtpEntity());

        emailOtpEntity.setEmail(email);
        emailOtpEntity.setOtp(otp);
        emailOtpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        emailOtpEntity.setVerified(false);

        emailOtpRepository.save(emailOtpEntity);
        mailService.sendOtpMail(email, otp);

        return "OTP sent successfully to " + email;
    }

    public String verifyOtp(String email, String otp) {
        Optional<EmailOtpEntity> otpOptional = emailOtpRepository.findByEmail(email);

        if (otpOptional.isEmpty()) {
            return "OTP not found for email: " + email;
        }

        EmailOtpEntity emailOtpEntity = otpOptional.get();

        if (emailOtpEntity.isVerified()) {
            return "Email already verified";
        }

        if (LocalDateTime.now().isAfter(emailOtpEntity.getExpiryTime())) {
            return "OTP expired";
        }

        if (!emailOtpEntity.getOtp().equals(otp)) {
            return "Invalid OTP";
        }

        emailOtpEntity.setVerified(true);
        emailOtpRepository.save(emailOtpEntity);

        return "Email verified successfully";
    }

    public String forgetPassword(ForgetPasswordRequest request) throws MessagingException {
        UserInfo userInfo =   userInfoRepository.findByEmail(request.getEmail())
                .orElseThrow(()-> new RuntimeException("Email not found"));

        if(!userInfo.isEmailVerified()){
            return "Please verify email first";
        }

        String otp = generateOtp();
        userInfo.setResetOtp(otp);
        userInfo.setResetOtpCreatedAt(LocalDateTime.now());
        userInfoRepository.save(userInfo);

        mailService.sendOtpMail(request.getEmail(), otp);


        return "Password reset OTP sent successfully to " + request.getEmail();
    }

    public String resetPassword(ResetPasswordRequest request){

        UserInfo userInfo = userInfoRepository.findByEmail(request.getEmail())
                .orElseThrow(()-> new RuntimeException("Email not found"));

        if(userInfo.getResetOtp() == null || !userInfo.getResetOtp().equals(request.getOtp())){
            return "Invalid OTP";
        }

        if(isOtpExpired(userInfo.getResetOtpCreatedAt())){
            clearResetOtp(userInfo);
            return "OTP expired";
        }
        if(!isOtpValid(request.getOtp(), userInfo.getResetOtp())){
            return "Invalid OTP";
        }

        if(encoder.matches(request.getNewPassword(), userInfo.getPassword())){
            return "New password cannot be the same as the old password";
        }

        userInfo.setPassword(encoder.encode(request.getNewPassword()));
        clearResetOtp(userInfo);
        userInfoRepository.save(userInfo);

        return "Password reset successfully";

    }

    public boolean isEmailVerified(String email) {
        Optional<EmailOtpEntity> otpOptional = emailOtpRepository.findByEmail(email);
        return otpOptional.isPresent() && otpOptional.get().isVerified();
    }

    public void validateDomain(String email) {
        if (email == null || !email.contains("@")) {
            throw new RuntimeException("Invalid email format");
        }

        String domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();

        if (!allowedDomains.contains(domain)) {
            throw new RuntimeException("Email domain is not allowed");
        }
    }

    private String generateOtp() {
        return String.format("%06d",
                //  new Random().nextInt(1_000_000));
                SECURE_RANDOM.nextInt(1_000_000));
    }
    private boolean isOtpExpired(LocalDateTime createdAt) {
        if (createdAt == null) {
            return true;
        }
        return Duration.between(createdAt, LocalDateTime.now())
                .getSeconds() > OTP_EXPIRY_SECONDS;
    }
    private void clearResetOtp(UserInfo userInfo) {
        userInfo.setResetOtp(null);
        userInfo.setResetOtpCreatedAt(null);
    }

    private boolean isOtpValid(String provided, String stored) {
        if (provided == null || stored == null) {
            return false;
        }
        byte[] providedBytes = provided.getBytes(StandardCharsets.UTF_8);
        byte[] storedBytes = stored.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(providedBytes, storedBytes);
    }

}
