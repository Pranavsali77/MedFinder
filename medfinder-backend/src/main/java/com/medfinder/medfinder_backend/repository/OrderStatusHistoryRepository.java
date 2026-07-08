package com.medfinder.medfinder_backend.repository;

import com.medfinder.medfinder_backend.model.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderStatusHistoryRepository
        extends JpaRepository<OrderStatusHistory, Long> {

    List<OrderStatusHistory> findByOrderIdOrderByUpdatedAtAsc(Long orderId);
}