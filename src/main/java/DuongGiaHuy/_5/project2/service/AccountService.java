package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.Account;
import DuongGiaHuy._5.project2.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AccountService {
    @Autowired
    private AccountRepository repository;

    public List<Account> findAll() {
        return repository.findAll();
    }

    public Account findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Account save(Account entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
