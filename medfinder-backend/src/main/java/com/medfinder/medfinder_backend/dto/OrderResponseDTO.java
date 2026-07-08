package com.medfinder.medfinder_backend.dto;

import java.time.LocalDateTime;

public class OrderResponseDTO {

    private Long orderId;
    private String medicineName;
    private int quantity;
    private String orderType;
    private String status;
    private String deliveryAddress;
    private LocalDateTime orderDate;
    private double price;
    private String pharmacyName;
    private Long userId;
    private String userName;
    private String userEmail;

    public OrderResponseDTO(Long orderId,
                            String medicineName,
                            int quantity,
                            String orderType,
                            String status,
                            String deliveryAddress,
                            LocalDateTime orderDate,
                            double price,
                            String pharmacyName,
                            Long userId,
                            String userName,
                            String userEmail) {

        this.orderId = orderId;
        this.medicineName = medicineName;
        this.quantity = quantity;
        this.orderType = orderType;
        this.status = status;
        this.deliveryAddress = deliveryAddress;
        this.orderDate = orderDate;
        this.price = price;
        this.pharmacyName = pharmacyName;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
    }

    public Long getOrderId() { return orderId; }
    public String getMedicineName() { return medicineName; }
    public int getQuantity() { return quantity; }
    public String getOrderType() { return orderType; }
    public String getStatus() { return status; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public double getPrice() { return price; }
    public String getPharmacyName() { return pharmacyName; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getUserEmail() { return userEmail; }
}