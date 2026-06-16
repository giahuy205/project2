package DuongGiaHuy._5.project2.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReportController {

    private final JdbcTemplate jdbc;

    @GetMapping("/summary")
    public Map<String, Object> getSummary(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        String startTimestamp = startDate + " 00:00:00";
        String endTimestamp = endDate + " 23:59:59";

        String sql = "WITH summary_revenue AS ( " +
                "  SELECT " +
                "    COALESCE(SUM(net_amount), 0) as net_revenue, " +
                "    COALESCE(SUM(tax), 0) as total_tax, " +
                "    COALESCE(SUM(total_amount), 0) as gross_revenue, " +
                "    COUNT(id) as total_orders " +
                "  FROM orders " +
                "  WHERE order_date >= CAST(? AS timestamp) AND order_date <= CAST(? AS timestamp) " +
                "), " +
                "summary_cogs AS ( " +
                "  SELECT COALESCE(SUM(oi.quantity * COALESCE(oi.cost_price, 0)), 0) as cogs " +
                "  FROM order_items oi " +
                "  JOIN orders o ON oi.order_id = o.id " +
                "  WHERE o.order_date >= CAST(? AS timestamp) AND o.order_date <= CAST(? AS timestamp) " +
                ") " +
                "SELECT r.net_revenue, r.total_tax, r.gross_revenue, r.total_orders, c.cogs " +
                "FROM summary_revenue r, summary_cogs c";

        List<Map<String, Object>> result = jdbc.queryForList(sql, startTimestamp, endTimestamp, startTimestamp, endTimestamp);
        
        Map<String, Object> summary = new HashMap<>();
        if (!result.isEmpty()) {
            Map<String, Object> row = result.get(0);
            double netRevenue = ((Number) (row.get("net_revenue") != null ? row.get("net_revenue") : 0.0)).doubleValue();
            double tax = ((Number) (row.get("total_tax") != null ? row.get("total_tax") : 0.0)).doubleValue();
            double grossRevenue = ((Number) (row.get("gross_revenue") != null ? row.get("gross_revenue") : 0.0)).doubleValue();
            double cogs = ((Number) (row.get("cogs") != null ? row.get("cogs") : 0.0)).doubleValue();
            long totalOrders = ((Number) (row.get("total_orders") != null ? row.get("total_orders") : 0)).longValue();
            
            double profit = netRevenue - cogs;
            double margin = netRevenue > 0 ? (profit / netRevenue * 100) : 0.0;
            double aov = totalOrders > 0 ? (grossRevenue / totalOrders) : 0.0;

            summary.put("netRevenue", netRevenue);
            summary.put("tax", tax);
            summary.put("grossRevenue", grossRevenue);
            summary.put("cogs", cogs);
            summary.put("profit", profit);
            summary.put("margin", margin);
            summary.put("totalOrders", totalOrders);
            summary.put("aov", aov);
        } else {
            summary.put("netRevenue", 0.0);
            summary.put("tax", 0.0);
            summary.put("grossRevenue", 0.0);
            summary.put("cogs", 0.0);
            summary.put("profit", 0.0);
            summary.put("margin", 0.0);
            summary.put("totalOrders", 0);
            summary.put("aov", 0.0);
        }
        return summary;
    }

    @GetMapping("/sales-trend")
    public List<Map<String, Object>> getSalesTrend(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        String startTimestamp = startDate + " 00:00:00";
        String endTimestamp = endDate + " 23:59:59";

        String sql = "WITH daily_revenue AS ( " +
                "  SELECT " +
                "    TO_CHAR(order_date, 'YYYY-MM-DD') as date_label, " +
                "    SUM(net_amount) as revenue " +
                "  FROM orders " +
                "  WHERE order_date >= CAST(? AS timestamp) AND order_date <= CAST(? AS timestamp) " +
                "  GROUP BY TO_CHAR(order_date, 'YYYY-MM-DD') " +
                "), " +
                "daily_cogs AS ( " +
                "  SELECT " +
                "    TO_CHAR(o.order_date, 'YYYY-MM-DD') as date_label, " +
                "    SUM(oi.quantity * COALESCE(oi.cost_price, 0)) as cogs " +
                "  FROM order_items oi " +
                "  JOIN orders o ON oi.order_id = o.id " +
                "  WHERE o.order_date >= CAST(? AS timestamp) AND o.order_date <= CAST(? AS timestamp) " +
                "  GROUP BY TO_CHAR(o.order_date, 'YYYY-MM-DD') " +
                ") " +
                "SELECT " +
                "  COALESCE(r.date_label, c.date_label) as date_label, " +
                "  COALESCE(r.revenue, 0) as revenue, " +
                "  COALESCE(c.cogs, 0) as cogs " +
                "FROM daily_revenue r " +
                "FULL OUTER JOIN daily_cogs c ON r.date_label = c.date_label " +
                "ORDER BY date_label ASC";

        List<Map<String, Object>> rows = jdbc.queryForList(sql, startTimestamp, endTimestamp, startTimestamp, endTimestamp);
        
        List<Map<String, Object>> trend = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            double revenue = ((Number) (row.get("revenue") != null ? row.get("revenue") : 0.0)).doubleValue();
            double cogs = ((Number) (row.get("cogs") != null ? row.get("cogs") : 0.0)).doubleValue();
            double profit = revenue - cogs;

            item.put("dateLabel", row.get("date_label"));
            item.put("revenue", revenue);
            item.put("profit", profit);
            trend.add(item);
        }
        return trend;
    }

    @GetMapping("/products")
    public List<Map<String, Object>> getProductsReport(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        String startTimestamp = startDate + " 00:00:00";
        String endTimestamp = endDate + " 23:59:59";

        String sql = "SELECT " +
                "  p.name as product_name, " +
                "  c.name as category_name, " +
                "  COALESCE(SUM(oi.quantity), 0) as quantity_sold, " +
                "  COALESCE(SUM(oi.quantity * oi.unit_price * (1 + COALESCE(oi.applied_tax_rate, 0))), 0) as revenue, " +
                "  COALESCE(SUM(oi.quantity * COALESCE(oi.cost_price, 0)), 0) as cogs " +
                "FROM order_items oi " +
                "JOIN orders o ON oi.order_id = o.id " +
                "JOIN products p ON oi.product_id = p.id " +
                "LEFT JOIN categories c ON p.categories_id = c.id " +
                "WHERE o.order_date >= CAST(? AS timestamp) AND o.order_date <= CAST(? AS timestamp) " +
                "GROUP BY p.id, p.name, c.name " +
                "ORDER BY revenue DESC";

        List<Map<String, Object>> rows = jdbc.queryForList(sql, startTimestamp, endTimestamp);
        
        List<Map<String, Object>> products = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            double qty = ((Number) (row.get("quantity_sold") != null ? row.get("quantity_sold") : 0.0)).doubleValue();
            double revenue = ((Number) (row.get("revenue") != null ? row.get("revenue") : 0.0)).doubleValue();
            double cogs = ((Number) (row.get("cogs") != null ? row.get("cogs") : 0.0)).doubleValue();
            double profit = revenue - cogs;
            double margin = revenue > 0 ? (profit / revenue * 100) : 0.0;

            item.put("productName", row.get("product_name"));
            item.put("categoryName", row.get("category_name") != null ? row.get("category_name") : "Khác");
            item.put("quantitySold", qty);
            item.put("revenue", revenue);
            item.put("cogs", cogs);
            item.put("profit", profit);
            item.put("margin", margin);
            products.add(item);
        }
        return products;
    }

    @GetMapping("/categories")
    public List<Map<String, Object>> getCategoriesReport(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        String startTimestamp = startDate + " 00:00:00";
        String endTimestamp = endDate + " 23:59:59";

        String sql = "SELECT " +
                "  COALESCE(c.name, 'Chưa phân loại') as category_name, " +
                "  COALESCE(SUM(oi.quantity * oi.unit_price * (1 + COALESCE(oi.applied_tax_rate, 0))), 0) as revenue " +
                "FROM order_items oi " +
                "JOIN orders o ON oi.order_id = o.id " +
                "JOIN products p ON oi.product_id = p.id " +
                "LEFT JOIN categories c ON p.categories_id = c.id " +
                "WHERE o.order_date >= CAST(? AS timestamp) AND o.order_date <= CAST(? AS timestamp) " +
                "GROUP BY c.name " +
                "ORDER BY revenue DESC";

        List<Map<String, Object>> rows = jdbc.queryForList(sql, startTimestamp, endTimestamp);
        
        List<Map<String, Object>> categories = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("categoryName", row.get("category_name"));
            item.put("revenue", ((Number) (row.get("revenue") != null ? row.get("revenue") : 0.0)).doubleValue());
            categories.add(item);
        }
        return categories;
    }

    @GetMapping("/payments")
    public List<Map<String, Object>> getPaymentsReport(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        String startTimestamp = startDate + " 00:00:00";
        String endTimestamp = endDate + " 23:59:59";

        String sql = "SELECT " +
                "  COALESCE(o.payment_method, 'Cash') as payment_method, " +
                "  COUNT(o.id) as order_count " +
                "FROM orders o " +
                "WHERE o.order_date >= CAST(? AS timestamp) AND o.order_date <= CAST(? AS timestamp) " +
                "GROUP BY COALESCE(o.payment_method, 'Cash')";

        List<Map<String, Object>> rows = jdbc.queryForList(sql, startTimestamp, endTimestamp);
        
        List<Map<String, Object>> payments = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            String method = (String) row.get("payment_method");
            String displayName = "Tiền mặt";
            if ("Card".equalsIgnoreCase(method)) {
                displayName = "Cà thẻ";
            } else if ("QR".equalsIgnoreCase(method)) {
                displayName = "Chuyển khoản";
            }
            item.put("method", displayName);
            item.put("count", ((Number) (row.get("order_count") != null ? row.get("order_count") : 0)).longValue());
            payments.add(item);
        }
        return payments;
    }

    @GetMapping("/staff")
    public List<Map<String, Object>> getStaffReport(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        
        String startTimestamp = startDate + " 00:00:00";
        String endTimestamp = endDate + " 23:59:59";

        String sql = "SELECT " +
                "  COALESCE(o.created_by, 'admin') as created_by, " +
                "  COUNT(DISTINCT o.id) as total_orders, " +
                "  COALESCE(SUM(o.total_amount), 0) as revenue " +
                "FROM orders o " +
                "WHERE o.order_date >= CAST(? AS timestamp) AND o.order_date <= CAST(? AS timestamp) " +
                "GROUP BY COALESCE(o.created_by, 'admin') " +
                "ORDER BY revenue DESC";

        List<Map<String, Object>> rows = jdbc.queryForList(sql, startTimestamp, endTimestamp);
        
        List<Map<String, Object>> staffList = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("username", row.get("created_by"));
            item.put("totalOrders", row.get("total_orders"));
            item.put("revenue", row.get("revenue"));
            staffList.add(item);
        }
        return staffList;
    }
}
