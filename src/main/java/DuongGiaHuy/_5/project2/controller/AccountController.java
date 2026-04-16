package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Account;
import DuongGiaHuy._5.project2.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {
    @Autowired
    private AccountService service;

    @GetMapping
    public List<Account> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Account getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Account create(@RequestBody Account entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Account update(@PathVariable Long id, @RequestBody Account entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
}
