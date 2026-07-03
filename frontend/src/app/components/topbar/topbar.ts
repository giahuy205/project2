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
  showProfileMenu = false;

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

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
        // Keep track of existing read notifications to preserve their read status
        const previousReadTypes = new Set(
          this.notifications.filter(n => n.read).map(n => n.type)
        );
        this.notifications = [];
        
        let outOfStockCount = 0;
        let lowStockCount = 0;
        
        products.forEach(p => {
          if (p.stockQuantity <= 0) {
            outOfStockCount++;
          } else if (p.stockQuantity <= (p.lowStock || 10)) {
            lowStockCount++;
          }
        });
        
        if (outOfStockCount > 0) {
          const type = 'out_of_stock';
          this.notifications.push({
            type: type,
            message: `Có ${outOfStockCount} sản phẩm đã hết hàng!`,
            time: new Date(),
            read: previousReadTypes.has(type)
          });
        }
        
        if (lowStockCount > 0) {
          const type = 'low_stock';
          this.notifications.push({
            type: type,
            message: `Có ${lowStockCount} sản phẩm sắp hết hàng.`,
            time: new Date(),
            read: previousReadTypes.has(type)
          });
        }
        
        // Fetch expiry alerts
        if (this.authService.isAdmin()) {
          this.http.get<any[]>('/api/importitems').subscribe({
            next: (items) => {
              const now = new Date().getTime();
              let expiredCount = 0;
              let nearExpiryCount = 0;
              
              items.forEach(item => {
                if (item.remainingQuantity > 0 && item.expiryDate) {
                  const expiry = new Date(item.expiryDate).getTime();
                  const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
                  if (daysLeft < 0) {
                    expiredCount++;
                  } else if (daysLeft <= 30) {
                    nearExpiryCount++;
                  }
                }
              });
              
              if (expiredCount > 0) {
                const type = 'expired';
                this.notifications.push({
                  type: type,
                  message: `Có ${expiredCount} lô hàng đã hết hạn sử dụng!`,
                  time: new Date(),
                  read: previousReadTypes.has(type)
                });
              }
              
              if (nearExpiryCount > 0) {
                const type = 'near_expiry';
                this.notifications.push({
                  type: type,
                  message: `Có ${nearExpiryCount} lô hàng sắp hết hạn sử dụng.`,
                  time: new Date(),
                  read: previousReadTypes.has(type)
                });
              }
              
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
    this.showProfileMenu = false;
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  goToProfile() {
    this.showProfileMenu = false;
    this.router.navigate(['/settings']);
  }

  logout() {
    this.showProfileMenu = false;
    this.authService.logout();
  }

  onNotificationClick(notif: any) {
    this.showNotifications = false;
    notif.read = true;
    this.cdr.detectChanges();

    if (notif.type === 'out_of_stock') {
      this.router.navigate(['/inventory'], { queryParams: { filter: 'out' } });
    } else if (notif.type === 'low_stock') {
      this.router.navigate(['/inventory'], { queryParams: { filter: 'low' } });
    } else if (notif.type === 'expired' || notif.type === 'near_expiry') {
      this.router.navigate(['/imports']);
    }
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    this.notifications.forEach(n => n.read = true);
    this.cdr.detectChanges();
  }

  dismissNotification(event: Event | null, notif: any) {
    if (event) event.stopPropagation();
    this.notifications = this.notifications.filter(n => n !== notif);
    this.cdr.detectChanges();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showNotifications = false;
    this.showProfileMenu = false;
  }
}
