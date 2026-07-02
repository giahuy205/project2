import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  rawTransactions: any[] = [];
  transactions: any[] = [];

  // Filter state
  filterType: string = 'ALL'; // ALL, SALE, REFUND
  filterDate: string = 'WEEK'; // Default to WEEK (Tuần này)
  startDate: string = '';
  endDate: string = '';
  
  setDateRange(range: string) {
    this.filterDate = range;
    const today = new Date();

    if (range === 'TODAY') {
      this.startDate = this.formatDate(today);
      this.endDate = this.formatDate(today);
    } else if (range === 'WEEK') {
      // Find Monday of this week
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMonday);
      this.startDate = this.formatDate(monday);
      this.endDate = this.formatDate(today);
    } else if (range === 'MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.startDate = this.formatDate(firstDay);
      this.endDate = this.formatDate(today);
    } else if (range === 'ALL') {
      this.startDate = '';
      this.endDate = '';
    }

    this.applyFilters();
  }

  onCustomDateChange() {
    if (this.startDate && this.endDate) {
      this.filterDate = 'CUSTOM';
      this.applyFilters();
    }
  }

  formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Pagination state
  currentPage: number = 1;
  pageSize: number = 50;
  pagedTransactions: any[] = [];
  totalPages: number = 1;
  pageNumbers: number[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setDateRange('WEEK');
    this.fetchTransactions();
  }

  fetchTransactions() {
    this.http.get<any[]>('/api/orders').subscribe({
      next: (data) => {
        this.rawTransactions = data.map(order => ({
          id: 'TXN-' + order.id.toString().padStart(5, '0'),
          rawDate: new Date(order.orderDate),
          date: new Date(order.orderDate),
          items: order.orderItems ? order.orderItems.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0, // Sum all item quantities
          total: order.totalAmount || 0,
          type: 'SALE', // Refund is not implemented gracefully yet natively
          customer: 'Khách lẻ',
          originalOrder: order,
        })).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime() || b.id.localeCompare(a.id));
        
        this.applyFilters();
      },
      error: (err) => console.error('Failed to load orders', err)
    });
  }

  applyFilters() {
    let filtered = [...this.rawTransactions];

    // Filter by type
    if (this.filterType !== 'ALL') {
      filtered = filtered.filter(t => t.type === this.filterType);
    }

    // Filter by date range
    if (this.filterDate !== 'ALL') {
      if (this.startDate && this.endDate) {
        const startParts = this.startDate.split('-');
        const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]), 0, 0, 0, 0);

        const endParts = this.endDate.split('-');
        const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]), 23, 59, 59, 999);

        filtered = filtered.filter(t => {
          const tDate = t.rawDate;
          return tDate >= start && tDate <= end;
        });
      }
    }

    this.transactions = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.transactions.length / this.pageSize) || 1;
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedTransactions = this.transactions.slice(start, start + this.pageSize);
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
    if (this.transactions.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItemIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.transactions.length ? this.transactions.length : end;
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

  selectedTxn: any = null;
  showDetailsModal: boolean = false;

  viewDetails(txn: any) {
    this.selectedTxn = txn;
    this.showDetailsModal = true;
  }

  closeDetails() {
    this.showDetailsModal = false;
    this.selectedTxn = null;
  }
}
