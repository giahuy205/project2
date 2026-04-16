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
  products: any[] = [];
  filteredProducts: any[] = [];
  selectedCategoryId: number | null = null;
  
  showModal = false;
  viewMode: 'categories' | 'products' = 'products'; // Default view
  
  newCategory = {
    name: '',
    taxRate: 0,
    note: ''
  };

  API_CAT_URL = 'http://localhost:8080/api/categorys';
  API_PROD_URL = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<any[]>(this.API_CAT_URL).subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Backend offline or Error fetching categories', err)
    });
    
    this.http.get<any[]>(this.API_PROD_URL).subscribe({
      next: (data) => {
        this.products = data;
        this.filterProducts();
      },
      error: (err) => console.error('Backend offline or Error fetching products', err)
    });
  }

  filterProducts() {
    if (this.selectedCategoryId === null) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(p => p.category && p.category.id === this.selectedCategoryId);
    }
  }

  onFilterChange(event: any) {
    const val = event.target.value;
    this.selectedCategoryId = val === 'all' ? null : parseInt(val, 10);
    this.filterProducts();
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
    this.http.post(this.API_CAT_URL, this.newCategory).subscribe({
      next: (res) => {
        alert('Category added successfully!');
        this.loadData();
        this.closeModal();
      },
      error: (err) => alert('Save failed! Is the backend running?')
    });
  }
}
"""

inventory_html = """
<div class="page-layout">
  <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
    <div>
      <h2 style="display: inline-block; margin-right: 1rem;">Inventory</h2>
      <select class="form-control" style="width: auto; display: inline-block;" [(ngModel)]="viewMode">
        <option value="products">View Products (Store Stock)</option>
        <option value="categories">View Categories</option>
      </select>
    </div>
    
    <button *ngIf="viewMode === 'categories'" class="btn btn-primary" (click)="openModal()">Add Category</button>
  </div>
  
  <!-- PRODUCTS VIEW -->
  <div class="card" *ngIf="viewMode === 'products'">
    <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem;">
      <label>Filter Store Stock by Category:</label>
      <select class="form-control" style="width: 250px;" (change)="onFilterChange($event)">
        <option value="all">All Categories (Entire Store)</option>
        <option *ngFor="let cat of categories" [value]="cat.id">{{cat.name}}</option>
      </select>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Barcode</th>
            <th>Category</th>
            <th>Stock Left</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of filteredProducts">
            <td><strong>{{p.name}}</strong></td>
            <td>{{p.barcode}}</td>
            <td>{{p.category?.name || 'N/A'}}</td>
            <td>
              <span class="badge" [ngClass]="p.stockQuantity <= p.lowStock ? 'badge-warning' : 'badge-success'">
                {{p.stockQuantity}}
              </span>
            </td>
          </tr>
          <tr *ngIf="filteredProducts.length === 0">
            <td colspan="4" style="text-align: center; color: gray;">No products found in this category.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CATEGORIES VIEW -->
  <div class="card" *ngIf="viewMode === 'categories'">
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
        <label class="form-label">Category Name *</label>
        <input type="text" class="form-control" [(ngModel)]="newCategory.name" placeholder="e.g. Drinks">
      </div>
      <div class="form-group">
        <label class="form-label">Tax Rate (Decimal e.g. 0.08)</label>
        <input type="number" class="form-control" [(ngModel)]="newCategory.taxRate">
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

def write_f(path, c):
    with open(path, "w", encoding="utf-8") as file:
        file.write(c)

base = "d:\\Hust\\project.2\\frontend\\src\\app\\pages\\inventory\\"
write_f(base + "inventory.ts", inventory_ts)
write_f(base + "inventory.html", inventory_html)

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
    this.http.get<any[]>(this.API_PROD_URL).subscribe({
        next: res => this.products = res,
        error: err => console.error('Backend offline', err)
    });
    this.http.get<any[]>(this.API_CAT_URL).subscribe({
        next: res => this.categories = res,
        error: err => console.error('Backend offline', err)
    });
  }

  openModal() {
    if (this.categories.length === 0) {
      alert("Please add at least 1 Category in 'Inventory' first!");
      return;
    }
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
        alert('Product added successfully!');
        this.loadData();
        this.closeModal();
      },
      error: (err) => alert('Save failed! Is the backend running?')
    });
  }
}
"""
write_f("d:\\Hust\\project.2\\frontend\\src\\app\\pages\\products\\products.ts", products_ts)

print("Inventory updated")
