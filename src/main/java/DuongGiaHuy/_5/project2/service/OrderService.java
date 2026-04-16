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

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
