package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.ImportItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImportItemRepository extends JpaRepository<ImportItem, Long> {
    List<ImportItem> findByImportObjId(Long importId);
    List<ImportItem> findByProductIdOrderByExpiryDateAsc(Long productId);
    List<ImportItem> findByProductIdAndRemainingQuantityGreaterThanOrderByExpiryDateAsc(Long productId, Double remainingQuantity);
}
