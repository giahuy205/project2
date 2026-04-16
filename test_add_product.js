const apiUrl = "http://localhost:8080/api/products";

fetch(apiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test Reload",
    barcode: "T-001",
    category: { id: 1 },
    importPrice: 10,
    salePrice: 20,
    stockQuantity: 100,
    lowStock: 5
  })
})
.then(res => res.json())
.then(data => console.log("Created:", data))
.then(() => fetch(apiUrl))
.then(res => res.json())
.then(data => console.log("All Products:", data));
