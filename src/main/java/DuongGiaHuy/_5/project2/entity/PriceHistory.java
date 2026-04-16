package DuongGiaHuy._5.project2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "price_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PriceHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
    private Double oldImportPrice;
    private Double newImportPrice;
    private Double oldSellingPrice;
    private Double newSellingPrice;
    @ManyToOne
    @JoinColumn(name = "updated_by")
    private Account updatedBy;
    private java.time.LocalDateTime updatedAt;
}
