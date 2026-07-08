package com.medfinder.medfinder_backend.controller.service;

import com.medfinder.medfinder_backend.model.Prescription;
import com.medfinder.medfinder_backend.model.User;
import com.medfinder.medfinder_backend.repository.PrescriptionRepository;
import com.medfinder.medfinder_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepo;
    private final UserRepository userRepo;
    private final MedicineService medicineService;
    private final String uploadDir = "uploads/prescriptions/";

    public PrescriptionService(PrescriptionRepository prescriptionRepo, UserRepository userRepo, MedicineService medicineService) {
        this.prescriptionRepo = prescriptionRepo;
        this.userRepo = userRepo;
        this.medicineService = medicineService;
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public Prescription uploadPrescription(Long userId, MultipartFile file) throws IOException {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir + fileName);
        Files.write(filePath, file.getBytes());

        // Scan prescription using AI
        List<String> medicines = new ArrayList<>();
        try {
            medicines = medicineService.scanPrescription(file);
        } catch (Exception e) {
            System.err.println("Failed to scan prescription during upload: " + e.getMessage());
        }

        Prescription prescription = new Prescription();
        prescription.setUser(user);
        prescription.setFilePath(filePath.toString());
        prescription.setUploadDate(LocalDateTime.now());

        if (medicines != null && !medicines.isEmpty()) {
            prescription.setExtractedMedicines(String.join(", ", medicines));
        }

        return prescriptionRepo.save(prescription);
    }

    public List<Prescription> getUserPrescriptions(Long userId) {
        return prescriptionRepo.findByUserIdOrderByUploadDateDesc(userId);
    }

    public Prescription getPrescriptionById(Long id) {
        return prescriptionRepo.findById(id).orElse(null);
    }

    public Prescription savePrescription(Prescription p) {
        return prescriptionRepo.save(p);
    }
}
