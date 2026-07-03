# 🛒 SmartStore - POS Management System

Hệ thống quản lý bán hàng tại quầy (Point of Sale — POS) và quản lý kho toàn diện được thiết kế để chuẩn hóa, tự động hóa quy trình vận hành của các cửa hàng bán lẻ quy mô vừa và nhỏ. Hệ thống được phát triển theo mô hình kiến trúc Client-Server độc lập, tối ưu hóa nghiệp vụ dữ liệu bằng PostgreSQL Trigger và trực quan hóa báo cáo doanh số bằng đồ họa SVG động.

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ / Thư viện | Phiên bản thực tế | Vai trò trong hệ thống |
|---|---|---|---|
| **Frontend** | Angular Framework | 21.2.0 | Xây dựng giao diện đơn trang SPA, quản lý luồng dữ liệu |
| **Frontend** | TypeScript | 5.9.2 | Ngôn ngữ lập trình chính cho Frontend với kiểu dữ liệu tĩnh |
| **Frontend** | RxJS | 7.8.0 | Quản lý và xử lý các sự kiện bất đồng bộ |
| **Backend** | Java | 21 (LTS) | Nền tảng biên dịch và chạy ứng dụng phía Server |
| **Backend** | Spring Boot | 4.0.7 | Framework phát triển RESTful API, Dependency Injection |
| **Backend** | Apache POI | 5.2.5 | Đọc/ghi và phân tích file Excel nhập hàng |
| **Database** | PostgreSQL | 16 | Hệ quản trị cơ sở dữ liệu quan hệ và xử lý trigger nghiệp vụ |

---

## ✨ Các chức năng chính

### 🏪 Bán hàng tại quầy (Sales / POS)
- Giao diện bán hàng trực quan, hỗ trợ quét mã vạch (barcode) hoặc tìm kiếm sản phẩm nhanh.
- Giỏ hàng động hỗ trợ điều chỉnh số lượng và tự động tính toán tiền hàng.
- Áp thuế suất VAT động (8% hoặc 10%) dựa trên danh mục sản phẩm.
- Tính tiền thừa tự động cho khách hàng với bàn phím số ảo hỗ trợ thanh toán Tiền mặt / Thẻ / Chuyển khoản QR.

### 📦 Quản lý kho hàng (Inventory)
- Xem danh sách tồn kho thực tế của toàn bộ sản phẩm.
- Cảnh báo trực quan sản phẩm sắp hết hàng (Low Stock) bằng màu cam và hết hàng (Out of Stock) bằng màu đỏ nổi bật.
- Hỗ trợ lọc sản phẩm theo danh mục, tìm kiếm theo tên hoặc mã vạch và sắp xếp động.

### 📥 Nhập hàng (Imports)
- Lập phiếu đặt hàng trạng thái `PENDING` từ các nhà cung cấp.
- Nhập hàng loạt sản phẩm bằng file Excel thông minh (phân tích tệp tin qua Apache POI), tự động kiểm tra lỗi định dạng và sản phẩm không tồn tại trước khi nạp.
- Xác nhận nhận hàng thực tế (`RECEIVED`), tự động cập nhật số lượng tồn kho tổng, cập nhật giá bán mới và giá nhập mới của sản phẩm.

### 🧾 Lịch sử giao dịch & Trả hàng (Transactions & Returns)
- Xem lịch sử toàn bộ các hóa đơn bán hàng và phiếu hoàn trả hàng.
- Xem chi tiết từng hóa đơn bao gồm thông tin sản phẩm, đơn giá, thuế suất áp dụng tại thời điểm bán.
- Xử lý trả hàng hoàn kho có điều kiện: Cộng lại kho nếu hàng còn tốt (`Good`), giữ nguyên kho nếu hàng bị lỗi hỏng (`Damaged`), ghi log kho hàng và tự động cập nhật tổng tiền hoàn lại.

