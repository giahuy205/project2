package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Category;
import DuongGiaHuy._5.project2.service.CategoryService;
import DuongGiaHuy._5.project2.config.RequiresRole;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;

@RestController
@RequestMapping("/api/categorys")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService service;

    @GetMapping
    public List<Category> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Category getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @RequiresRole("admin")
    public Category create(@RequestBody Category entity) {
        return service.save(entity);
    }

    @PostMapping("/batch")
    @RequiresRole("admin")
    public ResponseEntity<?> createBatch(@RequestBody List<Category> categories) {
        List<String> errors = new ArrayList<>();
        Set<String> existingNames = new HashSet<>();
        service.findAll().forEach(c -> existingNames.add(c.getName().toLowerCase().trim()));

        List<Category> validCategories = new ArrayList<>();
        for (int i = 0; i < categories.size(); i++) {
            Category cat = categories.get(i);
            int rowNum = i + 1;
            if (cat.getName() == null || cat.getName().trim().isEmpty()) {
                errors.add("Dòng " + rowNum + ": Tên danh mục không được để trống");
                continue;
            }
            String name = cat.getName().trim();
            if (existingNames.contains(name.toLowerCase())) {
                errors.add("Dòng " + rowNum + ": Tên danh mục '" + name + "' đã tồn tại");
                continue;
            }
            if (cat.getTaxRate() == null) {
                cat.setTaxRate(0.08); // default
            } else if (cat.getTaxRate() < 0 || cat.getTaxRate() > 1.0) {
                errors.add("Dòng " + rowNum + ": Thuế suất phải nằm trong khoảng từ 0% đến 100%");
                continue;
            }
            cat.setName(name);
            validCategories.add(cat);
            existingNames.add(name.toLowerCase());
        }

        if (!errors.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("errors", errors);
            return ResponseEntity.badRequest().body(response);
        }

        List<Category> saved = service.saveAll(validCategories);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @RequiresRole("admin")
    public Category update(@PathVariable Long id, @RequestBody Category entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    @RequiresRole("admin")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
