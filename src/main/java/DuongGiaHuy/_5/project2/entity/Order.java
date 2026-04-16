package DuongGiaHuy._5.project2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private java.time.LocalDate orderDate;
    private Double netAmount = 0.0;
    private Double tax = 0.0;
    private Double totalAmount = 0.0;
}
