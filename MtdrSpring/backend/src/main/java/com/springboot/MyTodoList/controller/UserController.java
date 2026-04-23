package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}