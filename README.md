# 🛒 POS Management System

## 📌 Giới thiệu

Hệ thống quản lý bán hàng (Point of Sale — POS) được xây dựng nhằm hỗ trợ các nghiệp vụ cơ bản của một cửa hàng bán lẻ, bao gồm: quản lý sản phẩm, danh mục, nhập kho, bán hàng, và theo dõi lịch sử giao dịch.

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| **Backend** | Java 17 · Spring Boot 3 · Spring Data JPA |
| **Frontend** | Angular 18 · TypeScript · HTML · CSS |
| **Cơ sở dữ liệu** | PostgreSQL |
| **Build tool** | Apache Maven |
| **Version control** | Git · GitHub |

---

## ✨ Chức năng chính

### 🏪 Bán hàng (Sales / POS)
- Tìm kiếm và lọc sản phẩm theo danh mục
- Thêm sản phẩm vào giỏ hàng, điều chỉnh số lượng
- Thanh toán bằng Tiền mặt / Thẻ / QR
- Tính tiền thừa tự động qua bàn phím số

### 📦 Quản lý kho (Inventory)
- Xem tồn kho theo từng sản phẩm
- Cảnh báo hàng sắp hết (Low Stock) và hết hàng (Out of Stock)
- Highlight dòng sản phẩm hết hàng
- Lọc theo danh mục, trạng thái tồn kho, tìm kiếm theo tên/mã vạch
- Sắp xếp cột tương tác

### 📥 Nhập hàng (Import)
- Tạo phiếu nhập hàng từ nhiều sản phẩm
- Tìm kiếm sản phẩm theo tên hoặc mã vạch (combo box)
- Tự động cập nhật tồn kho sau khi xác nhận
- Hỗ trợ cập nhật giá bán mới khi nhập hàng
- Chống trùng lặp đơn nhập (disable UI khi đang xử lý)

### 🧾 Lịch sử giao dịch (Transactions)
- Xem danh sách toàn bộ giao dịch bán hàng
- Lọc theo loại (Bán / Hoàn trả) và khoảng thời gian
- Xem chi tiết từng hóa đơn (sản phẩm, thuế, tổng tiền)
- Phân trang

### 🗂️ Quản lý danh mục & Sản phẩm
- CRUD danh mục (tên, thuế suất, ghi chú)
- CRUD sản phẩm (tên, mã vạch, giá nhập, giá bán, tồn kho)
- Thuế suất tính động theo từng danh mục (8% hoặc 10%)

---

## 🏗️ Kiến trúc hệ thống

```
┌──────────────────────┐
│  Frontend (Angular)  │  ← Port 4200
│  HTML · TS · CSS     │
└──────────┬───────────┘
           │ REST API (JSON)
           ▼
┌──────────────────────┐
│  Backend (Spring Boot│  ← Port 8080
│  Java · JPA          │
└──────────┬───────────┘
           │ JDBC
           ▼
┌──────────────────────┐
│  PostgreSQL Database │  ← Port 1602
└──────────────────────┘
```

---

## 🗂️ Cấu trúc thư mục

```
project.2/
├── src/
│   └── main/
│       ├── java/.../
│       │   ├── controller/   ← REST API endpoints
│       │   ├── service/      ← Business logic
│       │   ├── entity/       ← JPA entities
│       │   ├── repository/   ← Spring Data repositories
│       │   ├── dto/          ← Data Transfer Objects
│       │   └── config/       ← CORS, Security config
│       └── resources/
│           └── application.properties
├── frontend/
│   └── src/app/
│       ├── pages/            ← Các trang: sales, inventory, imports...
│       └── components/       ← Sidebar, Topbar
├── database.sql              ← Schema + Trigger + Seed data
└── pom.xml
```

---

## ⚙️ Hướng dẫn chạy local

### Yêu cầu
- Java 17+
- Node.js 18+ & npm
- PostgreSQL
- Maven (hoặc dùng `mvnw` đính kèm)

### 1. Khởi tạo Database
```sql
-- Tạo database
CREATE DATABASE project2_db;

-- Import schema (chạy file database.sql)
psql -U postgres -d project2_db -f database.sql
```

### 2. Cấu hình kết nối
Chỉnh sửa `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:<PORT>/project2_db
spring.datasource.username=<USERNAME>
spring.datasource.password=<PASSWORD>
```

Hoặc dùng biến môi trường:
```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/project2_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=yourpassword
```

### 3. Chạy Backend
```bash
./mvnw spring-boot:run
# Backend chạy tại http://localhost:8080
```

### 4. Chạy Frontend
```bash
cd frontend
npm install
npm start
# Frontend chạy tại http://localhost:4200
```

---

## 📡 API Endpoints chính

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm |
| GET | `/api/categorys` | Danh sách danh mục |
| POST | `/api/orders/create` | Tạo đơn hàng mới |
| GET | `/api/orders` | Lịch sử đơn hàng |
| POST | `/api/imports` | Tạo phiếu nhập hàng |
| GET | `/api/imports` | Danh sách phiếu nhập |

---

## 🗄️ Database

Hệ thống sử dụng các bảng chính:

| Bảng | Mô tả |
|---|---|
| `categories` | Danh mục sản phẩm (có thuế suất) |
| `products` | Thông tin sản phẩm |
| `orders` / `order_items` | Đơn hàng bán lẻ |
| `imports` / `import_items` | Phiếu nhập kho |
| `price_history` | Lịch sử thay đổi giá |
| `inventory_logs` | Nhật ký thay đổi tồn kho |

> Database sử dụng **trigger** (`trg_after_insert_import_item`) để tự động cập nhật tồn kho khi có phiếu nhập mới.

---

## 🚀 Kế hoạch phát triển (Roadmap)

Các tính năng dự kiến sẽ triển khai trong thời gian tới:

### 📈 Báo cáo & Thống kê nâng cao
- Biểu đồ doanh thu, lợi nhuận theo tháng/quý.
- Thống kê thu chi chi tiết và báo cáo kết quả kinh doanh.

### 👥 Quản lý nhân sự & Bảo mật
- **Quản lý tài khoản:** Hệ thống đăng nhập, đăng xuất bảo mật.
- **Phân quyền (RBAC):** 
  - **Admin:** Toàn quyền quản lý hệ thống, xem báo cáo doanh thu.
  - **Staff:** Chỉ thực hiện bán hàng và kiểm tra kho.
- **Quản lý nhân viên:** Lưu trữ thông tin và lịch sử làm việc của nhân viên.

### ⚙️ Cấu hình hệ thống (Settings)
- Cho phép Admin tùy chỉnh thông tin cửa hàng.
- Cấu hình linh hoạt ngưỡng cảnh báo tồn kho thấp (Low Stock Threshold) cho từng sản phẩm hoặc danh mục.

### 📄 Xuất bản dữ liệu (Export)
- Hỗ trợ in hóa đơn bán hàng trực tiếp.
- Xuất dữ liệu danh sách sản phẩm, đơn nhập hàng, báo cáo ra file **PDF / Excel**.

---

## 👨‍💻 Tác giả

| Thông tin | Chi tiết |
|---|---|
| **Họ và tên** | Dương Gia Huy |
| **MSSV** | 20236035 |
| **Môn học** | Project 2 — IT3930 |
| **Trường** | Đại học Bách Khoa Hà Nội |
| **GitHub** | [giahuy205/project2](https://github.com/giahuy205/project2) |
