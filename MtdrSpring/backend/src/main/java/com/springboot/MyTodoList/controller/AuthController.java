package com.springboot.MyTodoList.controller;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class AuthController {

    @GetMapping("/auth/status")
    public Map<String, Object> status(Authentication authentication) {
        Map<String, Object> response = new LinkedHashMap<>();

        boolean authenticated =
                authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        response.put("authenticated", authenticated);

        if (!authenticated) {
            return response;
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof OAuth2User) {
            OAuth2User oauthUser = (OAuth2User) principal;

            response.put("name", oauthUser.getName());
            response.put("attributes", oauthUser.getAttributes());

            return response;
        }

        response.put("name", authentication.getName());
        return response;
    }
}