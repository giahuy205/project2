package DuongGiaHuy._5.project2.dto;

import lombok.Data;

@Data
public class ImportItemDTO {
    private Long productId;
    private Integer quantity;
    private Double unitPrice;
    private Double newPrice; // optional, if null or same as before, no change.
}
