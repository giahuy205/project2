package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.ImportItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportItemRepository extends JpaRepository<ImportItem, Long> {
}
