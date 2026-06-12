package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public ResponseEntity<User> getUserById(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return new ResponseEntity<>(user.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public User addUser(User newUser) {
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        newUser.setRole("DEVELOPER");
        return userRepository.save(newUser);
    }

    public Optional<User> findByMail(String mail) {
        return userRepository.findByMail(mail);
    }
    public Optional<User> findByMailIgnoreCase(String mail) {
        return userRepository.findByMailIgnoreCase(mail);
    }

    // Nuevo: buscar por rol para el dropdown de assignees
    public List<User> findByRole(String role) {
        return userRepository.findByRole(role);
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public User createInternalUser(String name, String mail, String role) {
        User user = new User();
        user.setName(name);
        user.setMail(mail);
        user.setRole(role.toUpperCase());
        user.setPassword(passwordEncoder.encode("OCI_LOGIN_DISABLED"));

        return userRepository.save(user);
    }
}