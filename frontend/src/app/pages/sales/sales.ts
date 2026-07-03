import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
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
  showDeactivateConfirmModal: boolean = false;
  deactivateResolver: ((value: boolean) => void) | null = null;
  filteredProducts: any[] = [];
  categories: any[] = [];
  
  cart: any[] = [];
  subtotal = 0;
  taxTotal = 0;
  total = 0;
  searchQuery = '';
  selectedCategoryId: number | null = null;

  // Pagination state
  currentPage: number = 1;
  pageSize: number = 30; // usually POS grids have fewer per page to fit on screen
  pagedProducts: any[] = [];
  totalPages: number = 1;
  pageNumbers: number[] = [];

  showCheckoutModal: boolean = false;
  amountToPay: string = '';
  remainingBalance: number = 0;
  paidAmount: number = 0;
  changeAmount: number = 0;
  selectedPaymentMethod: string = 'Cash';
  paymentSuccessMessage: string = '';

  get amountToPayNumber(): number {
    return Number(this.amountToPay) || 0;
  }

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
    this.http.get<any[]>('/api/categorys').subscribe(res => {
      this.categories = res;
      this.cdr.detectChanges();
    });
    this.http.get<any[]>('/api/products').subscribe(res => {
      this.products = res;
      this.filteredProducts = res;
      this.applyFilters();
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

  openCheckout() {
    if (this.cart.length === 0) return;
    this.showCheckoutModal = true;
    this.remainingBalance = this.total;
    this.paidAmount = 0;
    this.amountToPay = '';
    this.changeAmount = 0;
    this.selectedPaymentMethod = 'Cash';
  }

  closeCheckout() {
    if (this.paymentSuccessMessage) {
      this.resetAfterPayment();
    } else {
      this.showCheckoutModal = false;
    }
  }

  onNumpadClick(key: string) {
    if (key === 'C') {
      this.amountToPay = '';
    } else if (key === 'Del') {
      this.amountToPay = this.amountToPay.slice(0, -1);
    } else {
      this.amountToPay += key;
    }
  }

  setExactAmount() {
    this.amountToPay = this.remainingBalance.toString();
  }

  selectMethod(method: string) {
    this.selectedPaymentMethod = method;
    if (method === 'Card' || method === 'QR') {
      this.setExactAmount();
    }
  }

  confirmPayment() {
    if (this.paymentSuccessMessage) return;

    if (this.remainingBalance <= 0) {
      this.completeOrder('NONE');
      this.showSuccessAndClose('NONE');
      return;
    }

    if (this.selectedPaymentMethod === 'Cash') {
      const amount = this.amountToPayNumber;
      if (amount >= this.remainingBalance) {
        this.paidAmount += this.remainingBalance;
        this.changeAmount = amount - this.remainingBalance;
        this.remainingBalance = 0;
        this.completeOrder('Cash');
        this.showSuccessAndClose('Cash');
      } else if (amount > 0) {
        this.paidAmount += amount;
        this.remainingBalance -= amount;
        this.amountToPay = '';
        if (this.remainingBalance <= 0) {
          this.completeOrder('Cash');
          this.showSuccessAndClose('Cash');
        }
      }
    } else {
      this.paidAmount += this.remainingBalance;
      this.remainingBalance = 0;
      this.completeOrder(this.selectedPaymentMethod);
      this.showSuccessAndClose(this.selectedPaymentMethod);
    }
  }

  completeOrder(method: string) {
    if (this.total <= 0) return; // Prevent saving 0 total orders if empty cart etc. (Optional, assuming valid logical orders)

    const orderData = {
      totalAmount: this.total,
      paidAmount: this.paidAmount,
      paymentMethod: method,
      items: this.cart.map(item => ({
        product: { id: item.product.id },
        quantity: item.quantity,
        price: item.product.salePrice
      }))
    };
    
    // Deduct stock locally first for instant UI response
    for (const item of this.cart) {
      const prod = this.products.find(p => p.id === item.product.id);
      if (prod) {
        prod.stockQuantity = (prod.stockQuantity || 0) - item.quantity;
      }
    }
    this.applyFilters();

    // Attempt to post order asynchronously
    this.http.post('/api/orders', orderData).subscribe({
      next: (res) => {
        // Refresh from backend to ensure synchronization
        this.http.get<any[]>('/api/products').subscribe(productsRes => {
          this.products = productsRes;
          this.applyFilters();
        });
      },
      error: (err) => {
        console.warn('API /api/orders not ready or failed asynchronously', err);
      }
    });
  }

  showSuccessAndClose(method: string, isMock: boolean = false) {
    const mockPrefix = isMock ? "(Mock) " : "";
    let msg = "";
    
    if (method === 'NONE' || this.total <= 0) {
      msg = `${mockPrefix}Đơn hàng đã được thanh toán!`;
    } else {
      let methodText = method === 'Cash' ? 'Tiền mặt' : (method === 'Card' ? 'Thẻ' : 'QR');
      msg = `${mockPrefix}Thanh toán thành công bằng ${methodText}!`;
    }

    this.showToast(msg);
    this.resetAfterPayment();
  }

  resetAfterPayment() {
    this.cart = [];
    this.calculateTotals();
    this.showCheckoutModal = false;
    this.paymentSuccessMessage = '';
    this.amountToPay = '';
    this.remainingBalance = 0;
    this.paidAmount = 0;
    this.changeAmount = 0;
    this.selectedPaymentMethod = 'Cash';
  }

  confirmDeactivate(): Promise<boolean> {
    if (this.cart.length === 0) {
      return Promise.resolve(true);
    }
    this.showDeactivateConfirmModal = true;
    return new Promise<boolean>((resolve) => {
      this.deactivateResolver = resolve;
    });
  }

  onDeactivateConfirm(value: boolean) {
    this.showDeactivateConfirmModal = false;
    if (this.deactivateResolver) {
      this.deactivateResolver(value);
      this.deactivateResolver = null;
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.cart.length > 0) {
      $event.returnValue = true;
    }
  }

  getCategoryColor(categoryName: string): string {
    if (!categoryName) return 'rgba(107, 114, 128, 0.15)'; // Gray
    const name = categoryName.toLowerCase();
    if (name.includes('soft drink') || name.includes('nước ngọt')) {
      return 'rgba(59, 130, 246, 0.15)'; // Blue
    }
    if (name.includes('mineral water') || name.includes('nước khoáng') || name.includes('nước suối')) {
      return 'rgba(6, 182, 212, 0.15)'; // Cyan
    }
    if (name.includes('coffee') || name.includes('cà phê') || name.includes('tea') || name.includes('trà')) {
      return 'rgba(245, 158, 11, 0.15)'; // Amber
    }
    if (name.includes('dairy') || name.includes('sữa')) {
      return 'rgba(16, 185, 129, 0.15)'; // Green
    }
    if (name.includes('alcohol') || name.includes('bia') || name.includes('rượu')) {
      return 'rgba(139, 92, 246, 0.15)'; // Purple
    }
    if (name.includes('snack') || name.includes('bánh kẹo')) {
      return 'rgba(236, 72, 153, 0.15)'; // Pink
    }
    if (name.includes('noodle') || name.includes('mì')) {
      return 'rgba(244, 63, 94, 0.15)'; // Rose
    }
    if (name.includes('canned') || name.includes('đồ hộp')) {
      return 'rgba(20, 184, 166, 0.15)'; // Teal
    }
    if (name.includes('cigarette') || name.includes('thuốc lá')) {
      return 'rgba(75, 85, 99, 0.15)'; // Cool Gray
    }
    // Hash function based on characters to pick a color for other categories
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'rgba(59, 130, 246, 0.15)', // Blue
      'rgba(16, 185, 129, 0.15)', // Green
      'rgba(245, 158, 11, 0.15)', // Amber
      'rgba(139, 92, 246, 0.15)', // Purple
      'rgba(236, 72, 153, 0.15)', // Pink
      'rgba(6, 182, 212, 0.15)',  // Cyan
      'rgba(20, 184, 166, 0.15)', // Teal
    ];
    return colors[Math.abs(hash) % colors.length];
  }
}

