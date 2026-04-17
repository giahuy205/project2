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
  filterDate: string = 'ALL'; // ALL, TODAY, WEEK, MONTH, CUSTOM
  
  // Custom date picker range (UI only)
  customStartDate: string = '';
  customEndDate: string = '';

  // Pagination state
  currentPage: number = 1;
  pageSize: number = 50;
  pagedTransactions: any[] = [];
  totalPages: number = 1;
  pageNumbers: number[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
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

    // Filter by date
    const now = new Date();
    if (this.filterDate === 'TODAY') {
      filtered = filtered.filter(t => t.rawDate.toDateString() === now.toDateString());
    } else if (this.filterDate === 'WEEK') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      filtered = filtered.filter(t => t.rawDate >= startOfWeek);
    } else if (this.filterDate === 'MONTH') {
      filtered = filtered.filter(t => t.rawDate.getMonth() === now.getMonth() && t.rawDate.getFullYear() === now.getFullYear());
    }
    // Note: CUSTOM filter logic is not required to work yet per user request.

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

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }
}
