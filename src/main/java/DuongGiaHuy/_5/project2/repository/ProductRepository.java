package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductRepository extends JpaRepository<Product, Long> {
}
