package com.medfinder.medfinder_backend.repository;

import com.medfinder.medfinder_backend.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    List<Inventory> findByMedicineId(Long medicineId);
    List<Inventory> findByMedicine_NameContainingIgnoreCase(String name);
    List<Inventory> findByStockLessThan(int stock);
}