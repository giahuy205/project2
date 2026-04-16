package DuongGiaHuy._5.project2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "imports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Import {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String supplierName;
    private Double totalCost = 0.0;
    private java.time.LocalDateTime importDate;
}
