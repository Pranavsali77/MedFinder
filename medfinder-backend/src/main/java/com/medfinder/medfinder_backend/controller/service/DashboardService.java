package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.dto.DashboardStatsDTO;
import com.medfinder.medfinder_backend.model.Inventory;
import com.medfinder.medfinder_backend.repository.*;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;

    public DashboardService(OrderRepository orderRepository,
                            UserRepository userRepository,
                            InventoryRepository inventoryRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public DashboardStatsDTO getDashboardStats() {

        long totalOrders = orderRepository.count();
        long totalUsers = userRepository.count();

        // Revenue = sum(quantity * price)
        double totalRevenue = orderRepository.findAll()
                .stream()
                .filter(order -> order.getInventory() != null)
                .mapToDouble(order ->
                        order.getQuantity() *
                        order.getInventory().getPrice())
                .sum();

        // Low stock (less than 10 items)
        long lowStockCount = inventoryRepository.findAll()
                .stream()
                .filter(inv -> inv.getStock() < 10)
                .count();

        return new DashboardStatsDTO(
                totalOrders,
                totalRevenue,
                totalUsers,
                lowStockCount
        );
    }
}