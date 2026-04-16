package DuongGiaHuy._5.project2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Account {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String passwordHash;
    @Column(nullable = false)
    private String fullName;
    @Column(unique = true)
    private String email;
    private String role = "staff";
    private Boolean isActive = true;
    private java.time.LocalDateTime createdAt;
}
