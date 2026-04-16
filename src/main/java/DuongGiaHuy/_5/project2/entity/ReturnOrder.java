package DuongGiaHuy._5.project2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "returns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReturnOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    private java.time.LocalDateTime returnDate;
    private Double totalRefundAmount = 0.0;
    private String reason;
}
