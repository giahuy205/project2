package DuongGiaHuy._5.project2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "categories_id")
    private Category category;
    @Column(unique = true, nullable = false)
    private String barcode;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private Double importPrice;
    @Column(nullable = false)
    private Double salePrice;
    private Double stockQuantity = 0.0;
    private Double lowStock = 10.0;
    private java.time.LocalDateTime createdAt;
    @ManyToOne
    @JoinColumn(name = "updated_by_id")
    private Account updatedBy;
}
