package DuongGiaHuy._5.project2.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DashboardController {

    private final JdbcTemplate jdbc;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDate today = LocalDate.now();
            String todayStart = today.toString() + " 00:00:00";
            String todayEnd = today.toString() + " 23:59:59";

            // 1. Today's Revenue and Orders
            String todayStatsSql = "SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(id) as orders " +
                                   "FROM orders " +
                                   "WHERE order_date >= CAST(? AS timestamp) AND order_date <= CAST(? AS timestamp)";
            List<Map<String, Object>> todayResult = jdbc.queryForList(todayStatsSql, todayStart, todayEnd);
            double todayRevenue = 0.0;
            long todayOrders = 0;
            if (!todayResult.isEmpty()) {
                Map<String, Object> row = todayResult.get(0);
                todayRevenue = ((Number) (row.get("revenue") != null ? row.get("revenue") : 0.0)).doubleValue();
                todayOrders = ((Number) (row.get("orders") != null ? row.get("orders") : 0)).longValue();
            }

            // 2. Low Stock Count
            String lowStockSql = "SELECT COUNT(id) FROM products WHERE stock_quantity <= low_stock";
            Long lowStockCount = jdbc.queryForObject(lowStockSql, Long.class);
            if (lowStockCount == null) {
                lowStockCount = 0L;
            }

            // 3. Top Product Today (or overall)
            String topProductTodaySql = "SELECT p.name, SUM(oi.quantity) as qty " +
                                       "FROM order_items oi " +
                                       "JOIN orders o ON oi.order_id = o.id " +
                                       "JOIN products p ON oi.product_id = p.id " +
                                       "WHERE o.order_date >= CAST(? AS timestamp) AND o.order_date <= CAST(? AS timestamp) " +
                                       "GROUP BY p.id, p.name " +
                                       "ORDER BY qty DESC LIMIT 1";
            List<Map<String, Object>> topProductResult = jdbc.queryForList(topProductTodaySql, todayStart, todayEnd);
            String topProduct = "Chưa có";
            if (!topProductResult.isEmpty()) {
                topProduct = (String) topProductResult.get(0).get("name");
            } else {
                // Fallback to overall best seller
                String topProductAllSql = "SELECT p.name, SUM(oi.quantity) as qty " +
                                         "FROM order_items oi " +
                                         "JOIN products p ON oi.product_id = p.id " +
                                         "GROUP BY p.id, p.name " +
                                         "ORDER BY qty DESC LIMIT 1";
                List<Map<String, Object>> topProductAllResult = jdbc.queryForList(topProductAllSql);
                if (!topProductAllResult.isEmpty()) {
                    topProduct = (String) topProductAllResult.get(0).get("name");
                }
            }

            // 4. Recent Orders (last 5)
            String recentOrdersSql = "SELECT id, TO_CHAR(order_date, 'HH24:MI DD/MM') as time_label, total_amount, payment_method " +
                                     "FROM orders " +
                                     "ORDER BY order_date DESC LIMIT 5";
            List<Map<String, Object>> recentOrders = jdbc.queryForList(recentOrdersSql);
            
            // Map payment method names for display
            List<Map<String, Object>> recentOrdersMapped = new ArrayList<>();
            for (Map<String, Object> order : recentOrders) {
                Map<String, Object> orderCopy = new HashMap<>(order);
                String method = (String) orderCopy.get("payment_method");
                String displayName = "Tiền mặt";
                if ("Card".equalsIgnoreCase(method)) {
                    displayName = "Cà thẻ";
                } else if ("QR".equalsIgnoreCase(method)) {
                    displayName = "Chuyển khoản";
                }
                orderCopy.put("paymentMethodDisplay", displayName);
                recentOrdersMapped.add(orderCopy);
            }

            // 5. Last 7 Days Revenue Trend
            String trendSql = "SELECT TO_CHAR(order_date, 'YYYY-MM-DD') as date_label, SUM(total_amount) as revenue " +
                              "FROM orders " +
                              "WHERE order_date >= CAST(? AS timestamp) AND order_date <= CAST(? AS timestamp) " +
                              "GROUP BY TO_CHAR(order_date, 'YYYY-MM-DD')";
            String sevenDaysAgoStart = today.minusDays(6).toString() + " 00:00:00";
            List<Map<String, Object>> trendResult = jdbc.queryForList(trendSql, sevenDaysAgoStart, todayEnd);
            
            Map<String, Double> trendMap = new HashMap<>();
            for (Map<String, Object> row : trendResult) {
                trendMap.put((String) row.get("date_label"), ((Number) row.get("revenue")).doubleValue());
            }
            
            List<Map<String, Object>> trend = new ArrayList<>();
            DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd/MM");
            for (int i = 6; i >= 0; i--) {
                LocalDate d = today.minusDays(i);
                String dateStr = d.toString();
                String displayLabel = d.format(dayFormatter);
                double rev = trendMap.getOrDefault(dateStr, 0.0);
                
                Map<String, Object> pt = new HashMap<>();
                pt.put("dateLabel", displayLabel);
                pt.put("revenue", rev);
                trend.add(pt);
            }

            response.put("todayRevenue", todayRevenue);
            response.put("todayOrders", todayOrders);
            response.put("lowStockCount", lowStockCount);
            response.put("topProduct", topProduct);
            response.put("recentOrders", recentOrdersMapped);
            response.put("revenueTrend", trend);

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", "Lỗi tải số liệu dashboard: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
