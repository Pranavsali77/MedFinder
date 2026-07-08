package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.model.User;
import com.medfinder.medfinder_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    public UserService(UserRepository userRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    public User register(User user) {
        java.util.Optional<User> existing = userRepo.findByEmail(user.getEmail());
        if (existing.isPresent()) {
            throw new RuntimeException("Email is already registered ❌");
        }
        user.setPassword(encoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

    public List<User> getAllUsers() {
        return userRepo.findAll();
    }
    
    public User login(String email, String password) {

        Optional<User> optionalUser = userRepo.findByEmail(email);

        if (optionalUser.isEmpty()) {
            throw new RuntimeException("User not found ❌");
        }

        User user = optionalUser.get();

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password ❌");
        }

        return user;
    }
    public User getUserById(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(Long id, User updatedUser) {
        User existingUser = getUserById(id);
        existingUser.setName(updatedUser.getName());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setAddress(updatedUser.getAddress());
        // Do not update email or password here
        return userRepo.save(existingUser);
    }

    public User updatePassword(Long id, String oldPassword, String newPassword) {
        User existingUser = getUserById(id);
        if (!encoder.matches(oldPassword, existingUser.getPassword())) {
            throw new RuntimeException("Incorrect current password ❌");
        }
        existingUser.setPassword(encoder.encode(newPassword));
        return userRepo.save(existingUser);
    }
}