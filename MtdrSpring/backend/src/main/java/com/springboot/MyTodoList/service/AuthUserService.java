package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthUserService {

    @Autowired
    private UserService userService;

    public Optional<User> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof OAuth2User)) {
            return Optional.empty();
        }

        OAuth2User oauthUser = (OAuth2User) principal;
        String email = oauthUser.getAttribute("email");

        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        return userService.findByMailIgnoreCase(email);
    }

    public boolean hasRole(Authentication authentication, String role) {
        Optional<User> userOpt = getCurrentUser(authentication);

        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        return role.equalsIgnoreCase(user.getRole());
    }

    public boolean isManager(Authentication authentication) {
        return hasRole(authentication, "MANAGER");
    }

    public boolean isDeveloper(Authentication authentication) {
        return hasRole(authentication, "DEVELOPER");
    }
    public boolean isAdmin(Authentication authentication) {
        return hasRole(authentication, "ADMIN");
    }

    public boolean isManagerOrAdmin(Authentication authentication) {
        return isManager(authentication) || isAdmin(authentication);
    }
}