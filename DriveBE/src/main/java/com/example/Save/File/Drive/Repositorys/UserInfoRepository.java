package com.example.Save.File.Drive.Repositorys;

import com.example.Save.File.Drive.Entity.UserInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserInfoRepository  extends JpaRepository<UserInfo,Long> {
    Optional<UserInfo> findByEmail(String email);
    Optional<UserInfo> findByUuid(String uuid);

}
