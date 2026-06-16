package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.InventoryLog;
import DuongGiaHuy._5.project2.repository.InventoryLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryLogService {
    private final InventoryLogRepository repository;

    public List<InventoryLog> findAll() {
        return repository.findAll();
    }

    public InventoryLog findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public InventoryLog save(InventoryLog entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
