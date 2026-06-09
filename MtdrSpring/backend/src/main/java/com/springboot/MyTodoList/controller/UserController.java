package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.dto.CurrentUserResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // Nuevo: retorna solo usuarios con rol DEVELOPER (para el dropdown de assignee)
    @GetMapping("/developers")
    public List<User> getDevelopers() {
        return userService.findByRole("DEVELOPER");
    }

    @PostMapping("/register")
    public ResponseEntity<?> addUser(@RequestBody User newUser) {
        try {
            if (userService.findByMail(newUser.getMail()).isPresent()) {
                return new ResponseEntity<>("El correo ya está registrado", HttpStatus.CONFLICT);
            }
            User saved = userService.addUser(newUser);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> userOpt = userService.findByMail(loginRequest.getMail());
        if (userOpt.isEmpty()) {
            return new ResponseEntity<>("Credenciales inválidas", HttpStatus.UNAUTHORIZED);
        }
        User user = userOpt.get();
        if (!userService.checkPassword(loginRequest.getPassword(), user.getPassword())) {
            return new ResponseEntity<>("Credenciales inválidas", HttpStatus.UNAUTHORIZED);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("oracle_id", user.getOracleId());   // <-- snake_case para el frontend
        response.put("name", user.getName());
        response.put("mail", user.getMail());
        response.put("role", user.getRole());
        return ResponseEntity.ok(response);
    }

    //método para que el frontend pueda obtener los datos del usuario autenticado (si es que hay uno)
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("No autenticado", HttpStatus.UNAUTHORIZED);
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof OAuth2User)) {
            return new ResponseEntity<>("Usuario OAuth inválido", HttpStatus.UNAUTHORIZED);
        }

        OAuth2User oauthUser = (OAuth2User) principal;

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        if (email == null || email.isBlank()) {
            return new ResponseEntity<>("OCI no devolvió email", HttpStatus.BAD_REQUEST);
        }

        Optional<User> userOpt = userService.findByMail(email);

        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            User newUser = new User();
            newUser.setMail(email);
            newUser.setName(name != null ? name : email);
            newUser.setPassword("OCI_LOGIN");
            newUser.setRole("DEVELOPER");
            user = userService.addUser(newUser);
        }

        CurrentUserResponse response = new CurrentUserResponse(
                user.getOracleId(),
                user.getName(),
                user.getMail(),
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }
}