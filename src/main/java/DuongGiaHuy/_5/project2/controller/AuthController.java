package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Account;
import DuongGiaHuy._5.project2.repository.AccountRepository;
import DuongGiaHuy._5.project2.service.TokenService;
import DuongGiaHuy._5.project2.util.PasswordUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AccountRepository accountRepository;

    private final TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body("Username and password are required");
        }

        Optional<Account> accountOpt = accountRepository.findAll().stream()
                .filter(a -> a.getUsername().equalsIgnoreCase(username))
                .findFirst();

        if (accountOpt.isEmpty() || !PasswordUtils.verifyPassword(password, accountOpt.get().getPasswordHash())) {
            return ResponseEntity.status(401).body("Invalid username or password");
        }

        Account account = accountOpt.get();
        if (account.getIsActive() != null && !account.getIsActive()) {
            return ResponseEntity.status(403).body("Account is deactivated");
        }

        String token = tokenService.generateToken(account);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("role", account.getRole());
        response.put("fullName", account.getFullName());
        response.put("username", account.getUsername());
        response.put("avatar", account.getAvatar());

        return ResponseEntity.ok(response);
    }
}
