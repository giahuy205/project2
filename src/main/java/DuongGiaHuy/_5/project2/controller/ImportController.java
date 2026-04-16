package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Import;
import DuongGiaHuy._5.project2.service.ImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/imports")
@CrossOrigin(origins = "*")
public class ImportController {
    @Autowired
    private ImportService service;

    @GetMapping
    public List<Import> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Import getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Import create(@RequestBody Import entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Import update(@PathVariable Long id, @RequestBody Import entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
