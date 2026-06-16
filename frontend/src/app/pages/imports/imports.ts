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
  
  // Pagination state
  currentPage: number = 1;
  pageSize: number = 10;
  pagedImports: any[] = [];
  totalPages: number = 1;
  pageNumbers: number[] = [];

  showImportModal = false;
  showDetailModal = false;
  selectedImport: any = null;
  importDetails: any[] = [];
  activeRowIndex: number | null = null;
  isSubmitting = false;
  showConfirmModal = false;
  
  // Form fields
  newImport: any = {
    supplierName: '',
    note: '',
    items: []
  };

  API_IMPORT_URL = '/api/imports';
  API_IMPORT_ITEM_URL = '/api/importitems';
  API_PROD_URL = '/api/products';

  toastMessage = '';
  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 5000);
  }

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
        this.currentPage = 1;
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching imports', err)
    });
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.importsList.length / this.pageSize) || 1;
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedImports = this.importsList.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
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
      quantity: null,
      unitPrice: 0,
      newPrice: null, // Will default to current salePrice
      expiryDate: null,
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

  onSearchTermChange(item: any) {
    if (item._productDetails && item.searchTerm !== item._productDetails.name) {
      item.productId = null;
      item._productDetails = null;
      item.unitPrice = 0;
      item.newPrice = null;
    }
    item.showResults = true;
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

  getValidationErrors(): string[] {
    const errors: string[] = [];
    const hasInvalidQuantity = this.newImport.items.some((i: any) => i.productId && (!i.quantity || i.quantity <= 0));
    const hasInvalidPrice = this.newImport.items.some((i: any) => i.productId && i.newPrice != null && i.unitPrice > 0 && i.newPrice < i.unitPrice);
    if (hasInvalidQuantity) errors.push('Invalid import quantity');
    if (hasInvalidPrice) errors.push('Check sale price');
    return errors;
  }

  saveImport() {
    // Validate
    if (this.newImport.items.length === 0) {
      alert("Please add at least 1 product!");
      return;
    }
    
    // Check if any product is not selected
    if (this.newImport.items.some((i: any) => !i.productId)) {
       alert("Please select a product for all lines!");
       return;
    }

    // Check validation errors
    if (this.getValidationErrors().length > 0) {
      return;
    }

    this.showConfirmModal = true;
  }

  executeSave() {
    this.showConfirmModal = false;
    this.isSubmitting = true;
    const requestData = {
      supplierName: this.newImport.supplierName,
      note: this.newImport.note,
      items: this.newImport.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        newPrice: i.newPrice,
        expiryDate: i.expiryDate
      }))
    };

    this.http.post(`${this.API_IMPORT_URL}/process`, requestData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeImportModal();
        this.showToast('Thêm phiếu nhập kho thành công!');
        this.loadImports();
        this.loadProducts(); // Reload products to update stock/prices locally
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Error importing products!');
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
