package com.medfinder.medfinder_backend.repository;

import com.medfinder.medfinder_backend.model.Pharmacy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {

    List<Pharmacy> findByApprovedFalse();

    List<Pharmacy> findByApprovedTrue();

    Pharmacy findByEmail(String email);
}