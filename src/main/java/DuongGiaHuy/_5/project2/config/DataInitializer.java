package DuongGiaHuy._5.project2.config;

import DuongGiaHuy._5.project2.entity.Account;
import DuongGiaHuy._5.project2.repository.AccountRepository;
import DuongGiaHuy._5.project2.util.PasswordUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public void run(String... args) throws Exception {
        // Seed admin account
        boolean adminExists = accountRepository.findAll().stream()
                .anyMatch(a -> "admin".equalsIgnoreCase(a.getUsername()));
        if (!adminExists) {
            Account admin = new Account();
            admin.setUsername("admin");
            admin.setPasswordHash(PasswordUtils.hashPassword("admin123"));
            admin.setFullName("Demo Admin");
            admin.setEmail("admin@pos.com");
            admin.setRole("admin");
            admin.setIsActive(true);
            admin.setCreatedAt(LocalDateTime.now());
            accountRepository.save(admin);
            System.out.println("---- DB Seeding: Seeded admin account ----");
        }

        // Seed saler account
        boolean salerExists = accountRepository.findAll().stream()
                .anyMatch(a -> "saler".equalsIgnoreCase(a.getUsername()));
        if (!salerExists) {
            Account saler = new Account();
            saler.setUsername("saler");
            saler.setPasswordHash(PasswordUtils.hashPassword("saler123"));
            saler.setFullName("Demo Saler");
            saler.setEmail("saler@pos.com");
            saler.setRole("saler");
            saler.setIsActive(true);
            saler.setCreatedAt(LocalDateTime.now());
            accountRepository.save(saler);
            System.out.println("---- DB Seeding: Seeded saler account ----");
        }
    }
}
