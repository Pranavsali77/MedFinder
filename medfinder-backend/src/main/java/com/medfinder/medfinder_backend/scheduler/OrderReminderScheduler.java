package com.medfinder.medfinder_backend.scheduler;

import com.medfinder.medfinder_backend.model.Order;
import com.medfinder.medfinder_backend.model.OrderStatus;
import com.medfinder.medfinder_backend.repository.OrderRepository;
import com.medfinder.medfinder_backend.controller.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class OrderReminderScheduler {

    private final OrderRepository orderRepository;
    private final EmailService emailService;

    public OrderReminderScheduler(OrderRepository orderRepository, EmailService emailService) {
        this.orderRepository = orderRepository;
        this.emailService = emailService;
    }

    // Run every 15 minutes
    @Scheduled(fixedRate = 900000)
    @Transactional
    public void sendPickupReminders() {
        // Find orders older than 60 minutes
        LocalDateTime oneHourAgo = LocalDateTime.now().minusMinutes(60);
        
        List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.READY);

        List<Order> eligibleOrders = orderRepository.findByStatusInAndReminderSentFalseAndOrderDateBefore(activeStatuses, oneHourAgo);

        for (Order order : eligibleOrders) {
            try {
                emailService.sendPickupReminderEmail(order);
                order.setReminderSent(true);
                orderRepository.save(order);
                System.out.println("Sent pickup reminder for order ID: " + order.getId());
            } catch (Exception e) {
                System.err.println("Failed to send reminder for order ID: " + order.getId() + " - " + e.getMessage());
            }
        }
    }
}
