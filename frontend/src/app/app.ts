import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { Topbar } from './components/topbar/topbar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar, RouterModule],
  template: `
    <div *ngIf="isLoginRoute; else mainLayout">
      <router-outlet></router-outlet>
    </div>

    <ng-template #mainLayout>
      <div class="app-container">
        <app-sidebar></app-sidebar>
        <div class="main-content">
          <app-topbar></app-topbar>
          <div class="page-content" style="padding-top: 20px;">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: []
})
export class App {
  isLoginRoute = false;
  router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginRoute = event.urlAfterRedirects.includes('/login');
    });
  }
}
