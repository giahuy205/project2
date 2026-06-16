
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
    taxRate: 0,
    note: ''
  };

  showProductModal = false;
  isEditingProduct = false;
  showBatchModal = false;
  isEditingBatchProduct = false;
  selectedProductForBatches: any = null;
  productBatches: any[] = [];
  errorMessage = '';
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
        this.products = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
  }

  editCategory(cat: any) {
    this.isEditingCategory = true;
    this.newCategory = { ...cat };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditingCategory = false;
    this.newCategory = { id: null, name: '', taxRate: 0, note: '' };
  }

  saveCategory() {
    if (!this.newCategory.name) return;
    
    const request = this.isEditingCategory
      ? this.http.put(`${this.API_CAT_URL}/${this.newCategory.id}`, this.newCategory)
      : this.http.post(this.API_CAT_URL, this.newCategory);

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
      next: (res) => {
        this.isEditingBatchProduct = false;
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

  closeBatchModal() {
    this.showBatchModal = false;
    this.selectedProductForBatches = null;
    this.productBatches = [];
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
}
