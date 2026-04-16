package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.PriceHistory;
import DuongGiaHuy._5.project2.repository.PriceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PriceHistoryService {
    @Autowired
    private PriceHistoryRepository repository;

    public List<PriceHistory> findAll() {
        return repository.findAll();
    }

    public PriceHistory findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public PriceHistory save(PriceHistory entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
