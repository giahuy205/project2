package DuongGiaHuy._5.project2.service;

import DuongGiaHuy._5.project2.entity.Account;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Service
public class TokenService {
    private static final String SECRET = "my-super-secret-key-1234567890-pos-project";

    public String generateToken(Account account) {
        String payload = account.getId() + ":" + account.getUsername() + ":" + account.getRole() + ":" + System.currentTimeMillis();
        String signature = hmac(payload);
        return Base64.getUrlEncoder().withoutPadding().encodeToString((payload + "::" + signature).getBytes(StandardCharsets.UTF_8));
    }

    public Account parseToken(String tokenStr) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(tokenStr);
            String token = new String(decoded, StandardCharsets.UTF_8);
            String[] parts = token.split("::");
            if (parts.length != 2) return null;
            String payload = parts[0];
            String signature = parts[1];
            if (!hmac(payload).equals(signature)) return null;
            
            String[] payloadParts = payload.split(":");
            if (payloadParts.length != 4) return null;
            
            Long id = Long.parseLong(payloadParts[0]);
            String username = payloadParts[1];
            String role = payloadParts[2];
            long timestamp = Long.parseLong(payloadParts[3]);
            
            // Check token expiration (e.g. 24 hours)
            if (System.currentTimeMillis() - timestamp > 24 * 60 * 60 * 1000L) {
                return null;
            }
            
            Account acc = new Account();
            acc.setId(id);
            acc.setUsername(username);
            acc.setRole(role);
            return acc;
        } catch (Exception e) {
            return null;
        }
    }

    private String hmac(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((data + SECRET).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
