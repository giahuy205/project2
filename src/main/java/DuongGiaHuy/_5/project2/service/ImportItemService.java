package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.ImportItem;
import DuongGiaHuy._5.project2.repository.ImportItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ImportItemService {
    @Autowired
    private ImportItemRepository repository;

    public List<ImportItem> findAll() {
        return repository.findAll();
    }

    public ImportItem findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public ImportItem save(ImportItem entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
    
    public List<ImportItem> findByImportId(Long importId) {
        return repository.findByImportObjId(importId);
    }
}
