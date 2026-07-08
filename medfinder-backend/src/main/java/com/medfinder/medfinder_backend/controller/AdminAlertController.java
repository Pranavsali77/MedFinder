package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.controller.service.LowStockService;
import com.medfinder.medfinder_backend.model.Inventory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/alerts")
@CrossOrigin
public class AdminAlertController {

    private final LowStockService service;

    public AdminAlertController(LowStockService service) {
        this.service = service;
    }

    // 📊 View Low Stock
    @GetMapping("/low-stock")
    public List<Inventory> getLowStockItems() {
        return service.getLowStockItems();
    }

    // 📧 Trigger Email Alerts
    @PostMapping("/notify-low-stock")
    public String notifyLowStock() {
        service.sendLowStockAlerts();
        return "Low stock alert emails sent successfully!";
    }
}