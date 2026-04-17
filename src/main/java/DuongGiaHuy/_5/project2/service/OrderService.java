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
        
        double netAmount = 0.0;
        if (dto.getItems() != null) {
            for (DuongGiaHuy._5.project2.dto.OrderItemDTO itemDTO : dto.getItems()) {
                netAmount += (itemDTO.getQuantity() * itemDTO.getPrice());
            }
        }
        order.setNetAmount(netAmount);
        order.setTax(netAmount * 0.08); // 8% tax
        order.setTotalAmount(dto.getTotalAmount());
        
        Order savedOrder = repository.save(order);

        if (dto.getItems() != null) {
            for (DuongGiaHuy._5.project2.dto.OrderItemDTO itemDTO : dto.getItems()) {
                DuongGiaHuy._5.project2.entity.Product product = productRepository.findById(itemDTO.getProduct().getId()).orElse(null);
                
                if (product != null) {
                    // Update inventory
                    Double oldStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0.0;
                    Double newStock = oldStock - itemDTO.getQuantity();
                    product.setStockQuantity(newStock);
                    productRepository.save(product);

                    // Create log
                    DuongGiaHuy._5.project2.entity.InventoryLog log = new DuongGiaHuy._5.project2.entity.InventoryLog();
                    log.setProduct(product);
                    log.setChangeAmount(-itemDTO.getQuantity());
                    log.setOldStock(oldStock);
                    log.setNewStock(newStock);
                    log.setType("Bán hàng");
                    log.setNote("Đơn hàng #" + savedOrder.getId());
                    log.setTime(java.time.LocalDateTime.now());
                    inventoryLogRepository.save(log);
                }

                DuongGiaHuy._5.project2.entity.OrderItem item = new DuongGiaHuy._5.project2.entity.OrderItem();
                item.setOrder(savedOrder);
                item.setProduct(product);
                item.setQuantity(itemDTO.getQuantity());
                item.setUnitPrice(itemDTO.getPrice());
                itemRepository.save(item);
            }
        }

        return repository.findById(savedOrder.getId()).orElse(savedOrder);
    }
}
