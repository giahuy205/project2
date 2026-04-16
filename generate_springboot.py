import os

base_pkg = "DuongGiaHuy._5.project2"
base_dir = "d:\\Hust\\project.2\\src\\main\\java\\DuongGiaHuy\\_5\\project2\\"

directories = ["entity", "repository", "service", "controller", "dto"]
for d in directories:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

entities = {
    "Account": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@Column(unique = true, nullable = false)", "private String username;"),
        ("@Column(nullable = false)", "private String passwordHash;"),
        ("@Column(nullable = false)", "private String fullName;"),
        ("@Column(unique = true)", "private String email;"),
        ("private String role = \"staff\";", ""),
        ("private Boolean isActive = true;", ""),
        ("private java.time.LocalDateTime createdAt;", "")
    ],
    "Category": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@Column(unique = true, nullable = false)", "private String name;"),
        ("private String note;", ""),
        ("private Double taxRate = 0.08;", "")
    ],
    "Product": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@ManyToOne", "@JoinColumn(name = \"categories_id\")", "private Category category;"),
        ("@Column(unique = true, nullable = false)", "private String barcode;"),
        ("@Column(nullable = false)", "private String name;"),
        ("@Column(nullable = false)", "private Double importPrice;"),
        ("@Column(nullable = false)", "private Double salePrice;"),
        ("private Double stockQuantity = 0.0;", ""),
        ("private Double lowStock = 10.0;", ""),
        ("private java.time.LocalDateTime createdAt;", ""),
        ("@ManyToOne", "@JoinColumn(name = \"updated_by_id\")", "private Account updatedBy;")
    ],
    "Order": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("private java.time.LocalDate orderDate;", ""),
        ("private Double netAmount = 0.0;", ""),
        ("private Double tax = 0.0;", ""),
        ("private Double totalAmount = 0.0;", "")
    ],
    "OrderItem": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@ManyToOne", "@JoinColumn(name = \"order_id\")", "private Order order;"),
        ("@ManyToOne", "@JoinColumn(name = \"product_id\")", "private Product product;"),
        ("private Double quantity;", ""),
        ("private Double unitPrice;", ""),
        ("private Double subTotal;", ""),
        ("private Double appliedTaxRate;", "")
    ],
    "Import": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("private String supplierName;", ""),
        ("private Double totalCost = 0.0;", ""),
        ("private java.time.LocalDateTime importDate;", "")
    ],
    "ImportItem": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@ManyToOne", "@JoinColumn(name = \"import_id\")", "private Import importObj;"),
        ("@ManyToOne", "@JoinColumn(name = \"product_id\")", "private Product product;"),
        ("private Integer quantity;", ""),
        ("private Double unitPrice;", "")
    ],
    "InventoryLog": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@ManyToOne", "@JoinColumn(name = \"product_id\")", "private Product product;"),
        ("private Double changeAmount;", ""),
        ("private Double oldStock;", ""),
        ("private Double newStock;", ""),
        ("private String type;", ""),
        ("private String note;", ""),
        ("private java.time.LocalDateTime time;", "")
    ],
    "ReturnOrder": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@ManyToOne", "@JoinColumn(name = \"order_id\")", "private Order order;"),
        ("private java.time.LocalDateTime returnDate;", ""),
        ("private Double totalRefundAmount = 0.0;", ""),
        ("private String reason;", "")
    ],
    "ReturnItem": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@ManyToOne", "@JoinColumn(name = \"return_id\")", "private ReturnOrder returnOrder;"),
        ("@ManyToOne", "@JoinColumn(name = \"product_id\")", "private Product product;"),
        ("private Integer quantity;", ""),
        ("private Double refundPrice;", ""),
        ("private String itemCondition = \"Good\";", "")
    ],
    "PriceHistory": [
        ("@Id @GeneratedValue(strategy = GenerationType.IDENTITY)", "private Long id;"),
        ("@ManyToOne", "@JoinColumn(name = \"product_id\")", "private Product product;"),
        ("private Double oldImportPrice;", ""),
        ("private Double newImportPrice;", ""),
        ("private Double oldSellingPrice;", ""),
        ("private Double newSellingPrice;", ""),
        ("@ManyToOne", "@JoinColumn(name = \"updated_by\")", "private Account updatedBy;"),
        ("private java.time.LocalDateTime updatedAt;", "")
    ]
}

