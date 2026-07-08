package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.controller.service.DrugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drugs")
@CrossOrigin(origins = "*") // allow frontend calls
public class DrugController {

    @Autowired
    private DrugService drugService;

    // 🔎 Search by Generic Name
    @GetMapping("/generic/{name}")
    public String getDrugByGenericName(@PathVariable String name) {
        return drugService.searchDrugByGenericName(name);
    }

    // 💊 Search by Brand Name
    @GetMapping("/brand/{name}")
    public String getDrugByBrandName(@PathVariable String name) {
        return drugService.searchDrugByBrandName(name);
    }
}