package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.ImportItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ImportItemRepository extends JpaRepository<ImportItem, Long> {
    List<ImportItem> findByImportObjId(Long importId);
    List<ImportItem> findByProductIdOrderByExpiryDateAsc(Long productId);
    
    @Query("SELECT ii FROM ImportItem ii WHERE ii.product.id = :productId AND ii.remainingQuantity > :remainingQuantity AND ii.importObj.status = 'RECEIVED' ORDER BY ii.expiryDate ASC")
    List<ImportItem> findAvailableReceivedBatches(@Param("productId") Long productId, @Param("remainingQuantity") Double remainingQuantity);
}

