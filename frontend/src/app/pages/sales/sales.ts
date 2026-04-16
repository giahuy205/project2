import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];
  
  cart: any[] = [];
  subtotal = 0;
  taxTotal = 0;
  total = 0;
  searchQuery = '';
  selectedCategoryId: number | null = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.http.get<any[]>('/api/categorys').subscribe(res => {
      this.categories = res;
      this.cdr.detectChanges();
    });
    this.http.get<any[]>('/api/products').subscribe(res => {
      this.products = res;
      this.filteredProducts = res;
      this.cdr.detectChanges();
    });
  }

  filterByCategory(catId: number | null) {
    this.selectedCategoryId = catId;
    this.applyFilters();
  }

  searchProducts(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(p => {
      const matchCat = this.selectedCategoryId === null || (p.category && p.category.id === this.selectedCategoryId);
      const matchSearch = p.name.toLowerCase().includes(this.searchQuery) || p.barcode.includes(this.searchQuery);
      return matchCat && matchSearch;
    });
  }

  addToCart(product: any) {
    if (product.stockQuantity <= 0) return;
    const item = this.cart.find(i => i.product.id === product.id);
    if (item) {
      if (item.quantity < product.stockQuantity) {
        item.quantity++;
      }
    } else {
      if (product.stockQuantity >= 1) {
        this.cart.push({ product: product, quantity: 1 });
      }
    }
    this.calculateTotals();
  }

  increaseQuantity(item: any) {
    if (item.quantity < item.product.stockQuantity) {
      item.quantity++;
      this.calculateTotals();
    }
  }

  onQuantityChange(item: any) {
    if (item.quantity > item.product.stockQuantity) {
      item.quantity = item.product.stockQuantity;
    } else if (item.quantity < 1 || item.quantity === null || isNaN(item.quantity)) {
      item.quantity = 1;
    }
    this.calculateTotals();
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.cart = this.cart.filter(i => i !== item);
    }
    this.calculateTotals();
  }

  calculateTotals() {
    this.subtotal = 0;
    this.taxTotal = 0;
    for (const item of this.cart) {
      const lineTotal = item.product.salePrice * item.quantity;
      this.subtotal += lineTotal;
      const taxRate = item.product.category ? item.product.category.taxRate : 0;
      this.taxTotal += lineTotal * taxRate;
    }
    this.total = this.subtotal + this.taxTotal;
  }
}

