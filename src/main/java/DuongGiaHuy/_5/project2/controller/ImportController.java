package DuongGiaHuy._5.project2.controller;

import DuongGiaHuy._5.project2.dto.ImportRequestDTO;
import DuongGiaHuy._5.project2.dto.ReceiveImportRequestDTO;
import DuongGiaHuy._5.project2.entity.Import;
import DuongGiaHuy._5.project2.service.ImportService;
import DuongGiaHuy._5.project2.config.RequiresRole;
import DuongGiaHuy._5.project2.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/imports")
@CrossOrigin(origins = "*")
@RequiresRole("admin")
@RequiredArgsConstructor
public class ImportController {
    private final ImportService service;
    private final ProductRepository productRepo;

    @GetMapping
    public List<Import> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Import getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping("/process")
    public Import process(@RequestBody ImportRequestDTO request) {
        return service.processImport(request);
    }

    @PostMapping("/{id}/receive")
    public Import receive(@PathVariable Long id, @RequestBody ReceiveImportRequestDTO request) {
        return service.receiveImport(id, request);
    }

    @PostMapping("/{id}/cancel")
    public Import cancel(@PathVariable Long id) {
        return service.cancelImport(id);
    }

    @PostMapping
    public Import create(@RequestBody Import entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Import update(@PathVariable Long id, @RequestBody Import entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Template Nhập Hàng");
            
            // Header row
            org.apache.poi.ss.usermodel.Row header = sheet.createRow(0);
            String[] headers = {
                "Mã vạch (Barcode)", 
                "Số lượng đặt", 
                "Giá nhập dự kiến"
            };
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
            }
            
            // Add a sample row to guide the user
            org.apache.poi.ss.usermodel.Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("8930000000001");
            sampleRow.createCell(1).setCellValue(10);
            sampleRow.createCell(2).setCellValue(15000);
            
            // Auto size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            workbook.write(baos);
            
            HttpHeaders headersMap = new HttpHeaders();
            headersMap.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=template_nhap_hang.xlsx");
            headersMap.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headersMap.add(HttpHeaders.PRAGMA, "no-cache");
            headersMap.add(HttpHeaders.EXPIRES, "0");
            
            return ResponseEntity.ok()
                    .headers(headersMap)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(baos.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/parse-excel")
    public ResponseEntity<?> parseExcel(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            List<Map<String, Object>> parsedItems = new ArrayList<>();
            List<String> warnings = new ArrayList<>();
            
            try (java.io.InputStream is = file.getInputStream();
                 org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(is)) {
                 
                org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);
                int lastRow = sheet.getLastRowNum();
                
                for (int i = 1; i <= lastRow; i++) {
                    org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                    if (row == null) continue;
                    
                    String barcode = getCellStringValue(row.getCell(0));
                    if (barcode == null || barcode.trim().isEmpty()) {
                        continue;
                    }
                    
                    barcode = barcode.trim();
                    
                    java.util.Optional<DuongGiaHuy._5.project2.entity.Product> productOpt = productRepo.findByBarcode(barcode);
                    if (productOpt.isEmpty()) {
                        warnings.add("Dòng " + (i + 1) + ": Không tìm thấy sản phẩm có mã vạch '" + barcode + "'");
                        continue;
                    }
                    
                    DuongGiaHuy._5.project2.entity.Product product = productOpt.get();
                    
                    double quantity = getCellNumericValue(row.getCell(1), 1.0);
                    if (quantity <= 0) {
                        warnings.add("Dòng " + (i + 1) + " (" + product.getName() + "): Số lượng đặt (" + quantity + ") phải lớn hơn 0");
                        continue;
                    }
                    
                    double unitPrice = getCellNumericValue(row.getCell(2), product.getImportPrice() != null ? product.getImportPrice() : 0.0);
                    
                    Map<String, Object> item = new HashMap<>();
                    item.put("productId", product.getId());
                    item.put("productName", product.getName());
                    item.put("barcode", product.getBarcode());
                    item.put("quantity", quantity);
                    item.put("unitPrice", unitPrice);
                    item.put("newPrice", null);
                    item.put("expiryDate", null);
                    
                    parsedItems.add(item);
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("items", parsedItems);
            result.put("warnings", warnings);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi xử lý file Excel: " + e.getMessage());
        }
    }

    private String getCellStringValue(org.apache.poi.ss.usermodel.Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    return String.valueOf((long) val);
                } else {
                    return String.valueOf(val);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            default:
                return null;
        }
    }

    private double getCellNumericValue(org.apache.poi.ss.usermodel.Cell cell, double defaultValue) {
        if (cell == null) return defaultValue;
        switch (cell.getCellType()) {
            case NUMERIC:
                return cell.getNumericCellValue();
            case STRING:
                try {
                    return Double.parseDouble(cell.getStringCellValue().trim());
                } catch (Exception e) {
                    return defaultValue;
                }
            case FORMULA:
                try {
                    return cell.getNumericCellValue();
                } catch (Exception e) {
                    return defaultValue;
                }
            default:
                return defaultValue;
        }
    }
}
