package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.Category;
import DuongGiaHuy._5.project2.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository repository;

    public List<Category> findAll() {
        return repository.findAll();
    }

    public Category findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Category save(Category entity) {
        return repository.save(entity);
    }

    public List<Category> saveAll(List<Category> entities) {
        return repository.saveAll(entities);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
