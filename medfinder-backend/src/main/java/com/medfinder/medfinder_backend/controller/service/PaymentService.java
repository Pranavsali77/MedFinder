package com.medfinder.medfinder_backend.controller.service;

import com.google.zxing.*;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.medfinder.medfinder_backend.model.*;
import com.medfinder.medfinder_backend.repository.*;

import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final EmailService emailService;
    private final InvoiceService invoiceService;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          OrderStatusHistoryRepository historyRepository,
                          EmailService emailService,
                          InvoiceService invoiceService) {

        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.emailService = emailService;
        this.invoiceService = invoiceService;
    }

    // =====================================
    // 💳 CREATE PAYMENT
    // =====================================

    public Payment createPayment(Long orderId, PaymentMethod method) throws Exception {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getInventory() == null) {
            throw new RuntimeException("Inventory missing for this order");
        }

        double amount = order.getQuantity() * order.getInventory().getPrice();

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(amount);
        payment.setMethod(method);
        payment.setStatus(PaymentStatus.PENDING);

        if (method == PaymentMethod.UPI || method == PaymentMethod.CARD) {
            String qrPath = generateQRCode(String.valueOf(amount));
            payment.setQrCodePath(qrPath);
        }

        return paymentRepository.save(payment);
    }

    // =====================================
    // ✅ VERIFY PAYMENT
    // =====================================

    public Payment verifyPayment(Long paymentId) throws Exception {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionId(UUID.randomUUID().toString());

        Order order = payment.getOrder();
        order.setStatus(OrderStatus.CONFIRMED);

        // Save timeline history
        saveStatusHistory(order, OrderStatus.CONFIRMED);

        // Generate invoice
        String invoicePath = invoiceService.generateInvoice(payment);
        payment.setInvoicePath(invoicePath);

        // Send email with invoice (wrapped in try-catch to prevent transactional rollback if email setup is invalid)
        try {
            emailService.sendPaymentSuccessEmailWithInvoice(
                    order.getUser().getEmail(),
                    payment.getAmount(),
                    invoicePath
            );
        } catch (Exception e) {
            System.err.println("Email sending skipped/failed: " + e.getMessage());
        }

        return paymentRepository.save(payment);
    }

    // =====================================
    // 📦 SAVE ORDER STATUS HISTORY
    // =====================================

    private void saveStatusHistory(Order order, OrderStatus status) {

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setStatus(status);
        history.setUpdatedAt(LocalDateTime.now());

        historyRepository.save(history);
    }

    // =====================================
    // 📜 GET PAYMENT HISTORY BY USER
    // =====================================
    public List<Payment> getPaymentsByUser(Long userId) {
    	return paymentRepository.findByOrderUserId(userId);
    }

    // =====================================
    // 📜 GET PAYMENT HISTORY BY ORDER
    // =====================================
    public List<Payment> getPaymentsByOrder(Long orderId) {
    	return paymentRepository.findByOrderId(orderId);
    }

    // =====================================
    // 📜 GET ALL PAYMENTS (ADMIN)
    // =====================================
    public List<Payment> getAllPayments() {
    	return paymentRepository.findAll();
    }
    // =====================================
    // 📱 QR CODE GENERATION
    // =====================================

    private String generateQRCode(String text) throws Exception {

        String folderPath = "uploads";
        File folder = new File(folderPath);

        if (!folder.exists()) {
            folder.mkdirs();
        }

        String fileName = "payment_" + System.currentTimeMillis() + ".png";
        Path path = Paths.get(folderPath, fileName);

        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(
                text,
                BarcodeFormat.QR_CODE,
                250,
                250
        );

        MatrixToImageWriter.writeToPath(bitMatrix, "PNG", path);

        return path.toString();
    }
}