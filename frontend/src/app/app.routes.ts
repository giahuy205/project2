import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Sales } from './pages/sales/sales';
import { Transactions } from './pages/transactions/transactions';
import { Inventory } from './pages/inventory/inventory';
import { Reports } from './pages/reports/reports';
import { Staff } from './pages/staff/staff';
import { Settings } from './pages/settings/settings';
import { ImportsComponent } from './pages/imports/imports';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard, adminGuard] },
  { 
    path: 'sales', 
    component: Sales, 
    canActivate: [authGuard],
    canDeactivate: [(component: Sales) => component.confirmDeactivate()]
  },
  { path: 'transactions', component: Transactions, canActivate: [authGuard] },
  { path: 'inventory', component: Inventory, canActivate: [authGuard] },
  { path: 'imports', component: ImportsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'reports', component: Reports, canActivate: [authGuard, adminGuard] },
  { path: 'staff', component: Staff, canActivate: [authGuard, adminGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
