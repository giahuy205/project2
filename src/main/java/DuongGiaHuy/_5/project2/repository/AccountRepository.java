package DuongGiaHuy._5.project2.repository;

import DuongGiaHuy._5.project2.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AccountRepository extends JpaRepository<Account, Long> {
}
