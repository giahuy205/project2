package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
