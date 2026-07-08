package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.model.Pharmacy;
import com.medfinder.medfinder_backend.repository.PharmacyRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PharmacyService {

    private final PharmacyRepository pharmacyRepo;

    public PharmacyService(PharmacyRepository pharmacyRepo) {
        this.pharmacyRepo = pharmacyRepo;
    }

    // ⭐ Calculate distance between two locations (km)
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

    // ⭐ Find nearby pharmacies
    public List<Pharmacy> findNearby(double lat, double lng, double radiusKm) {

        List<Pharmacy> all = pharmacyRepo.findByApprovedTrue();
        List<Pharmacy> nearby = new ArrayList<>();

        for (Pharmacy p : all) {

            double distance = calculateDistance(
                    lat, lng,
                    p.getLatitude(),
                    p.getLongitude()
            );

            if (distance <= radiusKm) {
                nearby.add(p);
            }
        }

        return nearby;
    }
}