package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.ReturnOrder;
import DuongGiaHuy._5.project2.service.ReturnOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/returnorders")
@CrossOrigin(origins = "*")
public class ReturnOrderController {
    @Autowired
    private ReturnOrderService service;

    @GetMapping
    public List<ReturnOrder> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ReturnOrder getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ReturnOrder create(@RequestBody ReturnOrder entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ReturnOrder update(@PathVariable Long id, @RequestBody ReturnOrder entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
