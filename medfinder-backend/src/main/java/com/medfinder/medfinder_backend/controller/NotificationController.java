package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.controller.service.NotificationService;
import com.medfinder.medfinder_backend.model.Notification;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/user/{userId}")
    public List<Notification> getUserNotifications(@PathVariable Long userId) {
        return notificationService.getUserNotifications(userId);
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }

    @PutMapping("/user/{userId}/read-all")
    public void markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
    }
}
