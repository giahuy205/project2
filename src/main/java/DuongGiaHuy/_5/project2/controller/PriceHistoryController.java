package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.PriceHistory;
import DuongGiaHuy._5.project2.service.PriceHistoryService;
import DuongGiaHuy._5.project2.config.RequiresRole;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pricehistorys")
@CrossOrigin(origins = "*")
@RequiresRole("admin")
@RequiredArgsConstructor
public class PriceHistoryController {
    private final PriceHistoryService service;

    @GetMapping
    public List<PriceHistory> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PriceHistory getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public PriceHistory create(@RequestBody PriceHistory entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public PriceHistory update(@PathVariable Long id, @RequestBody PriceHistory entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
