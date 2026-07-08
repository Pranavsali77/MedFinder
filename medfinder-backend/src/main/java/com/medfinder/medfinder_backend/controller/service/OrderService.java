package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.model.*;
import com.medfinder.medfinder_backend.repository.*;
import com.medfinder.medfinder_backend.dto.*;

import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceService invoiceService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public OrderService(OrderRepository orderRepository,
                        InventoryRepository inventoryRepository,
                        UserRepository userRepository,
                        OrderStatusHistoryRepository historyRepository,
                        PaymentRepository paymentRepository,
                        InvoiceService invoiceService,
                        EmailService emailService,
                        NotificationService notificationService) {

        this.orderRepository = orderRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceService = invoiceService;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    // ==============================
    // 📦 PLACE ORDER
    // ==============================

    public OrderResponseDTO placeOrder(Long inventoryId,
                                       Long userId,
                                       int quantity,
                                       String address,
                                       OrderType orderType) {

        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        if (inventory.getStock() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        inventory.setStock(inventory.getStock() - quantity);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setInventory(inventory);
        order.setUser(user);
        order.setQuantity(quantity);
        order.setDeliveryAddress(address);
        order.setOrderType(orderType);
        order.setStatus(OrderStatus.PLACED);
        order.setOrderDate(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);

        // Save first timeline entry
        saveHistory(savedOrder, OrderStatus.PLACED);

        // Send confirmation email asynchronously (or catch exception so it doesn't fail the order)
        try {
            emailService.sendOrderConfirmationEmail(savedOrder);
        } catch (Exception e) {
            System.err.println("Failed to send order confirmation email: " + e.getMessage());
        }

        try {
            notificationService.createNotification(
                user.getId(),
                "Order Placed Successfully",
                "Your order #" + savedOrder.getId() + " has been placed and is currently " + OrderStatus.PLACED.name() + "."
            );
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }

        return convertToDTO(savedOrder);
    }

    // ==============================
    // 🔄 UPDATE ORDER STATUS
    // ==============================

    public OrderResponseDTO updateStatus(Long orderId, OrderStatus status) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status);
        orderRepository.save(order);

        if (status == OrderStatus.CANCELLED) {
            Inventory inventory = order.getInventory();
            if (inventory != null) {
                inventory.setStock(inventory.getStock() + order.getQuantity());
                inventoryRepository.save(inventory);
            }
        }

        // If the order is successfully picked up (DELIVERED), ensure any pending payment is marked SUCCESS
        if (status == OrderStatus.DELIVERED) {
            List<Payment> payments = paymentRepository.findByOrderId(orderId);
            for (Payment p : payments) {
                if (p.getStatus() == PaymentStatus.PENDING) {
                    p.setStatus(PaymentStatus.SUCCESS);
                    p.setTransactionId(java.util.UUID.randomUUID().toString());
                    
                    try {
                        String invoicePath = invoiceService.generateInvoice(p);
                        p.setInvoicePath(invoicePath);
                        
                        try {
                            emailService.sendPaymentSuccessEmailWithInvoice(
                                    order.getUser().getEmail(),
                                    p.getAmount(),
                                    invoicePath
                            );
                        } catch (Exception emailEx) {
                            System.err.println("Email sending failed on pickup: " + emailEx.getMessage());
                        }
                    } catch (Exception invoiceEx) {
                        System.err.println("Invoice generation failed on pickup: " + invoiceEx.getMessage());
                    }
                    
                    paymentRepository.save(p);
                }
            }
        }

        saveHistory(order, status);

        try {
            notificationService.createNotification(
                order.getUser().getId(),
                "Order Status Updated",
                "Your order #" + order.getId() + " status has been updated to " + status.name() + "."
            );
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }

        return convertToDTO(order);
    }

    // ==============================
    // 📍 GET TRACKING TIMELINE
    // ==============================

    public List<OrderStatusHistory> getTracking(Long orderId) {
        return historyRepository.findByOrderIdOrderByUpdatedAtAsc(orderId);
    }

    // ==============================
    // 👤 GET USER ORDERS
    // ==============================

    public List<OrderResponseDTO> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ==============================
    // 🌐 GET ALL ORDERS (ADMIN)
    // ==============================

    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ==============================
    // 🏥 GET PHARMACY ORDERS
    // ==============================

    public List<OrderResponseDTO> getOrdersByPharmacy(Long pharmacyId) {
        return orderRepository.findAll()
                .stream()
                .filter(o -> o.getInventory() != null && o.getInventory().getPharmacy() != null && o.getInventory().getPharmacy().getId().equals(pharmacyId))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ==============================
    // 👥 GET PHARMACY CUSTOMERS
    // ==============================

    public List<User> getCustomersByPharmacy(Long pharmacyId) {
        return orderRepository.findAll()
                .stream()
                .filter(o -> o.getInventory() != null && o.getInventory().getPharmacy() != null && o.getInventory().getPharmacy().getId().equals(pharmacyId))
                .map(Order::getUser)
                .filter(u -> u != null)
                .distinct()
                .collect(Collectors.toList());
    }

    // ==============================
    // 🧾 PRIVATE HELPER METHODS
    // ==============================

    private void saveHistory(Order order, OrderStatus status) {

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setStatus(status);
        history.setUpdatedAt(LocalDateTime.now());

        historyRepository.save(history);
    }

    private OrderResponseDTO convertToDTO(Order order) {

        String medicineName = null;
        double price = 0;
        String pharmacyName = null;

        if (order.getInventory() != null) {
            price = order.getInventory().getPrice();
            if (order.getInventory().getMedicine() != null) {
                medicineName = order.getInventory().getMedicine().getName();
            }
            if (order.getInventory().getPharmacy() != null) {
                pharmacyName = order.getInventory().getPharmacy().getName();
            }
        }

        String orderTypeName = null;

        if (order.getOrderType() != null) {
            orderTypeName = order.getOrderType().name();
        }

        return new OrderResponseDTO(
                order.getId(),
                medicineName,
                order.getQuantity(),
                orderTypeName,
                order.getStatus().name(),
                order.getDeliveryAddress(),
                order.getOrderDate(),
                price,
                pharmacyName,
                order.getUser() != null ? order.getUser().getId() : null,
                order.getUser() != null ? order.getUser().getName() : null,
                order.getUser() != null ? order.getUser().getEmail() : null
        );
    }
}