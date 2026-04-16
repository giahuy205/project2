package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.InventoryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
}
