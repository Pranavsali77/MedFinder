package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.controller.service.PaymentService;
import com.medfinder.medfinder_backend.model.Payment;
import com.medfinder.medfinder_backend.model.PaymentMethod;

import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    // =====================================
    // 💳 CREATE PAYMENT
    // =====================================
    @PostMapping("/create/{orderId}")
    public Payment createPayment(@PathVariable Long orderId,
                                 @RequestParam PaymentMethod method) throws Exception {

        return service.createPayment(orderId, method);
    }

    // =====================================
    // ✅ VERIFY PAYMENT
    // =====================================
    @PostMapping("/verify/{paymentId}")
    public Payment verifyPayment(@PathVariable Long paymentId) throws Exception {

        return service.verifyPayment(paymentId);
    }
    // =====================================
    // 📜 USER PAYMENT HISTORY
    // =====================================
    @GetMapping("/user/{userId}")
    public List<Payment> getUserPayments(@PathVariable Long userId) {
    	return service.getPaymentsByUser(userId);
    }

    // =====================================
    // 📜 ORDER PAYMENT HISTORY
    // =====================================
    @GetMapping("/order/{orderId}")
    public List<Payment> getOrderPayments(@PathVariable Long orderId) {
    	return service.getPaymentsByOrder(orderId);
    }

    // =====================================
    // 📜 ADMIN - ALL PAYMENTS
    // =====================================
    @GetMapping("/all")
    public List<Payment> getAllPayments() {
    	return service.getAllPayments();
    }
}