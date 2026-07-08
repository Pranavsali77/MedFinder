package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.controller.service.PrescriptionService;
import com.medfinder.medfinder_backend.controller.service.MedicineService;
import com.medfinder.medfinder_backend.model.Prescription;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "http://localhost:5173")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final MedicineService medicineService;

    public PrescriptionController(PrescriptionService prescriptionService, MedicineService medicineService) {
        this.prescriptionService = prescriptionService;
        this.medicineService = medicineService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Prescription> uploadPrescription(@RequestParam("userId") Long userId,
                                                         @RequestParam("file") MultipartFile file) {
        try {
            Prescription saved = prescriptionService.uploadPrescription(userId, file);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/user/{userId}")
    public List<Prescription> getUserPrescriptions(@PathVariable Long userId) {
        return prescriptionService.getUserPrescriptions(userId);
    }

    @PostMapping("/{id}/scan")
    public ResponseEntity<Prescription> scanExistingPrescription(@PathVariable Long id) {
        try {
            Prescription prescription = prescriptionService.getPrescriptionById(id);
            if (prescription == null) {
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(prescription.getFilePath()));
            List<String> medicines = medicineService.scanPrescription(fileContent);

            if (medicines != null && !medicines.isEmpty()) {
                prescription.setExtractedMedicines(String.join(", ", medicines));
                Prescription saved = prescriptionService.savePrescription(prescription);
                return ResponseEntity.ok(saved);
            }

            return ResponseEntity.ok(prescription);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
