package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.model.Inventory;
import com.medfinder.medfinder_backend.repository.InventoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LowStockService {

    private final InventoryRepository inventoryRepository;
    private final EmailService emailService;

    public LowStockService(InventoryRepository inventoryRepository,
                           EmailService emailService) {
        this.inventoryRepository = inventoryRepository;
        this.emailService = emailService;
    }

    // 🔎 Detect low stock
    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findByStockLessThan(10);
    }

    // 📧 Send alert to pharmacy owner
    public void sendLowStockAlerts() {

        List<Inventory> lowStockItems = getLowStockItems();

        for (Inventory inventory : lowStockItems) {

            String email = inventory.getPharmacy().getEmail();
            String medicineName = inventory.getMedicine().getName();
            int stock = inventory.getStock();

            String message = "⚠ Low Stock Alert\n\n" +
                    "Medicine: " + medicineName +
                    "\nCurrent Stock: " + stock +
                    "\nPlease refill immediately.";

            emailService.sendSimpleEmail(
                    email,
                    "Low Stock Alert - " + medicineName,
                    message
            );
        }
    }
}