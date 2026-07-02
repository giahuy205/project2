package DuongGiaHuy._5.project2.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReceiveImportRequestDTO {
    private List<ReceiveItemDTO> items;

    @Data
    public static class ReceiveItemDTO {
        private Long importItemId;
        private Integer receivedQuantity;
    }
}
