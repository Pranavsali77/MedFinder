package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.model.User;
import com.medfinder.medfinder_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepo;

    @PostMapping("/login")
    public String login(@RequestBody User user) {

        Optional<User> existingUser = userRepo.findByEmail(user.getEmail());

        if (existingUser.isPresent() &&
            existingUser.get().getPassword().equals(user.getPassword())) {
            return "Login Successful ✅";
        }

        return "Invalid Credentials ❌";
    }
}