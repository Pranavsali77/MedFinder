package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.model.*;
import com.medfinder.medfinder_backend.controller.service.MedicineService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    // 🔹 Add new medicine (Admin)
    @PostMapping
    public Medicine addMedicine(@RequestBody Medicine medicine) {
        return medicineService.addMedicine(medicine);
    }

    // 🔹 Get all medicines
    @GetMapping
    public List<Medicine> getAllMedicines() {
        return medicineService.getAllMedicines();
    }

    // 🔹 Update medicine (Admin)
    @PutMapping("/{id}")
    public Medicine updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        return medicineService.updateMedicine(id, medicine);
    }

    // 🔹 Delete medicine (Admin)
    @DeleteMapping("/{id}")
    public void deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
    }

    // 🔹 Search medicine by name (User)
    @GetMapping("/search")
    public List<Medicine> searchMedicine(@RequestParam String name) {
        return medicineService.searchMedicine(name);
    }

    // 🔹 Add inventory (Pharmacy stock)
    @PostMapping("/inventory")
    public Inventory addInventory(@RequestBody Inventory inventory) {
        return medicineService.addInventory(inventory);
    }

    // 🔹 Get availability by medicine ID
    @GetMapping("/{medicineId}/availability")
    public List<Inventory> getAvailability(@PathVariable Long medicineId) {
        return medicineService.getInventoryByMedicine(medicineId);
    }

    // =====================================================
    // ⭐ FEATURE: Medicine Availability by Location
    // =====================================================

    @GetMapping("/nearby")
    public List<Inventory> findMedicineNearby(
            @RequestParam String name,
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radius) {

        return medicineService.findMedicineNearby(
                name, lat, lng, radius);
    }

    // =====================================================
    // ⭐ NEW FEATURE: AI Alternative Medicine Finder
    // =====================================================

    @GetMapping("/alternatives")
    public List<Medicine> getAlternatives(
            @RequestParam String name) {

        return medicineService.findAlternatives(name);
    }

    @GetMapping("/alternatives-inventory")
    public List<Inventory> getAlternativesWithStock(
            @RequestParam String name) {
        return medicineService.findAlternativesWithStock(name);
    }

    @GetMapping("/disease-search")
    public List<Inventory> searchByDisease(
            @RequestParam String query) {
        return medicineService.findInventoriesByDisease(query);
    }

    @GetMapping("/ai-suggest")
    public String getAiSuggestion(@RequestParam String query, @RequestParam(required = false, defaultValue = "en") String lang) {
        return medicineService.getAiSuggestion(query, lang);
    }

    @PostMapping("/scan-prescription")
    public List<String> scanPrescription(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return medicineService.scanPrescription(file);
    }
}