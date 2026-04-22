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
    public Order create(@RequestBody DuongGiaHuy._5.project2.dto.OrderRequestDTO dto) {
        return service.createOrderWithItems(dto);
    }

    @PutMapping("/{id}")
    public Order update(@PathVariable Long id, @RequestBody Order entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @DeleteMapping("/clean-zero")
    public String cleanZeroOrders() {
        service.cleanZeroOrders();
        return "Cleaned";
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbc;

    @GetMapping("/fix-date")
    public String fixDate() {
        try {
            jdbc.execute("ALTER TABLE orders ALTER COLUMN order_date TYPE timestamp with time zone");
            return "Fixed Database!";
        } catch (Exception e) {
            return "Failed: " + e.getMessage();
        }
    }
}
