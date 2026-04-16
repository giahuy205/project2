package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.ReturnItem;
import DuongGiaHuy._5.project2.repository.ReturnItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ReturnItemService {
    @Autowired
    private ReturnItemRepository repository;

    public List<ReturnItem> findAll() {
        return repository.findAll();
    }

    public ReturnItem findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public ReturnItem save(ReturnItem entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
