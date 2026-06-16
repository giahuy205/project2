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
    phone: '',
    address: '',
    gender: '',
    avatar: '',
    password: ''
  };

  originalProfileData: Account | null = null;

  storeName = 'Awesome Coffee Shop';
  storeAddress = '123 Main St, NY';
  storePhone = '123-456-7890';
  originalStoreName = 'Awesome Coffee Shop';
  originalStoreAddress = '123 Main St, NY';
  originalStorePhone = '123-456-7890';

  successMessage = '';
  errorMessage = '';
  storeSuccessMessage = '';
  savingProfile = false;

  // Password fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  changingPassword = false;

  // Theme configuration
  currentTheme = 'light';

  ngOnInit() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.loadProfile();
  }

  loadProfile() {
    this.accountService.getProfile().subscribe({
      next: (data) => {
        this.profileData = { ...data, password: '' };
        this.originalProfileData = { ...data, password: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.errorMessage = 'Could not load profile. Please try again later.';
        this.cdr.detectChanges();
      }
    });
  }

  isFieldModified(fieldName: keyof Account): boolean {
    if (!this.originalProfileData) return false;
    return this.profileData[fieldName] !== this.originalProfileData[fieldName];
  }

  isProfileModified(): boolean {
    if (!this.originalProfileData) return false;
    return this.profileData.fullName !== this.originalProfileData.fullName ||
           this.profileData.phone !== this.originalProfileData.phone ||
           this.profileData.dob !== this.originalProfileData.dob ||
           this.profileData.gender !== this.originalProfileData.gender ||
           this.profileData.email !== this.originalProfileData.email ||
           this.profileData.address !== this.originalProfileData.address ||
           this.profileData.avatar !== this.originalProfileData.avatar;
  }

  isPasswordModified(): boolean {
    return this.currentPassword !== '' ||
           this.newPassword !== '' ||
           this.confirmPassword !== '';
  }

  isStoreModified(): boolean {
    return this.storeName !== this.originalStoreName ||
           this.storeAddress !== this.originalStoreAddress ||
           this.storePhone !== this.originalStorePhone;
  }

  setGender(gender: string) {
    this.profileData.gender = gender;
    this.cdr.detectChanges();
  }

  triggerAvatarUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  resizeImage(base64Str: string, maxWidth: number = 400, maxHeight: number = 400): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  }

  onAvatarFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rawBase64 = reader.result as string;
      if (file.size > 2 * 1024 * 1024) {
        this.resizeImage(rawBase64, 400, 400).then((resizedBase64) => {
          this.profileData.avatar = resizedBase64;
          this.errorMessage = '';
          this.cdr.detectChanges();
        });
      } else {
        this.profileData.avatar = rawBase64;
        this.errorMessage = '';
        this.cdr.detectChanges();
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
    reader.readAsDataURL(file);
  }

  onAvatarError(event: any) {
    // Silently ignore avatar error, template fallback will handle display
  }

  saveProfile() {
    this.savingProfile = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.accountService.updateProfile(this.profileData).subscribe({
      next: (updated) => {
        this.savingProfile = false;
        this.profileData = { ...updated, password: '' };
        this.originalProfileData = { ...updated, password: '' };
        this.successMessage = 'Cập nhật hồ sơ thành công!';
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 5000);
        
        // Update values in localStorage to sync Topbar immediately
        localStorage.setItem('fullName', updated.fullName);
        localStorage.setItem('avatar', updated.avatar || '');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingProfile = false;
        console.error('Error updating profile', err);
        this.errorMessage = err.error || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.';
        this.cdr.detectChanges();
      }
    });
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordErrorMessage = 'Vui lòng điền đầy đủ thông tin mật khẩu';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordErrorMessage = 'Mật khẩu mới và xác nhận mật khẩu không khớp';
      return;
    }
    this.changingPassword = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    this.accountService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.changingPassword = false;
        this.passwordSuccessMessage = 'Đổi mật khẩu thành công!';
        setTimeout(() => {
          this.passwordSuccessMessage = '';
          this.cdr.detectChanges();
        }, 5000);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.changingPassword = false;
        this.passwordErrorMessage = err.error?.message || err.error || 'Mật khẩu hiện tại không chính xác';
        this.cdr.detectChanges();
      }
    });
  }

  setTheme(theme: string) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.cdr.detectChanges();
  }

  saveStoreSettings() {
    this.originalStoreName = this.storeName;
    this.originalStoreAddress = this.storeAddress;
    this.originalStorePhone = this.storePhone;
    this.storeSuccessMessage = 'Cập nhật cấu hình cửa hàng thành công!';
    setTimeout(() => {
      this.storeSuccessMessage = '';
      this.cdr.detectChanges();
    }, 5000);
    this.cdr.detectChanges();
  }
}
