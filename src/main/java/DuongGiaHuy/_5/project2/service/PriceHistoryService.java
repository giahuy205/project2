package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.PriceHistory;
import DuongGiaHuy._5.project2.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PriceHistoryService {
    private final PriceHistoryRepository repository;

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
