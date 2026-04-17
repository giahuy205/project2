package DuongGiaHuy._5.project2.dto;

import lombok.Data;

@Data
public class OrderItemDTO {
    private ProductIdDTO product;
    private Double quantity;
    private Double price;
    
    @Data
    public static class ProductIdDTO {
        private Long id;
    }
}
