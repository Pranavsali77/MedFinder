package com.medfinder.medfinder_backend.controller;

import com.medfinder.medfinder_backend.model.Inventory;
import com.medfinder.medfinder_backend.repository.InventoryRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin
public class InventoryController {

    private final InventoryRepository repository;

    public InventoryController(InventoryRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public Inventory addInventory(@RequestBody Inventory inventory) {
        return repository.save(inventory);
    }

    @GetMapping
    public List<Inventory> getAll() {
        return repository.findAll();
    }

    @DeleteMapping("/{id}")
    public void deleteInventory(@PathVariable Long id) {
        repository.deleteById(id);
    }
}