### 📈 Thống kê & Báo cáo động (Reports)
- Thống kê 6 chỉ số KPI cốt lõi: Doanh thu, Giá vốn, Lợi nhuận gộp, Biên lợi nhuận, Số đơn hàng, Số sản phẩm bán ra.
- Trực quan hóa xu hướng doanh thu và lợi nhuận bằng biểu đồ đường cong và biểu đồ cột tự vẽ bằng **Custom SVG Path Binding** tối ưu dung lượng tải trang.

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────┐
│       Frontend (Angular)        │  ← Port 4200 (SPA)
│       HTML · TS · CSS (SVG)     │
└────────────────┬────────────────┘
                 │
                 │ REST API (JSON) / Vercel Proxy Rewrite
                 ▼
┌─────────────────────────────────┐
│     Backend (Spring Boot)       │  ← Port 8080
│     Java 21 · JPA · POI 5.2.5   │
└────────────────┬────────────────┘
                 │
                 │ JDBC / Dialect
                 ▼
┌─────────────────────────────────┐
│       PostgreSQL Database       │  ← Port 1602 (project2_db)
│   Tables · Triggers · Functions │
└─────────────────────────────────┘
```

---

## 🗄️ Database Triggers (Điểm nhấn nghiệp vụ mức CSDL)

Dự án chuyển dịch các xử lý nghiệp vụ nặng về dữ liệu xuống PostgreSQL để bảo đảm an toàn dữ liệu và phòng ngừa Race Condition:
- `trg_after_insert_order_item`: Tự động trừ kho sản phẩm (dùng khóa dòng `FOR UPDATE`) và ghi nhật ký 'SALE' vào `inventory_logs` khi có đơn bán hàng mới.
- `trg_update_order_totals`: Tự động lấy thuế suất danh mục, tính sub_total cho từng dòng sản phẩm và cộng dồn net_amount, tax, total_amount vào bảng orders.
- `trg_after_insert_import_item`: Tự động tăng kho sản phẩm và ghi log 'IMPORT' khi nhận hàng.
- `trg_after_insert_return_item`: Cộng kho có điều kiện (hàng còn tốt/hỏng), ghi log 'RETURN' và tự động cập nhật tổng tiền hoàn lại vào bảng returns.
- `trg_log_price_changes`: Tự động ghi lại giá bán/giá nhập cũ và mới vào bảng `price_histories` khi có thay đổi giá sản phẩm.
- `trg_prevent_delete_order`: Chặn đứng hành vi xóa hóa đơn bán lẻ để tránh thất thoát tài chính.

---

## ⚙️ Hướng dẫn khởi chạy dưới Local

### Yêu cầu hệ thống
- Java Development Kit (JDK) 21+
- Node.js 18+ & npm
- PostgreSQL 16 (chạy tại port 1602 hoặc tùy chỉnh)

### 1. Khởi tạo Cơ sở dữ liệu
```sql
-- Chạy DBMS PostgreSQL, tạo cơ sở dữ liệu
CREATE DATABASE project2_db;
```
Import cấu trúc bảng, dữ liệu mẫu và các Trigger bằng cách chạy tệp [database.sql](file:///d:/Hust/project.2/database.sql):
```bash
psql -U postgres -d project2_db -p 1602 -f database.sql
```

### 2. Cấu hình kết nối Backend
Chỉnh sửa cấu hình kết nối PostgreSQL trong tệp `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:1602/project2_db
spring.datasource.username=postgres
spring.datasource.password=your_password
```

### 3. Khởi chạy Backend Spring Boot
```bash
./mvnw spring-boot:run
# Backend API sẽ khởi động tại địa chỉ http://localhost:8080
```

### 4. Khởi chạy Frontend Angular
```bash
cd frontend
npm install
npm start
# Giao diện ứng dụng sẽ chạy tại địa chỉ http://localhost:4200
```

---

## 👨‍💻 Tác giả
- **Họ và tên:** Dương Gia Huy
- **MSSV:** 20236035
- **Môn học:** Project 2 — IT3930
- **Trường:** Đại học Bách Khoa Hà Nội
