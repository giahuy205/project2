import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-imports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './imports.html',
  styleUrl: './imports.css',
})
export class ImportsComponent implements OnInit {
  importsList: any[] = [];
  products: any[] = [];
  
  showImportModal = false;
  showDetailModal = false;
  selectedImport: any = null;
  importDetails: any[] = [];
  activeRowIndex: number | null = null;
  isSubmitting = false;
  
  // Form fields
  newImport: any = {
    supplierName: '',
    note: '',
    items: []
  };

  API_IMPORT_URL = '/api/imports';
  API_IMPORT_ITEM_URL = '/api/importitems';
  API_PROD_URL = '/api/products';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadImports();
    this.loadProducts();
  }

  loadImports() {
    this.http.get<any[]>(this.API_IMPORT_URL).subscribe({
      next: (data) => {
        this.importsList = data.sort((a, b) => {
           return new Date(b.importDate).getTime() - new Date(a.importDate).getTime();
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching imports', err)
    });
  }

  loadProducts() {
    this.http.get<any[]>(this.API_PROD_URL).subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (err) => console.error('Error fetching products', err)
    });
  }

  openImportModal() {
    this.newImport = { supplierName: '', note: '', items: [] };
    this.activeRowIndex = 0;
    this.addLine(); // Add an empty line by default
    this.showImportModal = true;
  }

  setActiveRow(index: number) {
    this.activeRowIndex = index;
  }

  closeImportModal() {
    this.showImportModal = false;
  }

  addLine() {
    this.newImport.items.push({
      productId: null,
      searchTerm: '',
      showResults: false,
      showAll: false,
      quantity: 1,
      unitPrice: 0,
      newPrice: null, // Will default to current salePrice
      _productDetails: null // to store temporary product info like old price, stock
    });
  }

  getFilteredProducts(item: any) {
    // If we want to show all results (triggered by arrow) and searchTerm is empty
    if (item.showAll && !item.searchTerm) return this.products;
    
    // Normal filtering
    if (!item.searchTerm) return item.showAll ? this.products : [];
    
    const term = item.searchTerm.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.barcode && p.barcode.toLowerCase().includes(term))
    ).slice(0, 10); // Limit to 10 results
  }

  toggleAllResults(item: any) {
    item.showAll = !item.showAll;
    item.showResults = item.showAll;
    if (item.showAll) {
      this.setActiveRow(this.newImport.items.indexOf(item));
    }
  }

  selectProduct(item: any, product: any) {
    item.productId = product.id;
    item.searchTerm = product.name;
    item.showResults = false;
    item.showAll = false;
    this.onProductSelect(item);
  }

  // Helper to use in template for blur delay
  hideResults(item: any) {
    setTimeout(() => {
      item.showResults = false;
      this.cdr.detectChanges();
    }, 200);
  }

  removeLine(index: number) {
    this.newImport.items.splice(index, 1);
    if (this.activeRowIndex === index) {
      this.activeRowIndex = this.newImport.items.length > 0 ? this.newImport.items.length - 1 : 0;
    }
  }

  onProductSelect(item: any) {
    const product = this.products.find(p => p.id === Number(item.productId));
    if (product) {
      item.productId = product.id; // ensure it is a number
      item._productDetails = product;
      item.unitPrice = product.importPrice || 0;
      item.newPrice = product.salePrice || 0;
    }
  }

  getTotalImportCost() {
    return this.newImport.items.reduce((total: number, item: any) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  }

  saveImport() {
    // Validate
    if (this.newImport.items.length === 0) {
      alert("Vui lòng thêm ít nhất 1 sản phẩm!");
      return;
    }
    
    // Check if any product is not selected
    if (this.newImport.items.some((i: any) => !i.productId)) {
       alert("Vui lòng chọn sản phẩm cho tất cả các dòng!");
       return;
    }

    this.isSubmitting = true;
    const requestData = {
      supplierName: this.newImport.supplierName,
      note: this.newImport.note,
      items: this.newImport.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        newPrice: i.newPrice
      }))
    };

    this.http.post(`${this.API_IMPORT_URL}/process`, requestData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeImportModal();
        this.loadImports();
        this.loadProducts(); // Reload products to update stock/prices locally
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Lỗi khi nhập hàng!');
        console.error(err);
      }
    });
  }

  viewDetails(importObj: any) {
    this.selectedImport = importObj;
    this.http.get<any[]>(`${this.API_IMPORT_ITEM_URL}/import/${importObj.id}`).subscribe({
      next: (data) => {
        this.importDetails = data;
        this.showDetailModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching import details', err)
    });
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedImport = null;
    this.importDetails = [];
  }
}
