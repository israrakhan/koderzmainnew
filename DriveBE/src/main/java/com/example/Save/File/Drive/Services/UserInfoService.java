package com.example.Save.File.Drive.Services;



import com.example.Save.File.Drive.Entity.UserInfo;
import com.example.Save.File.Drive.Repositorys.UserInfoRepository;
import lombok.extern.log4j.Log4j2;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Log4j2
public class UserInfoService  implements UserDetailsService {

    private final UserInfoRepository repository;
    private final PasswordEncoder encoder ;
   // private final BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder(12);
    private final EmailVerificationService emailVerificationService;

    @Autowired
    public UserInfoService(UserInfoRepository repository, EmailVerificationService emailVerificationService) {
        this.repository = repository;
        this.encoder = new BCryptPasswordEncoder(12);
        this.emailVerificationService = emailVerificationService;
    }

    // Method to load user details by username (email)
    @Override
    public UserDetails loadUserByUsername(@NonNull String userEmail) throws UsernameNotFoundException {
        Optional<UserInfo> users = repository.findByEmail(userEmail);
        log.debug("Loading user by email: {}", userEmail);


        // Convert UserInfo to UserDetails (UserInfoDetails)
        UserInfo user = users.get();
        return new UserInfoDetails(user);
    }

    // Add any additional methods for registering or managing users
    public String addUser(UserInfo userInfo) {
        if (!repository.findByEmail(userInfo.getEmail()).isEmpty()) {
            return "User already exists with email: " + userInfo.getEmail();
        }
        if(!emailVerificationService.isEmailVerified(userInfo.getEmail())){
            return "Please verify email first";
        }

        // Encrypt password before saving
        userInfo.setPassword(encoder.encode(userInfo.getPassword()));
        userInfo.setEmailVerified(true);
        repository.save(userInfo);
        return "User added successfully!";
    }

}
