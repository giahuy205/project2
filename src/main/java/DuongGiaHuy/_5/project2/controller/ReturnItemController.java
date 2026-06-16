package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.ReturnItem;
import DuongGiaHuy._5.project2.service.ReturnItemService;
import DuongGiaHuy._5.project2.config.RequiresRole;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/returnitems")
@CrossOrigin(origins = "*")
@RequiresRole("admin")
@RequiredArgsConstructor
public class ReturnItemController {
    private final ReturnItemService service;

    @GetMapping
    public List<ReturnItem> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ReturnItem getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ReturnItem create(@RequestBody ReturnItem entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ReturnItem update(@PathVariable Long id, @RequestBody ReturnItem entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
