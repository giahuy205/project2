import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  collapsed = false;
  authService = inject(AuthService);

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  logout() {
    this.authService.logout();
  }
}
