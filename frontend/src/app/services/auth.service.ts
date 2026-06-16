import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>('/api/auth/login', { username, password }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role);
          localStorage.setItem('fullName', res.fullName);
          localStorage.setItem('username', res.username);
          localStorage.setItem('avatar', res.avatar || '');
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('username');
    localStorage.removeItem('avatar');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  isAdmin(): boolean {
    return this.getRole().toLowerCase() === 'admin';
  }

  isSaler(): boolean {
    return this.getRole().toLowerCase() === 'saler';
  }

  getFullName(): string {
    return localStorage.getItem('fullName') || '';
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  getAvatar(): string | null {
    return localStorage.getItem('avatar');
  }
}
