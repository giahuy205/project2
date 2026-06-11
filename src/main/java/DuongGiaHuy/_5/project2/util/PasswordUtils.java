package DuongGiaHuy._5.project2.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

public class PasswordUtils {
    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    public static boolean verifyPassword(String password, String passwordHash) {
        return hashPassword(password).equals(passwordHash);
    }
}
