package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.Category;
import DuongGiaHuy._5.project2.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {
    @Autowired
    private CategoryRepository repository;

    public List<Category> findAll() {
        return repository.findAll();
    }

    public Category findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Category save(Category entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
