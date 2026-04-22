package DuongGiaHuy._5.project2.dto;

import lombok.Data;
import java.util.List;

@Data
public class ImportRequestDTO {
    private String supplierName;
    private String note;
    private List<ImportItemDTO> items;
}
