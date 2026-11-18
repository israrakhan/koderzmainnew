package com.example.Save.File.Drive.Services;

import com.example.Save.File.Drive.Entity.UserInfo;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.Collections;

public class UserInfoDetails implements UserDetails{

   private UserInfo user;

   public UserInfoDetails(UserInfo user){
       this.user = user;

   }
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
       if(user != null && user.getRoles() != null){
           return Collections.singleton(new SimpleGrantedAuthority(user.getRoles()));
       }
       else return Collections.emptyList();

    }

    @Override
    public @Nullable String getPassword() {
        return user.getPassword();
    }

    public String getName(){
        return user.getName();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }
}
