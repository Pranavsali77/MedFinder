package com.medfinder.medfinder_backend.repository;

import com.medfinder.medfinder_backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.medfinder.medfinder_backend.model.OrderStatus;
import java.time.LocalDateTime;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);

    List<Order> findByStatusInAndReminderSentFalseAndOrderDateBefore(List<OrderStatus> statuses, LocalDateTime date);
}