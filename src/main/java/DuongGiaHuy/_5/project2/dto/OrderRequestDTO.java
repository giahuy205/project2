package DuongGiaHuy._5.project2.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequestDTO {
    private Double totalAmount;
    private Double paidAmount;
    private String paymentMethod;
    private List<OrderItemDTO> items;
}
