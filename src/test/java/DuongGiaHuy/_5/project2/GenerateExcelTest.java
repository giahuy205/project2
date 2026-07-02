package DuongGiaHuy._5.project2;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import java.io.FileOutputStream;

public class GenerateExcelTest {

    @Test
    public void generate200RowsExcel() {
        try {
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Danh sách sản phẩm");

            // Headers
            Row headerRow = sheet.createRow(0);
            String[] headers = {"STT", "Mã vạch", "Tên sản phẩm", "Danh mục", "Giá bán"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            // Write 200 product rows
            for (int r = 1; r <= 200; r++) {
                Row row = sheet.createRow(r);
                row.createCell(0).setCellValue(r);
                // Make barcode auto-generated for some, fixed for others
                if (r % 3 == 0) {
                    row.createCell(1).setCellValue("BC" + String.format("%06d", r));
                } else {
                    row.createCell(1).setCellValue(""); // empty to test auto-generation
                }
                row.createCell(2).setCellValue("Sản phẩm tự động " + r);
                // Set category
                if (r % 5 == 0) {
                    row.createCell(3).setCellValue("Nước ngọt");
                } else if (r % 5 == 1) {
                    row.createCell(3).setCellValue("Bánh kẹo");
                } else if (r % 5 == 2) {
                    row.createCell(3).setCellValue("Mì gói");
                } else if (r % 5 == 3) {
                    row.createCell(3).setCellValue("Gia vị");
                } else {
                    row.createCell(3).setCellValue(""); // empty to map to 'Khác'
                }
                row.createCell(4).setCellValue(1000 + r * 10);
            }

            // Write to a file in the workspace
            FileOutputStream fileOut = new FileOutputStream("test_200_rows.xlsx");
            workbook.write(fileOut);
            fileOut.close();
            workbook.close();
            System.out.println("Successfully generated test_200_rows.xlsx");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
