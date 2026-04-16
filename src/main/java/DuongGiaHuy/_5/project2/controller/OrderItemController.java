package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.OrderItem;
import DuongGiaHuy._5.project2.service.OrderItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orderitems")
@CrossOrigin(origins = "*")
public class OrderItemController {
    @Autowired
    private OrderItemService service;

    @GetMapping
    public List<OrderItem> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public OrderItem getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public OrderItem create(@RequestBody OrderItem entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public OrderItem update(@PathVariable Long id, @RequestBody OrderItem entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
