import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  currentTime = new Date();
  private timer: any;

  notifications: any[] = [];
  showNotifications = false;

  ngOnInit() {
    this.timer = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.detectChanges();
    }, 1000);

    this.loadStockAlerts();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  loadStockAlerts() {
    this.http.get<any[]>('/api/products').subscribe({
      next: (products) => {
        this.notifications = [];
        products.forEach(p => {
          if (p.stockQuantity <= 0) {
            this.notifications.push({ type: 'out_of_stock', message: `Sản phẩm "${p.name}" đã hết hàng!`, time: new Date() });
          } else if (p.stockQuantity <= (p.lowStock || 10)) {
            this.notifications.push({ type: 'low_stock', message: `Sản phẩm "${p.name}" sắp hết (Còn ${p.stockQuantity}).`, time: new Date() });
          }
        });
        
        // Fetch expiry alerts
        if (this.authService.isAdmin()) {
          this.http.get<any[]>('/api/importitems').subscribe({
            next: (items) => {
              const now = new Date().getTime();
              items.forEach(item => {
                if (item.remainingQuantity > 0 && item.expiryDate) {
                  const expiry = new Date(item.expiryDate).getTime();
                  const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
                  if (daysLeft < 0) {
                      this.notifications.push({ type: 'expired', message: `Lô #${item.id} (${item.product?.name}) ĐÃ HẾT HẠN!`, time: new Date() });
                  } else if (daysLeft <= 30) {
                      this.notifications.push({ type: 'near_expiry', message: `Lô #${item.id} (${item.product?.name}) sắp hết hạn (Còn ${Math.ceil(daysLeft)} ngày).`, time: new Date() });
                  }
                }
              });
              this.cdr.detectChanges();
            }
          });
        } else {
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error fetching stock alerts', err)
    });
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showNotifications = false;
  }
}
