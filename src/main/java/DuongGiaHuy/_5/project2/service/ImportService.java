package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.dto.ImportItemDTO;
import DuongGiaHuy._5.project2.dto.ImportRequestDTO;
import DuongGiaHuy._5.project2.entity.Import;
import DuongGiaHuy._5.project2.entity.ImportItem;
import DuongGiaHuy._5.project2.entity.Product;
import DuongGiaHuy._5.project2.entity.PriceHistory;
import DuongGiaHuy._5.project2.repository.ImportItemRepository;
import DuongGiaHuy._5.project2.repository.ImportRepository;
import DuongGiaHuy._5.project2.repository.ProductRepository;
import DuongGiaHuy._5.project2.repository.PriceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class ImportService {
    @Autowired
    private ImportRepository importRepository;
    
    @Autowired
    private ImportItemRepository importItemRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private PriceHistoryRepository priceHistoryRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<Import> findAll() {
        return importRepository.findAll();
    }

    public Import findById(Long id) {
        return importRepository.findById(id).orElse(null);
    }

    public Import save(Import entity) {
        return importRepository.save(entity);
    }

    public void deleteById(Long id) {
        importRepository.deleteById(id);
    }
    
    @Transactional
    public Import processImport(ImportRequestDTO request) {
        Import importObj = new Import();
        importObj.setSupplierName(request.getSupplierName());
        importObj.setNote(request.getNote());
        importObj.setImportDate(LocalDateTime.now());
        
        double totalCost = 0.0;
        
        for (ImportItemDTO itemDTO : request.getItems()) {
            totalCost += itemDTO.getQuantity() * itemDTO.getUnitPrice();
        }
        importObj.setTotalCost(totalCost);
        
        Import savedImport = importRepository.save(importObj);
        
        for (ImportItemDTO itemDTO : request.getItems()) {
            Product product = productRepository.findById(itemDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
                
            // Update stock
            product.setStockQuantity(product.getStockQuantity() + itemDTO.getQuantity());
            
            // Update prices
            if (itemDTO.getUnitPrice() != null) {
                product.setImportPrice(itemDTO.getUnitPrice());
            }
            if (itemDTO.getNewPrice() != null && !itemDTO.getNewPrice().equals(product.getSalePrice())) {
                PriceHistory history = new PriceHistory();
                history.setProduct(product);
                history.setOldSellingPrice(product.getSalePrice());
                history.setNewSellingPrice(itemDTO.getNewPrice());
                history.setOldImportPrice(product.getImportPrice());
                history.setNewImportPrice(itemDTO.getUnitPrice());
                history.setUpdatedAt(LocalDateTime.now());
                priceHistoryRepository.save(history);
                
                product.setSalePrice(itemDTO.getNewPrice());
            }
            productRepository.save(product);
            
            // Save import item
            ImportItem importItem = new ImportItem();
            importItem.setImportObj(savedImport);
            importItem.setProduct(product);
            importItem.setQuantity(itemDTO.getQuantity());
            importItem.setUnitPrice(itemDTO.getUnitPrice());
            importItemRepository.save(importItem);
        }
        
        return savedImport;
    }

}
