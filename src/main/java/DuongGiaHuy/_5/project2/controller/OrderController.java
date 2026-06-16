package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Order;
import DuongGiaHuy._5.project2.service.OrderService;
import DuongGiaHuy._5.project2.config.RequiresRole;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService service;

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
    @RequiresRole("admin")
    public Order update(@PathVariable Long id, @RequestBody Order entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    @RequiresRole("admin")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @DeleteMapping("/clean-zero")
    @RequiresRole("admin")
    public String cleanZeroOrders() {
        service.cleanZeroOrders();
        return "Cleaned";
    }

    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    @GetMapping("/fix-date")
    public String fixDate() {
        try {
            jdbc.execute("ALTER TABLE orders ALTER COLUMN order_date TYPE timestamp with time zone");
            return "Fixed Database!";
        } catch (Exception e) {
            return "Failed: " + e.getMessage();
        }
    }

    @GetMapping("/fix-created-by")
    public String fixCreatedBy() {
        try {
            jdbc.execute("ALTER TABLE orders ADD COLUMN created_by VARCHAR(50);");
            return "Added created_by column!";
        } catch (Exception e) {
            return "Failed: " + e.getMessage();
        }
    }

    @GetMapping("/fix-import-items")
    public String fixImportItems() {
        try {
            jdbc.execute("ALTER TABLE import_items ADD COLUMN remaining_quantity DOUBLE PRECISION;");
            jdbc.execute("ALTER TABLE import_items ADD COLUMN expiry_date DATE;");
            jdbc.execute("UPDATE import_items SET remaining_quantity = quantity WHERE remaining_quantity IS NULL;");
            return "Fixed import items!";
        } catch (Exception e) {
            return "Failed: " + e.getMessage();
        }
    }

    @GetMapping("/sync-batch-stock")
    public String syncBatchStock() {
        try {
            List<java.util.Map<String, Object>> products = jdbc.queryForList("SELECT id, stock_quantity FROM products");
            for (java.util.Map<String, Object> p : products) {
                Long productId = ((Number) p.get("id")).longValue();
                int stock = ((Number) p.get("stock_quantity")).intValue();
                
                List<java.util.Map<String, Object>> batches = jdbc.queryForList("SELECT id, quantity FROM import_items WHERE product_id = ? ORDER BY expiry_date DESC NULLS LAST, id DESC", productId);
                int remaining = stock;
                for (java.util.Map<String, Object> b : batches) {
                    Long batchId = ((Number) b.get("id")).longValue();
                    int batchQty = ((Number) b.get("quantity")).intValue();
                    
                    double newRemaining = Math.min(batchQty, Math.max(0, remaining));
                    jdbc.update("UPDATE import_items SET remaining_quantity = ? WHERE id = ?", newRemaining, batchId);
                    remaining -= newRemaining;
                }
            }
            return "Đã đồng bộ tồn kho Lô hàng khớp với Tồn kho Tổng!";
        } catch (Exception e) {
            return "Failed: " + e.getMessage();
        }
    }

    @GetMapping("/fix-cost-price")
    public String fixCostPrice() {
        try {
            jdbc.execute("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost_price numeric(15,2)");
            jdbc.execute("UPDATE order_items oi SET cost_price = p.import_price FROM products p WHERE oi.product_id = p.id AND oi.cost_price IS NULL");
            return "Successfully added and backfilled cost_price in order_items!";
        } catch (Exception e) {
            return "Failed to fix cost_price: " + e.getMessage();
        }
    }
}
