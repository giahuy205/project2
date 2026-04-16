package DuongGiaHuy._5.project2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventory_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
    private Double changeAmount;
    private Double oldStock;
    private Double newStock;
    private String type;
    private String note;
    private java.time.LocalDateTime time;
}