for entity_name, fields in entities.items():
    content = f"package {base_pkg}.entity;\n\n"
    content += "import jakarta.persistence.*;\nimport lombok.*;\n\n"
    table_name = "returns" if entity_name == "ReturnOrder" else \
                 "imports" if entity_name == "Import" else \
                 "categories" if entity_name == "Category" else \
                 "accounts" if entity_name == "Account" else \
                 "price_histories" if entity_name == "PriceHistory" else \
                 "inventory_logs" if entity_name == "InventoryLog" else \
                 entity_name.lower() + "s"
    
    # some tables have special names in sql:
    # orders => orders, order_items => order_items, import_items => import_items, products => products, return_items => return_items
    if entity_name in ["Order", "OrderItem", "ImportItem", "ReturnItem", "Product", "Account", "Category"]:
        if entity_name == "Category":
            table_name = "categories"
        elif entity_name == "Account":
            table_name = "accounts"
        else:
            table_name = "".join(['_'+c.lower() if c.isupper() else c for c in entity_name]).lstrip('_') + "s"
            
    content += f"@Entity\n@Table(name = \"{table_name}\")\n@Getter\n@Setter\n@NoArgsConstructor\n@AllArgsConstructor\n"
    content += f"public class {entity_name} {{\n"
    for field in fields:
        for annotation in field[:-1]:
            if annotation:
                content += f"    {annotation}\n"
        if field[-1]:
            content += f"    {field[-1]}\n"
    content += "}\n"
    write_file(os.path.join(base_dir, "entity", f"{entity_name}.java"), content)

    # Repository
    repo_content = f"package {base_pkg}.repository;\n\n"
    repo_content += f"import {base_pkg}.entity.{entity_name};\n"
    repo_content += "import org.springframework.data.jpa.repository.JpaRepository;\n"
    repo_content += "import org.springframework.stereotype.Repository;\n\n"
    repo_content += f"@Repository\npublic interface {entity_name}Repository extends JpaRepository<{entity_name}, Long> {{\n}}\n"
    write_file(os.path.join(base_dir, "repository", f"{entity_name}Repository.java"), repo_content)

    # Service
    service_content = f"package {base_pkg}.service;\n\n"
    service_content += f"import {base_pkg}.entity.{entity_name};\n"
    service_content += f"import {base_pkg}.repository.{entity_name}Repository;\n"
    service_content += "import org.springframework.beans.factory.annotation.Autowired;\n"
    service_content += "import org.springframework.stereotype.Service;\n"
    service_content += "import java.util.List;\n\n"
    service_content += f"@Service\npublic class {entity_name}Service {{\n"
    service_content += f"    @Autowired\n    private {entity_name}Repository repository;\n\n"
    service_content += f"    public List<{entity_name}> findAll() {{\n        return repository.findAll();\n    }}\n\n"
    service_content += f"    public {entity_name} findById(Long id) {{\n        return repository.findById(id).orElse(null);\n    }}\n\n"
    service_content += f"    public {entity_name} save({entity_name} entity) {{\n        return repository.save(entity);\n    }}\n\n"
    service_content += f"    public void deleteById(Long id) {{\n        repository.deleteById(id);\n    }}\n"
    service_content += "}\n"
    write_file(os.path.join(base_dir, "service", f"{entity_name}Service.java"), service_content)

    # Controller
    controller_content = f"package {base_pkg}.controller;\n\n"
    controller_content += f"import {base_pkg}.entity.{entity_name};\n"
    controller_content += f"import {base_pkg}.service.{entity_name}Service;\n"
    controller_content += "import org.springframework.beans.factory.annotation.Autowired;\n"
    controller_content += "import org.springframework.web.bind.annotation.*;\n"
    controller_content += "import java.util.List;\n\n"
    controller_content += f"@RestController\n@RequestMapping(\"/api/{entity_name.lower()}s\")\n"
    controller_content += f"@CrossOrigin(origins = \"*\")\n"
    controller_content += f"public class {entity_name}Controller {{\n"
    controller_content += f"    @Autowired\n    private {entity_name}Service service;\n\n"
    controller_content += f"    @GetMapping\n    public List<{entity_name}> getAll() {{\n        return service.findAll();\n    }}\n\n"
    controller_content += f"    @GetMapping(\"/{{id}}\")\n    public {entity_name} getById(@PathVariable Long id) {{\n        return service.findById(id);\n    }}\n\n"
    controller_content += f"    @PostMapping\n    public {entity_name} create(@RequestBody {entity_name} entity) {{\n        return service.save(entity);\n    }}\n\n"
    controller_content += f"    @PutMapping(\"/{{id}}\")\n    public {entity_name} update(@PathVariable Long id, @RequestBody {entity_name} entity) {{\n        return service.save(entity);\n    }}\n\n"
    controller_content += f"    @DeleteMapping(\"/{{id}}\")\n    public void delete(@PathVariable Long id) {{\n        service.deleteById(id);\n    }}\n"
    controller_content += "}\n"
    write_file(os.path.join(base_dir, "controller", f"{entity_name}Controller.java"), controller_content)

print("Generation completed successfully.")
