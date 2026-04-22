package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.ImportItem;
import DuongGiaHuy._5.project2.service.ImportItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/importitems")
@CrossOrigin(origins = "*")
public class ImportItemController {
    @Autowired
    private ImportItemService service;

    @GetMapping
    public List<ImportItem> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ImportItem getById(@PathVariable Long id) {
        return service.findById(id);
    }
    
    @GetMapping("/import/{importId}")
    public List<ImportItem> getByImportId(@PathVariable Long importId) {
        return service.findByImportId(importId);
    }

    @PostMapping
    public ImportItem create(@RequestBody ImportItem entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ImportItem update(@PathVariable Long id, @RequestBody ImportItem entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
