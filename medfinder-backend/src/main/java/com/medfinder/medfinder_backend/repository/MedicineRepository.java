package com.medfinder.medfinder_backend.repository;

import com.medfinder.medfinder_backend.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    List<Medicine> findByNameContainingIgnoreCase(String name);
    List<Medicine> findByGenericNameIgnoreCase(String genericName);
    List<Medicine> findByGenericNameContainingIgnoreCase(String genericName);
}