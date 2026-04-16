package DuongGiaHuy._5.project2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "return_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReturnItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "return_id")
    private ReturnOrder returnOrder;
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
    private Integer quantity;
    private Double refundPrice;
    private String itemCondition = "Good";
}
