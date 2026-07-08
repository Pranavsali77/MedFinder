package com.medfinder.medfinder_backend.repository;

import com.medfinder.medfinder_backend.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByUserIdOrderByUploadDateDesc(Long userId);
}
