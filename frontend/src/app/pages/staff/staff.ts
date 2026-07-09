import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService, Account } from '../../services/account.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './staff.html',
  styleUrl: './staff.css',
})
export class Staff implements OnInit {
  private accountService = inject(AccountService);
  private cdr = inject(ChangeDetectorRef);

  accounts: Account[] = [];
  filteredAccounts: Account[] = [];
  searchTerm = '';
  statusFilter = 'all';
  roleFilter = 'all';

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  pagedAccounts: Account[] = [];
  totalPages = 1;
  pageNumbers: number[] = [];

  // Sorting state
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal State
  isModalOpen = false;
  isEditMode = false;
  successMessage = '';
  errorMessage = '';
  saving = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  // Form Model
  currentAccount: Account = {
    username: '',
    fullName: '',
    email: '',
    role: 'saler',
    employeeCode: '',
    dob: '',
    phone: '',
    address: '',
    gender: '',
    isActive: true,
    password: ''
  };

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountService.getAccounts().subscribe({
      next: (data) => {
        this.accounts = data;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading staff list', err);
        this.errorMessage = 'Could not load staff list. Please check permissions.';
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    let result = this.accounts;
    
    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(acc => 
        acc.fullName.toLowerCase().includes(term) ||
        acc.username.toLowerCase().includes(term) ||
        (acc.email && acc.email.toLowerCase().includes(term)) ||
        (acc.employeeCode && acc.employeeCode.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.statusFilter === 'active') {
      result = result.filter(acc => acc.isActive === true);
    } else if (this.statusFilter === 'inactive') {
      result = result.filter(acc => acc.isActive === false);
    }

    // Role filter
    if (this.roleFilter === 'admin') {
      result = result.filter(acc => acc.role === 'admin');
    } else if (this.roleFilter === 'saler') {
      result = result.filter(acc => acc.role === 'saler');
    }

    // Sort
    if (this.sortColumn) {
      this.filteredAccounts = [...result].sort((a: any, b: any) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];

        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';

        if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          if (valA === valB) return 0;
          return this.sortDirection === 'asc' 
            ? (valA ? 1 : -1) 
            : (valA ? -1 : 1);
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return this.sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Sort: active accounts at the top, inactive accounts at the bottom
      this.filteredAccounts = [...result].sort((a, b) => {
        if (a.isActive === b.isActive) return 0;
        return a.isActive ? -1 : 1;
      });
    }

    this.currentPage = 1;
    this.updatePagination();
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilter();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredAccounts.length / this.pageSize) || 1;
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedAccounts = this.filteredAccounts.slice(start, start + this.pageSize);
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
    if (this.filteredAccounts.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItemIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredAccounts.length ? this.filteredAccounts.length : end;
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

  generateNextEmployeeCode(): string {
    let maxId = 0;
    this.accounts.forEach(acc => {
      const code = acc.employeeCode || acc.username;
      if (code && code.startsWith('SS_')) {
        const numStr = code.substring(3);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    });
    maxId++;
    return 'SS_' + maxId.toString().padStart(5, '0');
  }

  openAddModal() {
    this.isEditMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    
    const nextCode = this.generateNextEmployeeCode();
    
    this.currentAccount = {
      username: nextCode,
      fullName: '',
      email: '',
      role: 'saler',
      employeeCode: nextCode,
      dob: '',
      phone: '',
      address: '',
      gender: '',
      isActive: true,
      password: ''
    };
    this.isModalOpen = true;
  }

  openEditModal(account: Account) {
    this.isEditMode = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.currentAccount = { ...account, password: '' };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveAccount() {
    if (!this.currentAccount.phone || !this.currentAccount.phone.trim()) {
      this.showToast('Số điện thoại là bắt buộc', 'error');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode && this.currentAccount.id) {
      this.accountService.updateAccount(this.currentAccount.id, this.currentAccount).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('Cập nhật nhân viên thành công!');
          this.loadAccounts();
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          this.showToast(err.error || 'Cập nhật nhân viên thất bại. Vui lòng thử lại.', 'error');
        }
      });
    } else {
      this.accountService.createAccount(this.currentAccount).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showToast('Thêm nhân viên mới thành công!');
          this.loadAccounts();
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          this.showToast(err.error || 'Thêm nhân viên thất bại. Vui lòng thử lại.', 'error');
        }
      });
    }
  }

  toggleActive(account: Account) {
    if (!account.id) return;
    const updated = { ...account, isActive: !account.isActive };
    this.accountService.updateAccount(account.id, updated).subscribe({
      next: () => {
        this.loadAccounts();
      },
      error: (err) => {
        console.error(err);
        this.showToast('Lỗi thay đổi trạng thái: ' + (err.error || ''), 'error');
      }
    });
  }

  deleteAccount(account: Account) {
    if (!account.id) return;
    if (confirm(`Are you sure you want to delete staff ${account.fullName}?`)) {
      this.accountService.deleteAccount(account.id).subscribe({
        next: () => {
          this.loadAccounts();
        },
        error: (err) => {
          console.error(err);
          this.showToast('Lỗi xóa nhân viên: ' + (err.error || ''), 'error');
        }
      });
    }
  }
}
