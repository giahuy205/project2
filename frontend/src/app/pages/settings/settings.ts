import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountService, Account } from '../../services/account.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  activeTab = 'profile';
  authService = inject(AuthService);
  private accountService = inject(AccountService);
  private cdr = inject(ChangeDetectorRef);

  profileData: Account = {
    username: '',
    fullName: '',
    email: '',
    role: '',
    employeeCode: '',
    dob: '',
    password: ''
  };

  storeName = 'Awesome Coffee Shop';
  storeAddress = '123 Main St, NY';
  storePhone = '123-456-7890';

  successMessage = '';
  errorMessage = '';
  storeSuccessMessage = '';
  savingProfile = false;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.accountService.getProfile().subscribe({
      next: (data) => {
        this.profileData = { ...data, password: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.errorMessage = 'Could not load profile. Please try again later.';
        this.cdr.detectChanges();
      }
    });
  }

  saveProfile() {
    this.savingProfile = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.accountService.updateProfile(this.profileData).subscribe({
      next: (updated) => {
        this.savingProfile = false;
        this.profileData = { ...updated, password: '' };
        this.successMessage = 'Profile updated successfully!';
        
        // Update fullName in localStorage to sync Topbar immediately
        localStorage.setItem('fullName', updated.fullName);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingProfile = false;
        console.error('Error updating profile', err);
        this.errorMessage = err.error || 'Profile update failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  saveStoreSettings() {
    this.storeSuccessMessage = 'Store settings updated successfully!';
    setTimeout(() => {
      this.storeSuccessMessage = '';
    }, 3000);
  }
}
