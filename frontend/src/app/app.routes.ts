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

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'sales', component: Sales },
  { path: 'transactions', component: Transactions },
  { path: 'inventory', component: Inventory },
  { path: 'imports', component: ImportsComponent },
  { path: 'reports', component: Reports },
  { path: 'staff', component: Staff },
  { path: 'settings', component: Settings },
  { path: '**', redirectTo: '/dashboard' }
];
