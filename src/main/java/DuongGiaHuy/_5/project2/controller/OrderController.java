package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Order;
import DuongGiaHuy._5.project2.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {
    @Autowired
    private OrderService service;

    @GetMapping
    public List<Order> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Order getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Order create(@RequestBody Order entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Order update(@PathVariable Long id, @RequestBody Order entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
