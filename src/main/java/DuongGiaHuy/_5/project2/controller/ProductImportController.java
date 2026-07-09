package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.entity.Product;
import DuongGiaHuy._5.project2.entity.Category;
import DuongGiaHuy._5.project2.repository.ProductRepository;
import DuongGiaHuy._5.project2.repository.CategoryRepository;
import DuongGiaHuy._5.project2.config.RequiresRole;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductImportController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @PostMapping("/import-excel")
    @RequiresRole("admin")
    public ResponseEntity<Map<String, Object>> importExcel(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int failedCount = 0;

        try {
            Workbook workbook = WorkbookFactory.create(file.getInputStream());
            Sheet sheet = workbook.getSheetAt(0);

            // Load existing names and barcodes for duplicate checking
            Set<String> existingNames = new HashSet<>();
            productRepository.findAll().forEach(p -> existingNames.add(p.getName().toLowerCase().trim()));

            Set<String> existingBarcodes = new HashSet<>();
            productRepository.findAll().forEach(p -> existingBarcodes.add(p.getBarcode().toLowerCase().trim()));

            // Pre-fetch all categories to avoid N+1 queries
            Map<String, Category> categoryMap = new HashMap<>();
            categoryRepository.findAll().forEach(c -> categoryMap.put(c.getName().toLowerCase().trim(), c));

            List<Product> productsToSave = new ArrayList<>();
            int[] nextSuffix = {1};
            int consecutiveEmptyRows = 0;

            // Parse products starting from row index 1 (2nd row)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    consecutiveEmptyRows++;
                    if (consecutiveEmptyRows > 20) {
                        break;
                    }
                    continue;
                }

                // Check if row is completely empty
                boolean isEmpty = true;
                for (int c = 0; c < 5; c++) {
                    Cell cell = row.getCell(c);
                    if (cell != null && !cell.toString().trim().isEmpty()) {
                        isEmpty = false;
                        break;
                    }
                }
                if (isEmpty) {
                    consecutiveEmptyRows++;
                    if (consecutiveEmptyRows > 20) {
                        break;
                    }
                    continue;
                }

                consecutiveEmptyRows = 0; // reset counter when we find a valid row
                int rowNum = i + 1; // 1-based row number for display

                Cell barcodeCell = row.getCell(1);
                Cell nameCell = row.getCell(2);
                Cell categoryCell = row.getCell(3);
                Cell priceCell = row.getCell(4);

                String barcode = barcodeCell != null ? barcodeCell.toString().trim() : "";
                String name = nameCell != null ? nameCell.toString().trim() : "";
                String categoryName = categoryCell != null ? categoryCell.toString().trim() : "";

                double salePrice = 0.0;
                boolean priceValid = true;
                if (priceCell != null) {
                    try {
                        if (priceCell.getCellType() == CellType.NUMERIC) {
                            salePrice = priceCell.getNumericCellValue();
                        } else {
                            salePrice = Double.parseDouble(priceCell.toString().trim());
                        }
                        if (salePrice <= 0) {
                            priceValid = false;
                        }
                    } catch (Exception e) {
                        priceValid = false;
                    }
                } else {
                    priceValid = false;
                }

                List<String> rowErrors = new ArrayList<>();

                if (name.isEmpty()) {
                    rowErrors.add("Tên sản phẩm không được để trống");
                } else if (existingNames.contains(name.toLowerCase())) {
                    rowErrors.add("Tên sản phẩm '" + name + "' đã tồn tại");
                }

                if (!priceValid) {
                    rowErrors.add("Giá bán phải lớn hơn 0");
                }

                if (!barcode.isEmpty()) {
                    if (existingBarcodes.contains(barcode.toLowerCase())) {
                        rowErrors.add("Mã vạch '" + barcode + "' đã tồn tại");
                    }
                }

                if (!rowErrors.isEmpty()) {
                    failedCount++;
                    errors.add("Dòng " + rowNum + ": " + String.join(", ", rowErrors));
                    continue;
                }

                // If barcode is empty, auto-generate one
                if (barcode.isEmpty()) {
                    barcode = generateUniqueBarcode(existingBarcodes, nextSuffix);
                }

                // Find or map category
                Category category = null;
                if (!categoryName.isEmpty()) {
                    category = categoryMap.get(categoryName.toLowerCase());
                }

                if (category == null) {
                    // Fallback to "Khác"
                    category = categoryMap.get("khác");
                    if (category == null) {
                        Category khac = new Category();
                        khac.setName("Khác");
                        khac.setTaxRate(0.08);
                        khac.setNote("Danh mục mặc định cho sản phẩm nhập Excel chưa phân loại");
                        category = categoryRepository.save(khac);
                        categoryMap.put("khác", category);
                    }
                }

                // Create and buffer Product
                Product product = new Product();
                product.setName(name);
                product.setBarcode(barcode);
                product.setCategory(category);
                product.setSalePrice(salePrice);
                product.setImportPrice(0.0);
                product.setStockQuantity(0.0);
                product.setLowStock(30.0);
                product.setCreatedAt(LocalDateTime.now());

                productsToSave.add(product);

                existingNames.add(name.toLowerCase());
                existingBarcodes.add(barcode.toLowerCase());
                successCount++;
            }

            // Perform batch save at the end to minimize DB roundtrips
            if (!productsToSave.isEmpty()) {
                productRepository.saveAll(productsToSave);
            }

            workbook.close();

            response.put("successCount", successCount);
            response.put("failedCount", failedCount);
            response.put("errors", errors);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("successCount", 0);
            response.put("failedCount", 0);
            response.put("errors", Collections.singletonList("Lỗi khi đọc file Excel: " + e.getMessage()));
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/import-excel/template")
    public void downloadTemplate(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=template_import_san_pham.xlsx");

        Workbook workbook = new XSSFWorkbook();

        // Sheet 1: Product List
        Sheet sheet1 = workbook.createSheet("Danh sách sản phẩm");

        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        // Row 1: Product Table Headers
        Row row1 = sheet1.createRow(0);
        String[] headers = {"STT", "Mã vạch", "Tên sản phẩm", "Danh mục", "Giá bán"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row1.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Sample Row 2
        Row row2 = sheet1.createRow(1);
        row2.createCell(0).setCellValue(1);
        row2.createCell(1).setCellValue("BT00001");
        row2.createCell(2).setCellValue("C2 Trà Đào");
        row2.createCell(3).setCellValue("Bottled Tea");
        row2.createCell(4).setCellValue(10000);

        for (int i = 0; i < headers.length; i++) {
            sheet1.autoSizeColumn(i);
        }

        // Query current categories
        List<Category> categories = categoryRepository.findAll();
        List<String> catNames = new ArrayList<>();
        for (Category c : categories) {
            if (c.getName() != null && !c.getName().trim().isEmpty()) {
                catNames.add(c.getName().trim());
            }
        }
        if (catNames.isEmpty()) {
            catNames.add("Khác");
        }

        // Sheet 3: Hidden category data list for dropdown referencing
        Sheet hiddenSheet = workbook.createSheet("CategoriesListData");
        for (int i = 0; i < catNames.size(); i++) {
            Row row = hiddenSheet.createRow(i);
            Cell cell = row.createCell(0);
            cell.setCellValue(catNames.get(i));
        }
        workbook.setSheetHidden(workbook.getSheetIndex("CategoriesListData"), true);

        // Data validation for Category column (index 3)
        CellRangeAddressList addressList = new CellRangeAddressList(1, 999, 3, 3);
        DataValidationHelper validationHelper = sheet1.getDataValidationHelper();
        DataValidationConstraint constraint = validationHelper.createFormulaListConstraint("CategoriesListData!$A$1:$A$" + catNames.size());
        DataValidation validation = validationHelper.createValidation(constraint, addressList);
        validation.setShowErrorBox(true);
        validation.createErrorBox("Lỗi chọn danh mục", "Vui lòng chọn danh mục hợp lệ từ danh sách dropdown.");
        sheet1.addValidationData(validation);

        // Sheet 2: Instructions
        Sheet sheet2 = workbook.createSheet("Hướng dẫn");
        Row s2Row1 = sheet2.createRow(0);
        String[] s2Headers = {"Cột", "Hướng dẫn điền", "Giá trị hợp lệ"};
        for (int i = 0; i < s2Headers.length; i++) {
            Cell cell = s2Row1.createCell(i);
            cell.setCellValue(s2Headers[i]);
            cell.setCellStyle(headerStyle);
        }

        String[][] instructions = {
            {"STT", "Số thứ tự dòng sản phẩm", "Số nguyên"},
            {"Mã vạch", "Mã vạch hoặc SKU định danh duy nhất", "Văn bản không trùng lặp. Nếu trống hệ thống sẽ tự sinh dạng SPXXXXXX"},
            {"Tên sản phẩm", "Tên hiển thị của sản phẩm trong kho", "Văn bản không được để trống, không được trùng với tên sản phẩm sẵn có"},
            {"Danh mục", "Tên danh mục phân loại sản phẩm", "Tên danh mục có sẵn. Nếu trống hoặc chưa có, hệ thống tự xếp vào danh mục 'Khác'"},
            {"Giá bán", "Giá bán lẻ niêm yết cho sản phẩm", "Số lớn hơn 0"}
        };

        for (int i = 0; i < instructions.length; i++) {
            Row row = sheet2.createRow(i + 1);
            row.createCell(0).setCellValue(instructions[i][0]);
            row.createCell(1).setCellValue(instructions[i][1]);
            row.createCell(2).setCellValue(instructions[i][2]);
        }

        for (int i = 0; i < 3; i++) {
            sheet2.autoSizeColumn(i);
        }

        workbook.write(response.getOutputStream());
        workbook.close();
    }

    private String generateUniqueBarcode(Set<String> existingBarcodes, int[] nextSuffix) {
        while (true) {
            String code = String.format("SP%06d", nextSuffix[0]);
            if (!existingBarcodes.contains(code.toLowerCase())) {
                existingBarcodes.add(code.toLowerCase());
                return code;
            }
            nextSuffix[0]++;
        }
    }
}
