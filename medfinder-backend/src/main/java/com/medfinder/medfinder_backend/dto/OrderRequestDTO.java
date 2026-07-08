package com.medfinder.medfinder_backend.dto;

import com.medfinder.medfinder_backend.model.OrderType;

public class OrderRequestDTO {

    private Long inventoryId;
    private Long userId;
    private int quantity;
    private String address;
    private OrderType orderType;

    public OrderRequestDTO() {}

    public Long getInventoryId() { return inventoryId; }
    public void setInventoryId(Long inventoryId) { this.inventoryId = inventoryId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }
}