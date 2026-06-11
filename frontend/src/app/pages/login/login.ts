import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Vui lòng nhập tên tài khoản và mật khẩu';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.redirectUser(res.role);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Sai tên đăng nhập hoặc mật khẩu';
        } else if (err.status === 403) {
          this.errorMessage = 'Tài khoản này đã bị khóa';
        } else {
          this.errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
        }
      }
    });
  }

  loginAsAdminDemo() {
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login('admin', 'admin123').subscribe({
      next: (res) => {
        this.isLoading = false;
        this.redirectUser(res.role);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Lỗi đăng nhập tài khoản Demo Admin';
      }
    });
  }

  loginAsSalerDemo() {
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login('saler', 'saler123').subscribe({
      next: (res) => {
        this.isLoading = false;
        this.redirectUser(res.role);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Lỗi đăng nhập tài khoản Demo Saler';
      }
    });
  }

  private redirectUser(role: string) {
    if (role.toLowerCase() === 'admin') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/sales']);
    }
  }
}
