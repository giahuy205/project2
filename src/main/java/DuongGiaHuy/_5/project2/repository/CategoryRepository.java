package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}
