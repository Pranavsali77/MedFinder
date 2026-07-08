package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.controller.service.UserService;
import com.medfinder.medfinder_backend.model.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 🔹 Register user
    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.register(user);
    }

    // 🔹 Get all users (Admin use)
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
    
    @PostMapping("/login")
    public User login(@RequestBody User loginRequest) {
        return userService.login(loginRequest.getEmail(), loginRequest.getPassword());
    }

    // 🔹 Get user by id
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // 🔹 Update user profile
    @PutMapping("/{id}")
    public User updateProfile(@PathVariable Long id, @RequestBody User user) {
        return userService.updateProfile(id, user);
    }

    // 🔹 Update user password
    @PutMapping("/{id}/password")
    public User updatePassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> passwords) {
        return userService.updatePassword(id, passwords.get("oldPassword"), passwords.get("newPassword"));
    }
}