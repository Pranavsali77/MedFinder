package com.medfinder.medfinder_backend.repository;

import com.medfinder.medfinder_backend.model.Payment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
	List<Payment> findByOrderId(Long orderId);
	List<Payment> findByOrderUserId(Long userId);
	
}