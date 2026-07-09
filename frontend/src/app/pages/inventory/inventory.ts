
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit {
  authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  categories: any[] = [];
  products: any[] = [];
  filteredProducts: any[] = [];
  selectedCategoryId: number | null = null;
  searchQuery = '';
  
  // Pagination state
  currentPage: number = 1;
  pageSize: number = 50;
  pagedProducts: any[] = [];
  totalPages: number = 1;
  pageNumbers: number[] = [];
  
  showModal = false;
  viewMode: 'categories' | 'products' = 'products'; // Default view
  
  isEditingCategory = false;
  newCategory: any = {
    id: null,
    name: '',
    taxRate: 8,
    note: ''
  };

  showProductModal = false;
  isEditingProduct = false;
  showBatchModal = false;
  isEditingBatchProduct = false;
  selectedProductForBatches: any = null;
  productBatches: any[] = [];
  errorMessage = '';
  showExcelModal = false;
  selectedExcelFile: File | null = null;
  isUploadingExcel = false;
  excelDragOver = false;
  excelImportResult: any = null;
  excelImportErrors: string[] = [];
  excelGeneralError = '';

  showCategoryBatchModal = false;
  batchCategories: any[] = [];
  batchCategoryErrors: string[] = [];
  isSavingBatchCategories = false;

  newProduct: any = {
    id: null,
    name: '',
    barcode: '',
    category: { id: null },
    importPrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    lowStock: 10
  };

  API_CAT_URL = '/api/categorys';
  API_PROD_URL = '/api/products';
  API_IMPORT_ITEM_URL = '/api/importitems';

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
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.stockFilter = params['filter'];
        this.filterProducts();
        this.cdr.detectChanges();
      }
    });
    this.loadData();
  }

  loadData() {
    this.http.get<any[]>(this.API_CAT_URL).subscribe({
      next: (data) => {
        this.categories = data.sort((a, b) => a.id - b.id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Backend offline or Error fetching categories', err)
    });
    
    this.http.get<any[]>(this.API_PROD_URL).subscribe({
      next: (data) => {
        this.products = data.sort((a, b) => {
          const aOut = (a.stockQuantity || 0) <= 0;
          const bOut = (b.stockQuantity || 0) <= 0;
          if (aOut && !bOut) return 1;
          if (!aOut && bOut) return -1;
          return (a.name || '').localeCompare(b.name || '');
        });
        this.filterProducts();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Backend offline or Error fetching products', err)
    });
  }

  stockFilter: string = 'all'; // 'all', 'low', 'out'

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterProducts();
  }

  categorySortColumn: string = '';
  categorySortDirection: 'asc' | 'desc' = 'asc';

  sortCategoryBy(column: string) {
    if (this.categorySortColumn === column) {
      this.categorySortDirection = this.categorySortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.categorySortColumn = column;
      this.categorySortDirection = 'asc';
    }
    this.categories.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.categorySortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.categorySortDirection === 'asc' ? 1 : -1;
        return 0;
    });
  }

  onStockFilterChange(event: any) {
    this.stockFilter = event.target.value;
    this.filterProducts();
  }

  filterProducts() {
    let list = this.selectedCategoryId === null 
      ? [...this.products] 
      : this.products.filter(p => p.category && p.category.id === this.selectedCategoryId);

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q));
    }

    if (this.stockFilter === 'out') {
      list = list.filter(p => p.stockQuantity <= 0);
    } else if (this.stockFilter === 'low') {
      list = list.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 30);
    }
    
    if (this.sortColumn) {
      list.sort((a, b) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];

        if (this.sortColumn === 'category.name') {
            valA = a.category?.name || '';
            valB = b.category?.name || '';
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    this.filteredProducts = list;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedProducts = this.filteredProducts.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
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
    if (this.filteredProducts.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItemIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredProducts.length ? this.filteredProducts.length : end;
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

  searchProducts(event: any) {
    this.searchQuery = event.target.value;
    this.filterProducts();
  }

  onFilterChange(event: any) {
    const val = event.target.value;
    this.selectedCategoryId = val === 'all' ? null : parseInt(val, 10);
    this.filterProducts();
  }

  openProductModal() {
    if (this.categories.length === 0) {
      alert("Please add at least 1 Category first!");
      return;
    }
    this.isEditingProduct = false;
    this.errorMessage = '';
    this.newProduct = {
      id: null, name: '', barcode: '', category: { id: null }, 
      importPrice: 0, salePrice: 0, stockQuantity: 0, lowStock: 10
    };
    this.showProductModal = true;
  }

  editProduct(p: any) {
    this.isEditingProduct = true;
    this.newProduct = { ...p, category: { id: p.category ? p.category.id : null } };
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.isEditingProduct = false;
    this.errorMessage = '';
    this.newProduct = {
      id: null, name: '', barcode: '', category: { id: null }, 
      importPrice: 0, salePrice: 0, stockQuantity: 0, lowStock: 10
    };
  }

  saveProduct() {
    this.errorMessage = '';
    if (!this.newProduct.name || !this.newProduct.barcode || !this.newProduct.category.id) return;
    
    const request = this.isEditingProduct 
      ? this.http.put(`${this.API_PROD_URL}/${this.newProduct.id}`, this.newProduct)
      : this.http.post(this.API_PROD_URL, this.newProduct);

    request.subscribe({
      next: (res) => {
        this.loadData();
        this.closeProductModal();
        this.showToast('Lưu sản phẩm thành công!');
      },
      error: (err) => {
        if (err.status === 409 || (err.error && typeof err.error === 'string' && err.error.includes('constraint'))) {
           this.errorMessage = 'Mã barcode trùng với sản phẩm khác!';
        } else {
           this.errorMessage = 'Mã barcode trùng với sản phẩm khác hoặc lỗi hệ thống!';
        }
        this.cdr.detectChanges();
      }
    });
  }

  openModal() {
    this.showModal = true;
    this.newCategory = { id: null, name: '', taxRate: 8, note: '' };
  }

  editCategory(cat: any) {
    this.isEditingCategory = true;
    this.newCategory = { ...cat, taxRate: Math.round((cat.taxRate || 0) * 100) };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditingCategory = false;
    this.newCategory = { id: null, name: '', taxRate: 8, note: '' };
  }

  saveCategory() {
    if (!this.newCategory.name) return;
    
    const categoryToSave = {
      ...this.newCategory,
      taxRate: (this.newCategory.taxRate || 0) / 100.0
    };

    const request = this.isEditingCategory
      ? this.http.put(`${this.API_CAT_URL}/${categoryToSave.id}`, categoryToSave)
      : this.http.post(this.API_CAT_URL, categoryToSave);

    request.subscribe({
      next: (res) => {
        this.loadData();
        this.closeModal();
        this.showToast('Lưu danh mục thành công!');
      },
      error: (err) => alert('Save failed! Is the backend running?')
    });
  }

  viewBatches(product: any) {
    this.selectedProductForBatches = product;
    this.newProduct = { ...product, category: { id: product.category ? product.category.id : null } };
    this.errorMessage = '';
    this.isEditingBatchProduct = false;
    this.http.get<any[]>(`${this.API_IMPORT_ITEM_URL}/product/${product.id}`).subscribe({
      next: (data) => {
        this.productBatches = data;
        this.showBatchModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching batches', err)
    });
  }

  saveProductFromBatchModal() {
    this.errorMessage = '';
    if (!this.newProduct.name || !this.newProduct.barcode || !this.newProduct.category.id) return;
    
    this.http.put(`${this.API_PROD_URL}/${this.newProduct.id}`, this.newProduct).subscribe({
      next: (res: any) => {
        this.isEditingBatchProduct = false;
        this.selectedProductForBatches = res;
        this.newProduct = { ...res, category: { id: res.category ? res.category.id : null } };
        this.loadData();
        this.showToast('Cập nhật thông tin thành công!');
      },
      error: (err) => {
        if (err.status === 409 || (err.error && typeof err.error === 'string' && err.error.includes('constraint'))) {
           this.errorMessage = 'Mã barcode trùng với sản phẩm khác!';
        } else {
           this.errorMessage = 'Lỗi hệ thống!';
        }
        this.cdr.detectChanges();
      }
    });
  }

  cancelEditingBatchProduct() {
    this.isEditingBatchProduct = false;
    if (this.selectedProductForBatches) {
      this.newProduct = {
        ...this.selectedProductForBatches,
        category: { id: this.selectedProductForBatches.category ? this.selectedProductForBatches.category.id : null }
      };
    }
    this.errorMessage = '';
  }

  closeBatchModal() {
    this.showBatchModal = false;
    this.selectedProductForBatches = null;
    this.productBatches = [];
    this.newProduct = {
      id: null, name: '', barcode: '', category: { id: null }, 
      importPrice: 0, salePrice: 0, stockQuantity: 0, lowStock: 10
    };
  }

  discardBatch(batchId: number) {
    if (confirm("Bạn có chắc muốn hủy lô hàng này không?")) {
      this.http.post(`${this.API_IMPORT_ITEM_URL}/${batchId}/discard`, {}, { responseType: 'text' }).subscribe({
        next: () => {
          this.viewBatches(this.selectedProductForBatches); // reload batches
          this.loadData(); // reload products to update total stock
          this.showToast('Hủy lô hàng thành công!');
        },
        error: (err) => alert("Lỗi khi hủy lô hàng!")
      });
    }
  }

  isNearExpiry(dateStr: string): boolean {
    if (!dateStr) return false;
    const expiry = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 30; // 30 days threshold
  }

  openExcelModal() {
    this.showExcelModal = true;
    this.selectedExcelFile = null;
    this.isUploadingExcel = false;
    this.excelDragOver = false;
    this.excelImportResult = null;
    this.excelImportErrors = [];
    this.excelGeneralError = '';
  }

  closeExcelModal() {
    this.showExcelModal = false;
    this.selectedExcelFile = null;
    this.isUploadingExcel = false;
    this.excelDragOver = false;
    this.excelImportResult = null;
    this.excelImportErrors = [];
    this.excelGeneralError = '';
  }

  onExcelDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.excelDragOver = true;
  }

  onExcelDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.excelDragOver = false;
  }

  onExcelFileDropped(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.excelDragOver = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        this.selectedExcelFile = file;
        this.excelImportResult = null;
        this.excelImportErrors = [];
        this.excelGeneralError = '';
      } else {
        this.excelGeneralError = 'Vui lòng chọn tệp tin định dạng Excel (.xlsx hoặc .xls).';
      }
    }
  }

  onExcelFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        this.selectedExcelFile = file;
        this.excelImportResult = null;
        this.excelImportErrors = [];
        this.excelGeneralError = '';
      } else {
        this.excelGeneralError = 'Vui lòng chọn tệp tin định dạng Excel (.xlsx hoặc .xls).';
      }
    }
  }

  removeSelectedExcelFile() {
    this.selectedExcelFile = null;
    this.excelImportResult = null;
    this.excelImportErrors = [];
    this.excelGeneralError = '';
  }

  downloadExcelTemplate() {
    this.http.get('/api/products/import-excel/template', { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_import_san_pham.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.excelGeneralError = 'Không thể tải xuống tệp mẫu. Vui lòng kiểm tra kết nối.';
      }
    });
  }

  confirmExcelImport() {
    if (!this.selectedExcelFile) return;

    this.isUploadingExcel = true;
    this.excelImportResult = null;
    this.excelImportErrors = [];
    this.excelGeneralError = '';

    const formData = new FormData();
    formData.append('file', this.selectedExcelFile);

    this.http.post<any>('/api/products/import-excel', formData).subscribe({
      next: (res) => {
        this.isUploadingExcel = false;
        this.excelImportResult = res;
        this.excelImportErrors = res.errors || [];
        this.loadData(); // reload products to show successful imports

        if (res.failedCount === 0) {
          this.showToast(`Đã nhập thành công ${res.successCount} sản phẩm!`);
        } else {
          this.showToast(`Nhập thành công ${res.successCount} sản phẩm, bỏ qua ${res.failedCount} sản phẩm lỗi.`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingExcel = false;
        let errMsg = 'Đã xảy ra lỗi khi kết nối với máy chủ.';
        if (err.error && err.error.errors) {
          this.excelImportErrors = err.error.errors;
          errMsg = 'Phát hiện lỗi trong tệp Excel.';
        } else if (err.error && typeof err.error === 'string') {
          errMsg = err.error;
        } else if (err.error && err.error.message) {
          errMsg = err.error.message;
        }
        this.excelGeneralError = errMsg;
        this.cdr.detectChanges();
      }
    });
  }

  openCategoryBatchModal() {
    this.showCategoryBatchModal = true;
    this.batchCategoryErrors = [];
    this.isSavingBatchCategories = false;
    this.batchCategories = [
      { name: '', taxRate: 8, note: '' }
    ];
  }

  closeCategoryBatchModal() {
    this.showCategoryBatchModal = false;
    this.batchCategories = [];
    this.batchCategoryErrors = [];
  }

  addBatchCategoryRow() {
    this.batchCategories.push({ name: '', taxRate: 8, note: '' });
  }

  removeBatchCategoryRow(index: number) {
    this.batchCategories.splice(index, 1);
  }

  saveCategoryBatch() {
    this.batchCategoryErrors = [];

    const validRows = this.batchCategories.filter(cat => cat.name && cat.name.trim() !== '');
    if (validRows.length === 0) {
      this.batchCategoryErrors = ['Vui lòng điền tên danh mục cho ít nhất 1 dòng.'];
      return;
    }

    // Check frontend duplicates
    const namesSet = new Set<string>();
    for (let i = 0; i < validRows.length; i++) {
      const name = validRows[i].name.trim().toLowerCase();
      if (namesSet.has(name)) {
        this.batchCategoryErrors = [`Tên danh mục '${validRows[i].name}' bị lặp lại trong danh sách.`];
        return;
      }
      namesSet.add(name);
    }

    // Convert tax rates to decimal
    const payload = validRows.map(cat => ({
      name: cat.name.trim(),
      taxRate: (cat.taxRate || 0) / 100.0,
      note: cat.note ? cat.note.trim() : ''
    }));

    this.isSavingBatchCategories = true;
    this.http.post<any>(`${this.API_CAT_URL}/batch`, payload).subscribe({
      next: (res) => {
        this.isSavingBatchCategories = false;
        this.loadData();
        this.closeCategoryBatchModal();
        this.showToast('Lưu danh sách danh mục thành công!');
      },
      error: (err) => {
        this.isSavingBatchCategories = false;
        if (err.error && err.error.errors) {
          this.batchCategoryErrors = err.error.errors;
        } else if (err.error && typeof err.error === 'string') {
          this.batchCategoryErrors = [err.error];
        } else if (err.error && err.error.message) {
          this.batchCategoryErrors = [err.error.message];
        } else {
          this.batchCategoryErrors = ['Đã xảy ra lỗi khi lưu danh mục.'];
        }
        this.cdr.detectChanges();
      }
    });
  }
}
