import os

base_dir = "d:\\Hust\\project.2\\frontend\\src\\app"

components = {
    "sidebar": {
        "html": """
<aside class="sidebar glass" [class.collapsed]="collapsed">
  <div class="logo">
    <div class="logo-icon"></div>
    <span *ngIf="!collapsed">POS System</span>
  </div>
  <nav class="nav-links">
    <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
      <i>📊</i> <span *ngIf="!collapsed">Dashboard</span>
    </a>
    <a routerLink="/sales" routerLinkActive="active" class="nav-item">
      <i>🛒</i> <span *ngIf="!collapsed">Sales / Register</span>
    </a>
    <a routerLink="/products" routerLinkActive="active" class="nav-item">
      <i>📦</i> <span *ngIf="!collapsed">Products</span>
    </a>
    <a routerLink="/inventory" routerLinkActive="active" class="nav-item">
      <i>🏢</i> <span *ngIf="!collapsed">Inventory</span>
    </a>
    <a routerLink="/reports" routerLinkActive="active" class="nav-item">
      <i>📈</i> <span *ngIf="!collapsed">Reports</span>
    </a>
    <a routerLink="/staff" routerLinkActive="active" class="nav-item">
      <i>👥</i> <span *ngIf="!collapsed">Staff</span>
    </a>
    <a routerLink="/settings" routerLinkActive="active" class="nav-item">
      <i>⚙️</i> <span *ngIf="!collapsed">Settings</span>
    </a>
  </nav>
</aside>
""",
        "css": """
.sidebar {
  width: 260px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  transition: width 0.3s;
  background: var(--surface);
  z-index: 100;
}
.sidebar.collapsed { width: 80px; }
.logo {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary);
  border-bottom: 1px solid var(--border);
}
.logo-icon {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 8px;
}
.nav-links {
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.5rem;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}
.nav-item:hover, .nav-item.active {
  color: var(--primary);
  background: rgba(79, 70, 229, 0.05);
  border-left-color: var(--primary);
}
.nav-item i { font-style: normal; font-size: 1.2rem; }
"""
    },
    "topbar": {
        "html": """
<header class="topbar glass">
  <div class="search-bar">
    <input type="text" placeholder="Search..." class="form-control" style="width: 300px; border-radius: 20px;">
  </div>
  <div class="actions">
    <button class="btn btn-outline" style="border: none; font-size: 1.2rem;">🔔</button>
    <div class="profile">
      <div class="avatar">A</div>
      <div class="info">
        <strong>Admin User</strong>
        <span>Manager</span>
      </div>
    </div>
  </div>
</header>
""",
        "css": """
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--surface);
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
}
.actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}
.avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.info {
  display: flex; flex-direction: column;
  font-size: 0.85rem;
}
.info strong { color: var(--text-main); }
.info span { color: var(--text-muted); }
"""
    },
    "login": {
        "html": """
<div class="login-wrapper">
  <div class="login-container glass">
    <div class="login-header">
      <div class="logo"></div>
      <h2>Welcome Back</h2>
      <p>Log in to your POS account</p>
    </div>
    <form class="login-form">
      <div class="form-group">
        <label class="form-label">Username</label>
        <input type="text" class="form-control" placeholder="Enter username">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" class="form-control" placeholder="Enter password">
      </div>
      <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
          <input type="checkbox"> Remember me
        </label>
        <a href="#" style="font-size: 0.85rem; color: var(--primary); text-decoration: none;">Forgot Password?</a>
      </div>
      <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" routerLink="/dashboard">Log In</button>
    </form>
  </div>
</div>
""",
        "css": """
.login-wrapper {
  height: 100vh; width: 100vw;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #4F46E5 0%, #10B981 100%);
}
.login-container {
  width: 100%; max-width: 400px;
  padding: 2.5rem;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  text-align: center;
}
.login-header h2 { margin-bottom: 0.2rem; color: #111827; }
.login-header p { color: #6B7280; font-size: 0.9rem; margin-bottom: 2rem; }
.logo {
  width: 60px; height: 60px;
  background: var(--primary);
  border-radius: 16px;
  margin: 0 auto 1.5rem;
  box-shadow: var(--shadow-md);
}
.login-form { text-align: left; }
"""
    },
    "dashboard": {
        "html": """
<div class="dashboard">
  <h2>Dashboard Overview</h2>
  <div class="stats-grid">
    <div class="card stat-card">
      <div class="icon" style="background: rgba(79, 70, 229, 0.1); color: var(--primary);">💰</div>
      <div class="data">
        <span>Today's Sales</span>
        <h3>$3,240.50</h3>
      </div>
    </div>
    <div class="card stat-card">
      <div class="icon" style="background: rgba(16, 185, 129, 0.1); color: var(--secondary);">🧾</div>
      <div class="data">
        <span>Total Orders</span>
        <h3>142</h3>
      </div>
    </div>
    <div class="card stat-card">
      <div class="icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">⭐</div>
      <div class="data">
        <span>Top Product</span>
        <h3>Espresso</h3>
      </div>
    </div>
    <div class="card stat-card">
      <div class="icon" style="background: rgba(239, 68, 68, 0.1); color: var(--danger);">📦</div>
      <div class="data">
        <span>Low Stock Alerts</span>
        <h3>14 Items</h3>
      </div>
    </div>
  </div>
  
  <div class="charts-wrap">
    <div class="card chart-area">
      <h4>Revenue Trends</h4>
      <!-- Mock Chart -->
      <div class="mock-chart">
        <svg viewBox="0 0 100 40" class="chart-line">
          <polyline fill="none" stroke="var(--primary)" stroke-width="2" points="0,30 20,25 40,35 60,15 80,20 100,5" />
        </svg>
      </div>
    </div>
    <div class="card recent-tx">
      <h4>Recent Transactions</h4>
      <div class="table-container" style="box-shadow: none;">
        <table>
          <thead>
            <tr><th>Order ID</th><th>Time</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>#ORD-1002</td><td>10:45 AM</td><td>$45.00</td><td><span class="badge badge-success">Paid</span></td></tr>
            <tr><td>#ORD-1001</td><td>10:30 AM</td><td>$12.50</td><td><span class="badge badge-success">Paid</span></td></tr>
            <tr><td>#ORD-1000</td><td>09:15 AM</td><td>$125.00</td><td><span class="badge badge-warning">Pending</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
""",
        "css": """
.dashboard { display: flex; flex-direction: column; gap: 1.5rem; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
.stat-card { display: flex; align-items: center; gap: 1rem; }
.icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.data span { color: var(--text-muted); font-size: 0.85rem; font-weight: 500; }
.data h3 { margin-bottom: 0; margin-top: 0.2rem; }
.charts-wrap { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
.mock-chart { width: 100%; height: 200px; display: flex; align-items: flex-end; margin-top: 1rem; }
.mock-chart svg { width: 100%; height: 100%; }
.badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: rgba(16, 185, 129, 0.1); color: var(--secondary); }
.badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
"""
    },
    "sales": {
        "html": """
<div class="sales-layout">
  <div class="product-section">
    <div class="filters">
      <button class="btn btn-primary">All</button>
      <button class="btn btn-outline">Drinks</button>
      <button class="btn btn-outline">Food</button>
      <button class="btn btn-outline">Dessert</button>
      <input type="text" class="form-control" placeholder="Search..." style="margin-left: auto; width: 250px;">
    </div>
    <div class="product-grid">
      <div class="product-card" *ngFor="let p of [1,2,3,4,5,6,7,8]">
        <div class="img-placeholder"></div>
        <div class="p-info">
          <h5>Espresso</h5>
          <span>$4.50</span>
        </div>
      </div>
    </div>
  </div>
  <div class="cart-section card glass">
    <h3 style="border-bottom: 1px solid var(--border); padding-bottom: 1rem;">Current Order</h3>
    <div class="cart-items">
      <div class="cart-item">
        <div class="detail">
          <strong>Espresso</strong>
          <span>1 x $4.50</span>
        </div>
        <div class="actions">
          <button class="btn-outline">-</button>
          <span>1</span>
          <button class="btn-outline">+</button>
        </div>
      </div>
      <div class="cart-item">
        <div class="detail">
          <strong>Latte</strong>
          <span>2 x $5.00</span>
        </div>
        <div class="actions">
          <button class="btn-outline">-</button>
          <span>2</span>
          <button class="btn-outline">+</button>
        </div>
      </div>
    </div>
    <div class="cart-summary">
      <div class="row"><span>Subtotal</span><span>$14.50</span></div>
      <div class="row"><span>Tax (8%)</span><span>$1.16</span></div>
      <div class="row total"><span>Total</span><span>$15.66</span></div>
      <button class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">Charge $15.66</button>
    </div>
  </div>
</div>
""",
        "css": """
.sales-layout { display: flex; gap: 1.5rem; height: calc(100vh - 120px); }
.product-section { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; }
.filters { display: flex; gap: 0.5rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; overflow-y: auto; padding-bottom: 2rem; }
.product-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; transition: transform 0.2s; }
.product-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--primary); }
.img-placeholder { height: 100px; background: #e2e8f0; }
.p-info { padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
.p-info h5 { margin: 0; font-size: 0.9rem; }
.p-info span { color: var(--primary); font-weight: bold; font-size: 0.9rem; }

.cart-section { width: 350px; display: flex; flex-direction: column; }
.cart-items { flex: 1; overflow-y: auto; margin: 1rem 0; }
.cart-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px dashed var(--border); margin-bottom: 0.5rem; }
.cart-item .detail { display: flex; flex-direction: column; gap: 0.2rem; }
.cart-item .detail strong { font-size: 0.9rem; }
.cart-item .detail span { font-size: 0.8rem; color: var(--text-muted); }
.actions button { padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; }
.cart-summary { padding-top: 1rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.5rem; }
.row { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted); }
.row.total { font-size: 1.2rem; font-weight: bold; color: var(--text-main); margin: 0.5rem 0 1rem; }
"""
    },
    "products": {
        "html": """
<div class="page-layout">
  <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
    <h2>Product Management</h2>
    <button class="btn btn-primary">Add Product</button>
  </div>
  <div class="card">
    <div class="table-container">
      <table>
        <thead>
          <tr><th>Image</th><th>Name</th><th>SKU / Barcode</th><th>Category</th><th>Stock</th><th>Price</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let i of [1,2,3,4,5]">
            <td><div style="width:40px; height:40px; background:#e2e8f0; border-radius:4px;"></div></td>
            <td><strong>Latte Macchiato</strong></td>
            <td>LTM-001</td>
            <td>Drinks</td>
            <td><span class="badge badge-success">45</span></td>
            <td>$5.00</td>
            <td>
              <button class="btn-outline" style="border:none; padding:4px;">✏️</button>
              <button class="btn-outline" style="border:none; padding:4px;">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
""",
        "css": ".badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; } .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--secondary); }"
    },
    "settings": {
        "html": """
<div class="settings-page">
  <h2>Settings</h2>
  <div class="settings-layout">
    <div class="card sidebar-settings">
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 1rem; border-bottom: 1px solid var(--border); font-weight: bold; color: var(--primary);">General</li>
        <li style="padding: 1rem; border-bottom: 1px solid var(--border); color: var(--text-muted);">Tax & Currency</li>
        <li style="padding: 1rem; border-bottom: 1px solid var(--border); color: var(--text-muted);">Hardware (Printers)</li>
        <li style="padding: 1rem; color: var(--text-muted);">Theme</li>
      </ul>
    </div>
    <div class="card content-settings">
      <h3>General Configuration</h3>
      <br>
      <div class="form-group">
        <label class="form-label">Store Name</label>
        <input type="text" class="form-control" value="Awesome Coffee Shop">
      </div>
      <div class="form-group">
        <label class="form-label">Store Address</label>
        <input type="text" class="form-control" value="123 Main St, NY">
      </div>
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input type="text" class="form-control" value="123-456-7890">
      </div>
      <button class="btn btn-primary" style="margin-top: 1rem;">Save Changes</button>
    </div>
  </div>
</div>
""",
        "css": """
.settings-layout { display: grid; grid-template-columns: 250px 1fr; gap: 1.5rem; margin-top: 1rem; }
.sidebar-settings li { cursor: pointer; transition: background 0.2s; }
.sidebar-settings li:hover { background: rgba(0,0,0,0.02); }
"""
    }
}

for comp, data in components.items():
    if comp in ["sidebar", "topbar", "payment-modal", "receipt-preview"]:
        path = os.path.join(base_dir, "components", comp)
    else:
        path = os.path.join(base_dir, "pages", comp)
    
    with open(os.path.join(path, f"{comp}.component.html"), "w", encoding="utf-8") as f:
        f.write(data["html"])
    with open(os.path.join(path, f"{comp}.component.css"), "w", encoding="utf-8") as f:
        f.write(data["css"])

print("UI successfully injected!")
