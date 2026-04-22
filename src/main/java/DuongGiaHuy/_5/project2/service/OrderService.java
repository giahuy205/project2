package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.Order;
import DuongGiaHuy._5.project2.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class OrderService {
    @Autowired
    private OrderRepository repository;

    public List<Order> findAll() {
        return repository.findAll();
    }

    public Order findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Order save(Order entity) {
        return repository.save(entity);
    }

    @Autowired
    private DuongGiaHuy._5.project2.repository.OrderItemRepository itemRepository;

    @Autowired
    private DuongGiaHuy._5.project2.repository.ProductRepository productRepository;

    @Autowired
    private DuongGiaHuy._5.project2.repository.InventoryLogRepository inventoryLogRepository;

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    @org.springframework.transaction.annotation.Transactional
    public void cleanZeroOrders() {
        List<Order> zeroOrders = repository.findAll().stream()
            .filter(o -> o.getTotalAmount() == null || o.getTotalAmount() <= 0.0)
            .toList();

        for (Order o : zeroOrders) {
            // First delete order_items manually if needed. Actually hibernate can optionally cascade,
            // but we use repository directly by fetching order items (it's OneToMany if mapped).
            // Wait, we can just delete from itemRepository explicitly:
            itemRepository.findAll().stream()
                .filter(item -> item.getOrder() != null && item.getOrder().getId().equals(o.getId()))
                .forEach(item -> itemRepository.delete(item));
            
            repository.delete(o);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public Order createOrderWithItems(DuongGiaHuy._5.project2.dto.OrderRequestDTO dto) {
        Order order = new Order();
        order.setOrderDate(java.time.LocalDateTime.now());
        order.setPaidAmount(dto.getPaidAmount());
        order.setPaymentMethod(dto.getPaymentMethod());
        
        // We will calculate these as we process items
        double netAmount = 0.0;
        double totalTax = 0.0;
        
        // Save a placeholder to get the ID for logs if needed, 
        // or we can save at the end. Let's save first.
        Order savedOrder = repository.save(order);

        if (dto.getItems() != null) {
            for (DuongGiaHuy._5.project2.dto.OrderItemDTO itemDTO : dto.getItems()) {
                DuongGiaHuy._5.project2.entity.Product product = productRepository.findById(itemDTO.getProduct().getId()).orElse(null);
                
                if (product != null) {
                    double itemQuantity = itemDTO.getQuantity();
                    double itemPrice = itemDTO.getPrice();
                    double itemSubtotal = itemQuantity * itemPrice;
                    
                    netAmount += itemSubtotal;
                    
                    // Lấy thuế suất từ Category của sản phẩm, mặc định 8% nếu không có
                    double taxRate = 0.08;
                    if (product.getCategory() != null && product.getCategory().getTaxRate() != null) {
                        taxRate = product.getCategory().getTaxRate();
                    }
                    totalTax += (itemSubtotal * taxRate);

                    // Update inventory (Java logic)
                    Double oldStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0.0;
                    Double newStock = oldStock - itemQuantity;
                    product.setStockQuantity(newStock);
                    productRepository.save(product);

                    // Create inventory log
                    DuongGiaHuy._5.project2.entity.InventoryLog log = new DuongGiaHuy._5.project2.entity.InventoryLog();
                    log.setProduct(product);
                    log.setChangeAmount(-itemQuantity);
                    log.setOldStock(oldStock);
                    log.setNewStock(newStock);
                    log.setType("Bán hàng");
                    log.setNote("Đơn hàng #" + savedOrder.getId());
                    log.setTime(java.time.LocalDateTime.now());
                    inventoryLogRepository.save(log);

                    // Create order item
                    DuongGiaHuy._5.project2.entity.OrderItem item = new DuongGiaHuy._5.project2.entity.OrderItem();
                    item.setOrder(savedOrder);
                    item.setProduct(product);
                    item.setQuantity(itemQuantity);
                    item.setUnitPrice(itemPrice);
                    itemRepository.save(item);
                }
            }
        }

        savedOrder.setNetAmount(netAmount);
        savedOrder.setTax(totalTax);
        savedOrder.setTotalAmount(netAmount + totalTax);
        
        return repository.save(savedOrder);
    }
}
