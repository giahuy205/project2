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

  // Modal State
  isModalOpen = false;
  isEditMode = false;
  successMessage = '';
  errorMessage = '';
  saving = false;
  toastMessage = '';

  // Form Model
  currentAccount: Account = {
    username: '',
    fullName: '',
    email: '',
    role: 'saler',
    employeeCode: '',
    dob: '',
    phone: '',
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
    if (!this.searchTerm.trim()) {
      this.filteredAccounts = this.accounts;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredAccounts = this.accounts.filter(acc => 
      acc.fullName.toLowerCase().includes(term) ||
      acc.username.toLowerCase().includes(term) ||
      (acc.email && acc.email.toLowerCase().includes(term)) ||
      (acc.employeeCode && acc.employeeCode.toLowerCase().includes(term))
    );
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
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode && this.currentAccount.id) {
      this.accountService.updateAccount(this.currentAccount.id, this.currentAccount).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toastMessage = 'Cập nhật nhân viên thành công!';
          setTimeout(() => {
             this.toastMessage = '';
             this.cdr.detectChanges();
          }, 5000);
          this.loadAccounts();
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          this.errorMessage = err.error || 'Update failed. Please try again.';
        }
      });
    } else {
      this.accountService.createAccount(this.currentAccount).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toastMessage = 'Thêm nhân viên mới thành công!';
          setTimeout(() => {
             this.toastMessage = '';
             this.cdr.detectChanges();
          }, 5000);
          this.loadAccounts();
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          this.errorMessage = err.error || 'Failed to add staff. Please try again.';
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
        alert('Failed to change status: ' + (err.error || ''));
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
          alert('Failed to delete staff: ' + (err.error || ''));
        }
      });
    }
  }
}
