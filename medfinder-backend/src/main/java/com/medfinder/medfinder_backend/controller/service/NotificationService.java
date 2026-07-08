package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.model.Notification;
import com.medfinder.medfinder_backend.model.User;
import com.medfinder.medfinder_backend.repository.NotificationRepository;
import com.medfinder.medfinder_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;

    public NotificationService(NotificationRepository notificationRepo, UserRepository userRepo) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
    }

    public Notification createNotification(Long userId, String title, String message) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepo.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(Long id) {
        Notification notification = notificationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepo.save(notification);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepo.findByUserIdAndIsReadFalse(userId);
        for (Notification notification : unread) {
            notification.setRead(true);
        }
        notificationRepo.saveAll(unread);
    }
}
