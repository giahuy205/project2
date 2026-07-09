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
  
  // Tab state
  activeTab: 'ordered' | 'received' = 'ordered';

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

  // Receiving state
  showReceiveModal = false;
  receivingImport: any = null;
  receivingItems: any[] = [];
  
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
  toastType: 'success' | 'error' = 'success';
  excelWarnings: string[] = [];
  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
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

  getFilteredImports(): any[] {
    if (this.activeTab === 'ordered') {
      return this.importsList.filter(imp => imp.status === 'PENDING' || imp.status === 'CANCELLED');
    } else {
      return this.importsList.filter(imp => imp.status === 'RECEIVED');
    }
  }

  updatePagination() {
    const filtered = this.getFilteredImports();
    this.totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedImports = filtered.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  switchTab(tab: 'ordered' | 'received') {
    this.activeTab = tab;
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: any) {
    if (page === '...') return;
    const pageNum = Number(page);
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      this.currentPage = pageNum;
      this.updatePagination();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  get startItemIndex(): number {
    const filteredCount = this.getFilteredImports().length;
    if (filteredCount === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItemIndex(): number {
    const filteredCount = this.getFilteredImports().length;
    const end = this.currentPage * this.pageSize;
    return end > filteredCount ? filteredCount : end;
  }

  getFilteredCount(): number {
    return this.getFilteredImports().length;
  }

  getVisiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    let start = Math.max(2, current - 2);
    let end = Math.min(total - 1, current + 2);
    if (current <= 4) {
      end = 5;
    } else if (current >= total - 3) {
      start = total - 4;
    }
    if (start > 2) {
      pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < total - 1) {
      pages.push('...');
    }
    pages.push(total);
    return pages;
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
    this.excelWarnings = [];
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
    if (item.showAll && !item.searchTerm) return this.products;
    if (!item.searchTerm) return item.showAll ? this.products : [];
    
    const term = item.searchTerm.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.barcode && p.barcode.toLowerCase().includes(term))
    ).slice(0, 10);
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
      item.productId = product.id;
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
    if (hasInvalidQuantity) errors.push('Số lượng đặt hàng không hợp lệ');
    if (hasInvalidPrice) errors.push('Kiểm tra lại giá bán mới (thấp hơn giá nhập)');
    return errors;
  }

  saveImport() {
    if (this.newImport.items.length === 0) {
      this.showToast("Vui lòng thêm ít nhất 1 sản phẩm!", "error");
      return;
    }
    
    if (this.newImport.items.some((i: any) => !i.productId)) {
       this.showToast("Vui lòng chọn sản phẩm cho tất cả các dòng!", "error");
       return;
    }

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
        this.showToast('Gửi đơn đặt hàng thành công!');
        this.loadImports();
        this.loadProducts();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showToast('Lỗi khi đặt hàng!', 'error');
        console.error(err);
      }
    });
  }

  isCancelable(importDate: string): boolean {
    if (!importDate) return false;
    const orderTime = new Date(importDate).getTime();
    const currentTime = new Date().getTime();
    const oneHour = 60 * 60 * 1000;
    return (currentTime - orderTime) < oneHour;
  }

  cancelOrder(importObj: any) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    
    this.http.post(`${this.API_IMPORT_URL}/${importObj.id}/cancel`, {}).subscribe({
      next: () => {
        this.showToast('Hủy đơn hàng thành công!');
        this.loadImports();
      },
      error: (err) => {
        this.showToast('Lỗi khi hủy đơn hàng: ' + (err.error?.message || err.message), 'error');
        console.error(err);
      }
    });
  }

  openReceiveModal(importObj: any) {
    this.receivingImport = importObj;
    this.http.get<any[]>(`${this.API_IMPORT_ITEM_URL}/import/${importObj.id}`).subscribe({
      next: (data) => {
        this.receivingItems = data.map(item => ({
          ...item,
          receivedQuantity: 0,
          isFullyReceived: false
        }));
        this.showReceiveModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching import items for receipt', err)
    });
  }

  closeReceiveModal() {
    this.showReceiveModal = false;
    this.receivingImport = null;
    this.receivingItems = [];
  }

  toggleFullyReceived(item: any) {
    item.isFullyReceived = !item.isFullyReceived;
    if (item.isFullyReceived) {
      item.receivedQuantity = item.quantity;
    } else {
      item.receivedQuantity = 0;
    }
  }

  onReceivedQuantityChange(item: any) {
    if (item.receivedQuantity === item.quantity) {
      item.isFullyReceived = true;
    } else {
      item.isFullyReceived = false;
    }
  }

  receiveAllFully() {
    this.receivingItems.forEach(item => {
      item.receivedQuantity = item.quantity;
      item.isFullyReceived = true;
    });
  }

  getActualReceiveCost(): number {
    return this.receivingItems.reduce((total, item) => {
      return total + (item.receivedQuantity * (item.unitPrice || 0));
    }, 0);
  }

  submitReceive() {
    const hasInvalid = this.receivingItems.some(item => item.receivedQuantity === null || item.receivedQuantity < 0);
    if (hasInvalid) {
      this.showToast('Vui lòng nhập số lượng nhận hợp lệ (lớn hơn hoặc bằng 0)', 'error');
      return;
    }

    const payload = {
      items: this.receivingItems.map(item => ({
        importItemId: item.id,
        receivedQuantity: item.receivedQuantity
      }))
    };

    this.isSubmitting = true;
    this.http.post(`${this.API_IMPORT_URL}/${this.receivingImport.id}/receive`, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeReceiveModal();
        this.showToast('Nhận hàng và thanh toán thành công!');
        this.loadImports();
        this.loadProducts();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showToast('Lỗi khi nhận hàng: ' + (err.error?.message || err.message), 'error');
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

  downloadTemplate() {
    this.http.get(`${this.API_IMPORT_URL}/template`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_nhap_hang.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.showToast('Lỗi tải tệp tin mẫu!', 'error');
        console.error(err);
      }
    });
  }

  onExcelUploaded(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.isSubmitting = true;
    this.excelWarnings = [];
    this.http.post<any>(`${this.API_IMPORT_URL}/parse-excel`, formData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        event.target.value = '';
        if (res.items && res.items.length > 0) {
          const mappedItems = res.items.map((i: any) => {
            const product = this.products.find(p => p.id === i.productId);
            return {
              productId: i.productId,
              searchTerm: i.productName,
              showResults: false,
              showAll: false,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              newPrice: i.newPrice,
              expiryDate: i.expiryDate,
              _productDetails: product
            };
          });
          
          this.newImport.items = mappedItems;
          this.activeRowIndex = 0;
        } else {
          this.showToast('Không tìm thấy dòng sản phẩm hợp lệ nào trong tệp Excel!', 'error');
        }
        
        if (res.warnings && res.warnings.length > 0) {
          this.excelWarnings = res.warnings;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        event.target.value = '';
        this.showToast('Lỗi xử lý tệp Excel: ' + (err.error?.message || err.error || err.message), 'error');
        console.error(err);
      }
    });
  }
}

