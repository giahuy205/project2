package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByBarcode(String barcode);
    boolean existsByBarcode(String barcode);
    boolean existsByNameIgnoreCase(String name);
}
