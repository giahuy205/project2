package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Account;
import DuongGiaHuy._5.project2.service.AccountService;
import DuongGiaHuy._5.project2.config.RequiresRole;
import DuongGiaHuy._5.project2.util.PasswordUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
@RequiresRole("admin")
@RequiredArgsConstructor
public class AccountController {
    private final AccountService service;

    @GetMapping
    public List<Account> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Account getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Account entity) {
        // Validate required fields
        if (entity.getUsername() == null || entity.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Username is required");
        }
        if (entity.getFullName() == null || entity.getFullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Full name is required");
        }

        // Validate uniqueness of username
        boolean usernameExists = service.findAll().stream()
                .anyMatch(a -> a.getUsername().equalsIgnoreCase(entity.getUsername()));
        if (usernameExists) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        // Validate uniqueness of employeeCode if provided
        if (entity.getEmployeeCode() != null && !entity.getEmployeeCode().trim().isEmpty()) {
            boolean codeExists = service.findAll().stream()
                    .anyMatch(a -> entity.getEmployeeCode().equalsIgnoreCase(a.getEmployeeCode()));
            if (codeExists) {
                return ResponseEntity.badRequest().body("Employee code already exists");
            }
        }

        // Normalize blank email to null to prevent unique constraint violation on empty emails
        if (entity.getEmail() != null && entity.getEmail().trim().isEmpty()) {
            entity.setEmail(null);
        }

        // Validate uniqueness of email if provided
        if (entity.getEmail() != null) {
            boolean emailExists = service.findAll().stream()
                    .anyMatch(a -> entity.getEmail().equalsIgnoreCase(a.getEmail()));
            if (emailExists) {
                return ResponseEntity.badRequest().body("Email already exists");
            }
        }

        // Default password to "123456" if empty
        String plainPassword = entity.getPassword();
        if (plainPassword == null || plainPassword.trim().isEmpty()) {
            plainPassword = "123456";
        }
        entity.setPasswordHash(PasswordUtils.hashPassword(plainPassword));
        entity.setCreatedAt(LocalDateTime.now());

        Account saved = service.save(entity);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Account entity) {
        Account existing = service.findById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Validate required fields
        if (entity.getUsername() == null || entity.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Username is required");
        }
        if (entity.getFullName() == null || entity.getFullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Full name is required");
        }

        // Validate username uniqueness if changed
        if (!existing.getUsername().equalsIgnoreCase(entity.getUsername())) {
            boolean usernameExists = service.findAll().stream()
                    .anyMatch(a -> a.getUsername().equalsIgnoreCase(entity.getUsername()));
            if (usernameExists) {
                return ResponseEntity.badRequest().body("Username already exists");
            }
        }

        // Validate employeeCode uniqueness if changed
        if (entity.getEmployeeCode() != null && !entity.getEmployeeCode().trim().isEmpty()) {
            if (existing.getEmployeeCode() == null || !existing.getEmployeeCode().equalsIgnoreCase(entity.getEmployeeCode())) {
                boolean codeExists = service.findAll().stream()
                        .anyMatch(a -> entity.getEmployeeCode().equalsIgnoreCase(a.getEmployeeCode()));
                if (codeExists) {
                    return ResponseEntity.badRequest().body("Employee code already exists");
                }
            }
        }

        // Normalize blank email to null to prevent unique constraint violation on empty emails
        if (entity.getEmail() != null && entity.getEmail().trim().isEmpty()) {
            entity.setEmail(null);
        }

        // Validate email uniqueness if changed and provided
        if (entity.getEmail() != null) {
            if (existing.getEmail() == null || !existing.getEmail().equalsIgnoreCase(entity.getEmail())) {
                boolean emailExists = service.findAll().stream()
                        .anyMatch(a -> entity.getEmail().equalsIgnoreCase(a.getEmail()));
                if (emailExists) {
                    return ResponseEntity.badRequest().body("Email already exists");
                }
            }
        }

        existing.setUsername(entity.getUsername());
        existing.setFullName(entity.getFullName());
        existing.setEmail(entity.getEmail());
        existing.setRole(entity.getRole());
        existing.setIsActive(entity.getIsActive());
        existing.setEmployeeCode(entity.getEmployeeCode());
        existing.setDob(entity.getDob());

        Account saved = service.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @GetMapping("/profile")
    @RequiresRole("any")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        Account currentUser = (Account) request.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Account fullAccount = service.findById(currentUser.getId());
        if (fullAccount == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(fullAccount);
    }

    @PutMapping("/profile")
    @RequiresRole("any")
    public ResponseEntity<?> updateProfile(HttpServletRequest request, @RequestBody Account updatedProfile) {
        Account currentUser = (Account) request.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Account existing = service.findById(currentUser.getId());
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Update allowed fields only
        existing.setFullName(updatedProfile.getFullName());
        existing.setEmail(updatedProfile.getEmail());
        existing.setDob(updatedProfile.getDob());

        // Update password if provided
        if (updatedProfile.getPassword() != null && !updatedProfile.getPassword().trim().isEmpty()) {
            existing.setPasswordHash(PasswordUtils.hashPassword(updatedProfile.getPassword()));
        }

        Account saved = service.save(existing);
        return ResponseEntity.ok(saved);
    }
}
