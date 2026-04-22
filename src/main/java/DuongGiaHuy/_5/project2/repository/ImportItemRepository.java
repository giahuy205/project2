package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.ImportItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImportItemRepository extends JpaRepository<ImportItem, Long> {
    List<ImportItem> findByImportObjId(Long importId);
}
