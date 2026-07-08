package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.model.Pharmacy;
import com.medfinder.medfinder_backend.repository.PharmacyRepository;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacies")
@CrossOrigin
public class PharmacyController {

    private final PharmacyRepository pharmacyRepo;

    public PharmacyController(PharmacyRepository pharmacyRepo) {
        this.pharmacyRepo = pharmacyRepo;
    }

    // 🔹 Register Pharmacy
    @PostMapping("/register")
    public Pharmacy register(@RequestBody Pharmacy pharmacy) {
        if (pharmacy.getEmail() != null) {
            Pharmacy existing = pharmacyRepo.findByEmail(pharmacy.getEmail());
            if (existing != null) {
                return existing;
            }
        }
        return pharmacyRepo.save(pharmacy);
    }

    // 🔹 View all pharmacies
    @GetMapping
    public List<Pharmacy> getAll() {
        return pharmacyRepo.findAll();
    }

    // ⭐ NEW FEATURE: FIND NEARBY PHARMACIES

    @GetMapping("/nearby")
    public List<Pharmacy> findNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radius) {

        List<Pharmacy> all = pharmacyRepo.findByApprovedTrue();
        List<Pharmacy> nearby = new ArrayList<>();

        for (Pharmacy p : all) {

            double distance = calculateDistance(
                    lat, lng,
                    p.getLatitude(),
                    p.getLongitude()
            );

            if (distance <= radius) {
                nearby.add(p);
            }
        }

        return nearby;
    }

    // ⭐ Distance calculation (Haversine formula)
    private double calculateDistance(double lat1, double lon1,
                                     double lat2, double lon2) {

        final int R = 6371; // Earth radius in KM

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat/2) * Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2)
                * Math.sin(dLon/2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}