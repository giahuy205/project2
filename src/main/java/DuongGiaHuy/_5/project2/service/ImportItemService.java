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

    @Autowired
    private DuongGiaHuy._5.project2.repository.ProductRepository productRepository;

    @Autowired
    private DuongGiaHuy._5.project2.repository.InventoryLogRepository inventoryLogRepository;

    public List<ImportItem> findByProductId(Long productId) {
        return repository.findByProductIdOrderByExpiryDateAsc(productId);
    }

    @org.springframework.transaction.annotation.Transactional
    public void discardBatch(Long id) {
        ImportItem item = repository.findById(id).orElseThrow(() -> new RuntimeException("Batch not found"));
        if (item.getRemainingQuantity() != null && item.getRemainingQuantity() > 0) {
            Double oldStock = item.getProduct().getStockQuantity();
            Double deductAmount = item.getRemainingQuantity();
            Double newStock = oldStock - deductAmount;
            
            // update product
            item.getProduct().setStockQuantity(newStock);
            productRepository.save(item.getProduct());
            
            // create log
            DuongGiaHuy._5.project2.entity.InventoryLog log = new DuongGiaHuy._5.project2.entity.InventoryLog();
            log.setProduct(item.getProduct());
            log.setChangeAmount(-deductAmount);
            log.setOldStock(oldStock);
            log.setNewStock(newStock);
            log.setType("Hủy hàng");
            log.setNote("Hủy lô hàng cận/hết date. Batch ID: " + item.getId());
            log.setTime(java.time.LocalDateTime.now());
            inventoryLogRepository.save(log);
            
            // update batch
            item.setRemainingQuantity(0.0);
            repository.save(item);
        }
    }
}
