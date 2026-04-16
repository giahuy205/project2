package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.Import;
import DuongGiaHuy._5.project2.repository.ImportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ImportService {
    @Autowired
    private ImportRepository repository;

    public List<Import> findAll() {
        return repository.findAll();
    }

    public Import findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Import save(Import entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
