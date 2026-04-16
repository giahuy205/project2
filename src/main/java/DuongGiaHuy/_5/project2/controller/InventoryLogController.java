package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.InventoryLog;
import DuongGiaHuy._5.project2.service.InventoryLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventorylogs")
@CrossOrigin(origins = "*")
public class InventoryLogController {
    @Autowired
    private InventoryLogService service;

    @GetMapping
    public List<InventoryLog> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public InventoryLog getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public InventoryLog create(@RequestBody InventoryLog entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public InventoryLog update(@PathVariable Long id, @RequestBody InventoryLog entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
