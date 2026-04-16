package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.PriceHistory;
import DuongGiaHuy._5.project2.service.PriceHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pricehistorys")
@CrossOrigin(origins = "*")
public class PriceHistoryController {
    @Autowired
    private PriceHistoryService service;

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
