package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.dto.OrderRequestDTO;
import com.medfinder.medfinder_backend.dto.OrderResponseDTO;
import com.medfinder.medfinder_backend.model.OrderStatus;
import com.medfinder.medfinder_backend.model.OrderStatusHistory;
import com.medfinder.medfinder_backend.controller.service.OrderService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    // ======================================
    // 📦 PLACE ORDER
    // ======================================

    @PostMapping("/place")
    public OrderResponseDTO placeOrder(@RequestBody OrderRequestDTO request) {

        return service.placeOrder(
                request.getInventoryId(),
                request.getUserId(),
                request.getQuantity(),
                request.getAddress(),
                request.getOrderType()
        );
    }

    // ======================================
    // 👤 GET USER ORDERS
    // ======================================

    @GetMapping("/user/{userId}")
    public List<OrderResponseDTO> getUserOrders(@PathVariable Long userId) {
        return service.getOrdersByUser(userId);
    }

    // ======================================
    // 🌐 GET ALL ORDERS
    // ======================================

    @GetMapping
    public List<OrderResponseDTO> getAllOrders() {
        return service.getAllOrders();
    }

    // ======================================
    // 🏥 GET PHARMACY ORDERS
    // ======================================

    @GetMapping("/pharmacy/{pharmacyId}")
    public List<OrderResponseDTO> getPharmacyOrders(@PathVariable Long pharmacyId) {
        return service.getOrdersByPharmacy(pharmacyId);
    }

    // ======================================
    // 🔄 UPDATE ORDER STATUS (ADMIN)
    // ======================================

    @PutMapping("/status/{orderId}")
    public OrderResponseDTO updateStatus(
            @PathVariable Long orderId,
            @RequestParam OrderStatus status) {

        return service.updateStatus(orderId, status);
    }

    // ======================================
    // 📍 GET DELIVERY TRACKING TIMELINE
    // ======================================

    @GetMapping("/tracking/{orderId}")
    public List<OrderStatusHistory> getTracking(@PathVariable Long orderId) {
        return service.getTracking(orderId);
    }

    // ======================================
    // 👥 GET PHARMACY CUSTOMERS
    // ======================================

    @GetMapping("/pharmacy/{pharmacyId}/customers")
    public List<com.medfinder.medfinder_backend.model.User> getPharmacyCustomers(@PathVariable Long pharmacyId) {
        return service.getCustomersByPharmacy(pharmacyId);
    }
}