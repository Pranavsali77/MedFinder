package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.controller.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import com.medfinder.medfinder_backend.controller.service.DashboardService;
import com.medfinder.medfinder_backend.dto.DashboardStatsDTO;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/stats")
    public DashboardStatsDTO getStats() {
        return service.getDashboardStats();
    }
}