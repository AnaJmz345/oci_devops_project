package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.dto.CurrentUserResponse;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.springboot.MyTodoList.service.AuthUserService;

import com.springboot.MyTodoList.dto.CreateUserRequest;
import com.springboot.MyTodoList.service.AuthUserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthUserService authUserService;

    @GetMapping
    public ResponseEntity<?> getAllUsers(Authentication authentication) {
        if (!authUserService.isManagerOrAdmin(authentication)) {
            return new ResponseEntity<>("No tienes permisos para ver usuarios.", HttpStatus.FORBIDDEN);
        }

        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/developers")
    public List<User> getDevelopers() {
        return userService.findByRole("DEVELOPER");
    }

    @PostMapping("/register")
    public ResponseEntity<?> addUser(@RequestBody User newUser) {
        return new ResponseEntity<>(
                "El registro publico esta deshabilitado. Contacta a un manager o admin.",
                HttpStatus.GONE
        );
    }

    /*
    @PostMapping("/register")
    public ResponseEntity<?> addUser(@RequestBody User newUser) {
        try {
            if (userService.findByMailIgnoreCase(newUser.getMail()).isPresent()) {
                return new ResponseEntity<>("El correo ya esta registrado", HttpStatus.CONFLICT);
            }
            User saved = userService.addUser(newUser);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }*/

    @PostMapping
    public ResponseEntity<?> createInternalUser(
            @RequestBody CreateUserRequest request,
            Authentication authentication) {

        if (!authUserService.isManagerOrAdmin(authentication)) {
            return new ResponseEntity<>("No tienes permisos para crear usuarios.", HttpStatus.FORBIDDEN);
        }

        if (request.getName() == null || request.getName().isBlank()
                || request.getMail() == null || request.getMail().isBlank()
                || request.getRole() == null || request.getRole().isBlank()) {
            return new ResponseEntity<>("Name, mail y role son obligatorios.", HttpStatus.BAD_REQUEST);
        }

        String role = request.getRole().toUpperCase();

        if (!role.equals("ADMIN") && !role.equals("MANAGER") && !role.equals("DEVELOPER")) {
            return new ResponseEntity<>("Rol invalido.", HttpStatus.BAD_REQUEST);
        }

        if (userService.findByMailIgnoreCase(request.getMail()).isPresent()) {
            return new ResponseEntity<>("El correo ya esta registrado.", HttpStatus.CONFLICT);
        }

        User saved = userService.createInternalUser(
                request.getName(),
                request.getMail(),
                role
        );

        CurrentUserResponse response = new CurrentUserResponse(
                saved.getOracleId(),
                saved.getName(),
                saved.getMail(),
                saved.getRole()
        );

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        return new ResponseEntity<>(
                "El login local esta deshabilitado. Usa OCI.",
                HttpStatus.GONE
        );
    }
    /* 
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> userOpt = userService.findByMailIgnoreCase(loginRequest.getMail());
        if (userOpt.isEmpty()) {
            return new ResponseEntity<>("Credenciales invalidas", HttpStatus.UNAUTHORIZED);
        }

        User user = userOpt.get();
        if (!userService.checkPassword(loginRequest.getPassword(), user.getPassword())) {
            return new ResponseEntity<>("Credenciales invalidas", HttpStatus.UNAUTHORIZED);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("oracle_id", user.getOracleId());
        response.put("name", user.getName());
        response.put("mail", user.getMail());
        response.put("role", user.getRole());
        return ResponseEntity.ok(response);
    }
    */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("No autenticado", HttpStatus.UNAUTHORIZED);
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof OAuth2User)) {
            return new ResponseEntity<>("Usuario OAuth invalido", HttpStatus.UNAUTHORIZED);
        }

        OAuth2User oauthUser = (OAuth2User) principal;
        String email = oauthUser.getAttribute("email");

        if (email == null || email.isBlank()) {
            return new ResponseEntity<>("OCI no devolvio email", HttpStatus.BAD_REQUEST);
        }

        Optional<User> userOpt = userService.findByMailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            return new ResponseEntity<>(
                    "Tu cuenta de OCI esta autenticada, pero no existe en Vantage.",
                    HttpStatus.FORBIDDEN
            );
        }

        User user = userOpt.get();
        CurrentUserResponse response = new CurrentUserResponse(
                user.getOracleId(),
                user.getName(),
                user.getMail(),
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }
}
