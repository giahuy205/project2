package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.ReturnOrder;
import DuongGiaHuy._5.project2.repository.ReturnOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReturnOrderService {
    private final ReturnOrderRepository repository;

    public List<ReturnOrder> findAll() {
        return repository.findAll();
    }

    public ReturnOrder findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public ReturnOrder save(ReturnOrder entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
