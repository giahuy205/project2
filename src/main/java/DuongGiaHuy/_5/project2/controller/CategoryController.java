package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Category;
import DuongGiaHuy._5.project2.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorys")
@CrossOrigin(origins = "*")
public class CategoryController {
    @Autowired
    private CategoryService service;

    @GetMapping
    public List<Category> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Category getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Category create(@RequestBody Category entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Category update(@PathVariable Long id, @RequestBody Category entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
