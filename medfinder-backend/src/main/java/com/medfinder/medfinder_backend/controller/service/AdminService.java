package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.model.Order;
import com.medfinder.medfinder_backend.model.Pharmacy;
import com.medfinder.medfinder_backend.model.User;
import com.medfinder.medfinder_backend.repository.OrderRepository;
import com.medfinder.medfinder_backend.repository.PharmacyRepository;
import com.medfinder.medfinder_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final PharmacyRepository pharmacyRepo;
    private final UserRepository userRepo;
    private final OrderRepository orderRepo;

    public AdminService(PharmacyRepository pharmacyRepo,
                        UserRepository userRepo,
                        OrderRepository orderRepo) {
        this.pharmacyRepo = pharmacyRepo;
        this.userRepo = userRepo;
        this.orderRepo = orderRepo;
    }

    // 🔹 Get pharmacies waiting for approval
    public List<Pharmacy> getPendingPharmacies() {
        return pharmacyRepo.findByApprovedFalse();
    }

    // 🔹 Approve pharmacy
    public Pharmacy approvePharmacy(Long id) {
        Pharmacy pharmacy = pharmacyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found"));

        pharmacy.setApproved(true);
        return pharmacyRepo.save(pharmacy);
    }

    // 🔹 Reject/Delete pharmacy
    public void rejectPharmacy(Long id) {
        pharmacyRepo.deleteById(id);
    }

    // 🔹 View all users
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    // 🔹 View all orders
    public List<Order> getAllOrders() {
        return orderRepo.findAll();
    }

    // 🔹 Analytics (basic)
    public long totalUsers() {
        return userRepo.count();
    }

    public long totalPharmacies() {
        return pharmacyRepo.count();
    }

    public long totalOrders() {
        return orderRepo.count();
    }
}