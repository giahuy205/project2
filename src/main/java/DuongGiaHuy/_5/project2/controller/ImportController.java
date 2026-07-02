package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.dto.ImportRequestDTO;
import DuongGiaHuy._5.project2.dto.ReceiveImportRequestDTO;
import DuongGiaHuy._5.project2.entity.Import;
import DuongGiaHuy._5.project2.service.ImportService;
import DuongGiaHuy._5.project2.config.RequiresRole;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/imports")
@CrossOrigin(origins = "*")
@RequiresRole("admin")
@RequiredArgsConstructor
public class ImportController {
    private final ImportService service;

    @GetMapping
    public List<Import> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Import getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping("/process")
    public Import process(@RequestBody ImportRequestDTO request) {
        return service.processImport(request);
    }

    @PostMapping("/{id}/receive")
    public Import receive(@PathVariable Long id, @RequestBody ReceiveImportRequestDTO request) {
        return service.receiveImport(id, request);
    }

    @PostMapping("/{id}/cancel")
    public Import cancel(@PathVariable Long id) {
        return service.cancelImport(id);
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
