import os

inventory_ts = """
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit {
  categories: any[] = [];
  showModal = false;
  
  newCategory = {
    name: '',
    taxRate: 0,
    note: ''
  };

  API_URL = 'http://localhost:8080/api/categorys';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.http.get<any[]>(this.API_URL).subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => console.error('Error fetching categories', err)
    });
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.newCategory = { name: '', taxRate: 0, note: '' };
  }

  saveCategory() {
    if (!this.newCategory.name) return;
    this.http.post(this.API_URL, this.newCategory).subscribe({
      next: (res) => {
        console.log('Category saved', res);
        this.loadCategories();
        this.closeModal();
      },
      error: (err) => console.error('Error saving category', err)
    });
  }
}
"""

inventory_html = """
<div class="page-layout">
  <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
    <h2>Inventory / Categories</h2>
    <button class="btn btn-primary" (click)="openModal()">Add Category</button>
  </div>
  
  <div class="card">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Tax Rate (%)</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let cat of categories">
            <td>{{cat.id}}</td>
            <td><strong>{{cat.name}}</strong></td>
            <td>{{cat.taxRate * 100}}%</td>
            <td>{{cat.note}}</td>
          </tr>
          <tr *ngIf="categories.length === 0">
            <td colspan="4" style="text-align: center; color: gray;">No categories found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal Add Category -->
  <div class="modal-overlay" *ngIf="showModal">
    <div class="modal-content card slide-in">
      <h3 style="margin-bottom: 1rem;">Add New Category</h3>
      <div class="form-group">
        <label class="form-label">Category Name</label>
        <input type="text" class="form-control" [(ngModel)]="newCategory.name" placeholder="e.g. Drinks">
      </div>
      <div class="form-group">
        <label class="form-label">Tax Rate (%)</label>
        <input type="number" class="form-control" [(ngModel)]="newCategory.taxRate" placeholder="e.g. 0.08">
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <input type="text" class="form-control" [(ngModel)]="newCategory.note" placeholder="Description...">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-outline" (click)="closeModal()">Cancel</button>
        <button class="btn btn-primary" (click)="saveCategory()" [disabled]="!newCategory.name">Save</button>
      </div>
    </div>
  </div>
</div>
"""

inventory_css = """
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 999;
}
.modal-content {
  width: 400px;
  max-width: 90%;
  background: var(--surface);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.slide-in {
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
"""

products_ts = """
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  showModal = false;

  newProduct = {
    name: '',
    barcode: '',
    category: { id: null },
    importPrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    lowStock: 10
  };

  API_PROD_URL = 'http://localhost:8080/api/products';
  API_CAT_URL = 'http://localhost:8080/api/categorys';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<any[]>(this.API_PROD_URL).subscribe(res => this.products = res);
    this.http.get<any[]>(this.API_CAT_URL).subscribe(res => this.categories = res);
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.newProduct = {
      name: '', barcode: '', category: { id: null }, 
      importPrice: 0, salePrice: 0, stockQuantity: 0, lowStock: 10
    };
  }

  saveProduct() {
    if (!this.newProduct.name || !this.newProduct.barcode || !this.newProduct.category.id) return;
    this.http.post(this.API_PROD_URL, this.newProduct).subscribe({
      next: (res) => {
        this.loadData();
        this.closeModal();
      },
      error: (err) => console.error('Error saving product', err)
    });
  }
}
"""

products_html = """
<div class="page-layout">
  <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
    <h2>Product Management</h2>
    <button class="btn btn-primary" (click)="openModal()">Add Product</button>
  </div>
  
  <div class="card">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Barcode</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Import Price</th>
            <th>Sale Price</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of products">
            <td><strong>{{p.name}}</strong></td>
            <td>{{p.barcode}}</td>
            <td>{{p.category?.name || 'N/A'}}</td>
            <td>
              <span class="badge" [ngClass]="p.stockQuantity <= p.lowStock ? 'badge-warning' : 'badge-success'">
                {{p.stockQuantity}}
              </span>
            </td>
            <td>${{p.importPrice}}</td>
            <td>${{p.salePrice}}</td>
          </tr>
          <tr *ngIf="products.length === 0">
            <td colspan="6" style="text-align: center; color: gray;">No products found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal Add Product -->
  <div class="modal-overlay" *ngIf="showModal">
    <div class="modal-content card slide-in" style="width: 500px; max-height: 90vh; overflow-y: auto;">
      <h3 style="margin-bottom: 1rem;">Add New Product</h3>
      <div class="form-group">
        <label class="form-label">Product Name</label>
        <input type="text" class="form-control" [(ngModel)]="newProduct.name" placeholder="e.g. Espresso">
      </div>
      <div class="form-group">
        <label class="form-label">Barcode / SKU</label>
        <input type="text" class="form-control" [(ngModel)]="newProduct.barcode" placeholder="e.g. ESP-101">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-control" [(ngModel)]="newProduct.category.id">
          <option [ngValue]="null" disabled>Select Category</option>
          <option *ngFor="let cat of categories" [ngValue]="cat.id">{{cat.name}}</option>
        </select>
      </div>
      
      <div style="display: flex; gap: 1rem;">
        <div class="form-group" style="flex: 1;">
          <label class="form-label">Import Price</label>
          <input type="number" class="form-control" [(ngModel)]="newProduct.importPrice">
        </div>
        <div class="form-group" style="flex: 1;">
          <label class="form-label">Sale Price</label>
          <input type="number" class="form-control" [(ngModel)]="newProduct.salePrice">
        </div>
      </div>
      
      <div style="display: flex; gap: 1rem;">
        <div class="form-group" style="flex: 1;">
          <label class="form-label">Initial Stock</label>
          <input type="number" class="form-control" [(ngModel)]="newProduct.stockQuantity">
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-outline" (click)="closeModal()">Cancel</button>
        <button class="btn btn-primary" (click)="saveProduct()" [disabled]="!newProduct.name || !newProduct.barcode || !newProduct.category.id">Save</button>
      </div>
    </div>
  </div>
</div>
"""

products_css = """
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 999;
}
.modal-content {
  background: var(--surface);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.slide-in {
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: rgba(16, 185, 129, 0.1); color: var(--secondary); }
.badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
"""

def write_f(path, c):
    with open(path, "w", encoding="utf-8") as file:
        file.write(c)

base = "d:\\Hust\\project.2\\frontend\\src\\app\\pages\\"
write_f(base + "inventory\\inventory.ts", inventory_ts)
write_f(base + "inventory\\inventory.html", inventory_html)
write_f(base + "inventory\\inventory.css", inventory_css)

write_f(base + "products\\products.ts", products_ts)
write_f(base + "products\\products.html", products_html)
write_f(base + "products\\products.css", products_css)

print("Inventory and Products components updated successfully!")
