package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.dto.ImportItemDTO;
import DuongGiaHuy._5.project2.dto.ImportRequestDTO;
import DuongGiaHuy._5.project2.dto.ReceiveImportRequestDTO;
import DuongGiaHuy._5.project2.entity.Import;
import DuongGiaHuy._5.project2.entity.ImportItem;
import DuongGiaHuy._5.project2.entity.Product;
import DuongGiaHuy._5.project2.entity.PriceHistory;
import DuongGiaHuy._5.project2.entity.InventoryLog;
import DuongGiaHuy._5.project2.repository.ImportItemRepository;
import DuongGiaHuy._5.project2.repository.ImportRepository;
import DuongGiaHuy._5.project2.repository.ProductRepository;
import DuongGiaHuy._5.project2.repository.PriceHistoryRepository;
import DuongGiaHuy._5.project2.repository.InventoryLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class ImportService {
    private final ImportRepository importRepository;
    private final ImportItemRepository importItemRepository;
    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final InventoryLogRepository inventoryLogRepository;

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
        importObj.setStatus("PENDING");
        
        double totalCost = 0.0;
        
        for (ImportItemDTO itemDTO : request.getItems()) {
            totalCost += itemDTO.getQuantity() * itemDTO.getUnitPrice();
        }
        importObj.setTotalCost(totalCost);
        
        Import savedImport = importRepository.save(importObj);
        
        for (ImportItemDTO itemDTO : request.getItems()) {
            Product product = productRepository.findById(itemDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
                
            // Save import item
            ImportItem importItem = new ImportItem();
            importItem.setImportObj(savedImport);
            importItem.setProduct(product);
            importItem.setQuantity(itemDTO.getQuantity());
            importItem.setReceivedQuantity(0); // initially 0
            importItem.setRemainingQuantity(0.0); // remaining in stock is 0.0 until RECEIVED
            importItem.setExpiryDate(itemDTO.getExpiryDate());
            importItem.setUnitPrice(itemDTO.getUnitPrice());
            importItem.setNewPrice(itemDTO.getNewPrice());
            importItemRepository.save(importItem);
        }
        
        return savedImport;
    }

    @Transactional
    public Import receiveImport(Long importId, ReceiveImportRequestDTO request) {
        Import importObj = importRepository.findById(importId)
            .orElseThrow(() -> new RuntimeException("Import not found"));
        
        if (!"PENDING".equals(importObj.getStatus())) {
            throw new RuntimeException("Only PENDING orders can be received");
        }
        
        importObj.setStatus("RECEIVED");
        importObj.setReceivedDate(LocalDateTime.now());
        
        double actualTotalCost = 0.0;
        
        for (ReceiveImportRequestDTO.ReceiveItemDTO receiveDTO : request.getItems()) {
            ImportItem item = importItemRepository.findById(receiveDTO.getImportItemId())
                .orElseThrow(() -> new RuntimeException("Import item not found"));
            
            if (!item.getImportObj().getId().equals(importId)) {
                throw new RuntimeException("Item does not belong to this order");
            }
            
            int receivedQuantity = receiveDTO.getReceivedQuantity() != null ? receiveDTO.getReceivedQuantity() : 0;
            if (receivedQuantity < 0) {
                throw new RuntimeException("Received quantity cannot be negative");
            }
            
            item.setReceivedQuantity(receivedQuantity);
            item.setRemainingQuantity((double) receivedQuantity);
            importItemRepository.save(item);
            
            actualTotalCost += receivedQuantity * (item.getUnitPrice() != null ? item.getUnitPrice() : 0.0);
            
            if (receivedQuantity > 0) {
                Product product = item.getProduct();
                Double oldStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0.0;
                Double newStock = oldStock + receivedQuantity;
                
                // Update stock
                product.setStockQuantity(newStock);
                
                // Update import price
                if (item.getUnitPrice() != null) {
                    product.setImportPrice(item.getUnitPrice());
                }
                
                // Update sale price
                if (item.getNewPrice() != null && !item.getNewPrice().equals(product.getSalePrice())) {
                    PriceHistory history = new PriceHistory();
                    history.setProduct(product);
                    history.setOldSellingPrice(product.getSalePrice());
                    history.setNewSellingPrice(item.getNewPrice());
                    history.setOldImportPrice(product.getImportPrice());
                    history.setNewImportPrice(item.getUnitPrice());
                    history.setUpdatedAt(LocalDateTime.now());
                    priceHistoryRepository.save(history);
                    
                    product.setSalePrice(item.getNewPrice());
                }
                productRepository.save(product);
                
                // Create inventory log
                InventoryLog log = new InventoryLog();
                log.setProduct(product);
                log.setChangeAmount((double) receivedQuantity);
                log.setOldStock(oldStock);
                log.setNewStock(newStock);
                log.setType("IMPORT");
                log.setNote("Nhập hàng từ đơn đặt hàng ID: " + importId);
                log.setTime(LocalDateTime.now());
                inventoryLogRepository.save(log);
            }
        }
        
        importObj.setTotalCost(actualTotalCost);
        return importRepository.save(importObj);
    }

    @Transactional
    public Import cancelImport(Long importId) {
        Import importObj = importRepository.findById(importId)
            .orElseThrow(() -> new RuntimeException("Import not found"));
        
        if (!"PENDING".equals(importObj.getStatus())) {
            throw new RuntimeException("Only PENDING orders can be cancelled");
        }
        
        LocalDateTime orderTime = importObj.getImportDate();
        if (orderTime != null && orderTime.plusHours(1).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot cancel order after 1 hour from order time");
        }
        
        importObj.setStatus("CANCELLED");
        return importRepository.save(importObj);
    }
}
