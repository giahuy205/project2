import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
  id?: number;
  username: string;
  fullName: string;
  email?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  employeeCode?: string;
  dob?: string; // YYYY-MM-DD
  phone?: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private baseUrl = '/api/accounts';

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.baseUrl);
  }

  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  createAccount(account: Account): Observable<any> {
    return this.http.post<any>(this.baseUrl, account);
  }

  updateAccount(id: number, account: Account): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, account);
  }

  deleteAccount(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getProfile(): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/profile`);
  }

  updateProfile(profile: Account): Observable<Account> {
    return this.http.put<Account>(`${this.baseUrl}/profile`, profile);
  }
}
