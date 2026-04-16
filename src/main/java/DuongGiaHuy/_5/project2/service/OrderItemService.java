package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.OrderItem;
import DuongGiaHuy._5.project2.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class OrderItemService {
    @Autowired
    private OrderItemRepository repository;

    public List<OrderItem> findAll() {
        return repository.findAll();
    }

    public OrderItem findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public OrderItem save(OrderItem entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
