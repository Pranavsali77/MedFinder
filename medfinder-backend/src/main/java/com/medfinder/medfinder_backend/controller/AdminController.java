package com.medfinder.medfinder_backend.controller;

import org.springframework.web.bind.annotation.*;

import com.medfinder.medfinder_backend.controller.service.AdminService;
import com.medfinder.medfinder_backend.model.Order;
import com.medfinder.medfinder_backend.model.Pharmacy;
import com.medfinder.medfinder_backend.model.User;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // 🔹 Pending pharmacies
    @GetMapping("/pharmacies/pending")
    public List<Pharmacy> getPendingPharmacies() {
        return adminService.getPendingPharmacies();
    }

    // 🔹 Approve pharmacy
    @PutMapping("/pharmacy/approve/{id}")
    public Pharmacy approvePharmacy(@PathVariable Long id) {
        return adminService.approvePharmacy(id);
    }

    // 🔹 Reject pharmacy
    @DeleteMapping("/pharmacy/reject/{id}")
    public String rejectPharmacy(@PathVariable Long id) {
        adminService.rejectPharmacy(id);
        return "Pharmacy rejected successfully";
    }

    // 🔹 View all users
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return adminService.getAllUsers();
    }

    // 🔹 View all orders
    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return adminService.getAllOrders();
    }

    // 🔹 Dashboard Analytics
    @GetMapping("/analytics")
    public String analytics() {
        return "Users: " + adminService.totalUsers() +
               ", Pharmacies: " + adminService.totalPharmacies() +
               ", Orders: " + adminService.totalOrders();
    }
}