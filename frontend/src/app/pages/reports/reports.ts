import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  activeRange = 'month'; // 'today', 'week', 'month', 'quarter', 'year', 'custom'
  startDate = '';
  endDate = '';
  loading = false;

  // Summary indicators
  netRevenue = 0; // Doanh thu trước thuế
  tax = 0; // Tiền thuế
  totalAmount = 0; // Doanh thu sau thuế
  revenue = 0; // For staff percentage ratio calculations
  cogs = 0;
  profit = 0;
  margin = 0;
  totalOrders = 0;
  aov = 0;

  // Data lists
  trendData: any[] = [];
  productReport: any[] = [];
  staffReport: any[] = [];
  categoryReport: any[] = [];
  paymentReport: any[] = [];
  paymentPieStyle = '#e5e7eb';

  // SVG Chart rendering variables
  maxVal = 1000;
  revenuePoints = '';
  profitPoints = '';
  revenueAreaPoints = '';
  profitAreaPoints = '';
  chartTicks: { x: number, label: string }[] = [];
  chartYGrid: number[] = [];

  ngOnInit() {
    this.setRange('month');
  }

  setRange(range: string) {
    this.activeRange = range;
    const today = new Date();

    if (range === 'today') {
      this.startDate = this.formatDate(today);
      this.endDate = this.formatDate(today);
    } else if (range === 'week') {
      // Find Monday of this week
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMonday);
      this.startDate = this.formatDate(monday);
      this.endDate = this.formatDate(today);
    } else if (range === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.startDate = this.formatDate(firstDay);
      this.endDate = this.formatDate(today);
    } else if (range === 'quarter') {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const firstDayOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1);
      this.startDate = this.formatDate(firstDayOfQuarter);
      this.endDate = this.formatDate(today);
    } else if (range === 'year') {
      this.startDate = `${today.getFullYear()}-01-01`;
      this.endDate = `${today.getFullYear()}-12-31`;
    }

    this.loadData();
  }

  onCustomDateChange() {
    if (this.startDate && this.endDate) {
      this.activeRange = 'custom';
      this.loadData();
    }
  }

  loadData() {
    if (!this.startDate || !this.endDate) return;

    this.loading = true;
    const params = `?startDate=${this.startDate}&endDate=${this.endDate}`;

    // 1. Fetch Summary
    this.http.get<any>(`/api/reports/summary${params}`).subscribe({
      next: (res) => {
        this.netRevenue = res.netRevenue || 0;
        this.tax = res.tax || 0;
        this.totalAmount = res.grossRevenue || 0;
        this.revenue = res.grossRevenue || 0;
        this.cogs = res.cogs || 0;
        this.profit = res.profit || 0;
        this.margin = res.margin || 0;
        this.totalOrders = res.totalOrders || 0;
        this.aov = res.aov || 0;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading report summary', err)
    });

    // 2. Fetch Sales Trend
    this.http.get<any[]>(`/api/reports/sales-trend${params}`).subscribe({
      next: (res) => {
        this.trendData = res;
        this.generateChartPoints();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading sales trend', err)
    });

    // 3. Fetch Product Performance
    this.http.get<any[]>(`/api/reports/products${params}`).subscribe({
      next: (res) => {
        this.productReport = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading product reports', err)
    });

    // 4. Fetch Staff Performance
    this.http.get<any[]>(`/api/reports/staff${params}`).subscribe({
      next: (res) => {
        this.staffReport = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading staff reports', err);
      }
    });

    // 5. Fetch Category Performance
    this.http.get<any[]>(`/api/reports/categories${params}`).subscribe({
      next: (res) => {
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6'];
        this.categoryReport = res.map((item, index) => ({
          ...item,
          color: colors[index % colors.length]
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading category reports', err);
      }
    });

    // 6. Fetch Payment Performance
    this.http.get<any[]>(`/api/reports/payments${params}`).subscribe({
      next: (res) => {
        this.paymentReport = res;
        this.generatePaymentPieChart();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading payment reports', err);
      }
    });
  }

  generatePaymentPieChart() {
    if (!this.paymentReport || this.paymentReport.length === 0) {
      this.paymentPieStyle = '#e5e7eb';
      return;
    }

    const total = this.paymentReport.reduce((acc, p) => acc + p.count, 0);
    if (total === 0) {
      this.paymentPieStyle = '#e5e7eb';
      return;
    }

    // Color mapping
    const colorMap: { [key: string]: string } = {
      'Tiền mặt': '#4F46E5',
      'Chuyển khoản': '#14B8A6',
      'Cà thẻ': '#F59E0B'
    };

    const methods = ['Tiền mặt', 'Chuyển khoản', 'Cà thẻ'];
    const filledReport = methods.map(m => {
      const found = this.paymentReport.find(p => p.method === m);
      return {
        method: m,
        count: found ? found.count : 0,
        color: colorMap[m]
      };
    }).sort((a, b) => b.count - a.count);

    this.paymentReport = filledReport;

    let accumulatedPercent = 0;
    const gradientParts: string[] = [];

    filledReport.forEach(p => {
      const percent = (p.count / total) * 100;
      if (percent > 0) {
        const start = accumulatedPercent;
        accumulatedPercent += percent;
        gradientParts.push(`${p.color} ${start}% ${accumulatedPercent}%`);
      }
    });

    if (gradientParts.length > 0) {
      this.paymentPieStyle = `conic-gradient(${gradientParts.join(', ')})`;
    } else {
      this.paymentPieStyle = '#e5e7eb';
    }
  }

  formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  generateChartPoints() {
    if (this.trendData.length === 0) {
      this.revenuePoints = '';
      this.profitPoints = '';
      this.revenueAreaPoints = '';
      this.profitAreaPoints = '';
      this.chartTicks = [];
      return;
    }

    const width = 600;
    const height = 250;
    const paddingX = 50;
    const paddingY = 30;

    // Find max value to scale Y axis
    let max = 0;
    this.trendData.forEach(d => {
      if (d.revenue > max) max = d.revenue;
      if (d.profit > max) max = d.profit;
    });
    if (max === 0) max = 1000;
    this.maxVal = max;

    const chartWidth = width - 2 * paddingX;
    const chartHeight = height - 2 * paddingY;

    // Draw Y axis grids (4 grid lines)
    this.chartYGrid = [
      height - paddingY,
      height - paddingY - chartHeight * 0.33,
      height - paddingY - chartHeight * 0.66,
      paddingY
    ];

    const n = this.trendData.length;
    let revPts: string[] = [];
    let prfPts: string[] = [];
    let ticks: any[] = [];

    this.trendData.forEach((d, i) => {
      const x = paddingX + (n > 1 ? (i / (n - 1)) * chartWidth : chartWidth / 2);
      
      const yRev = height - paddingY - (d.revenue / max) * chartHeight;
      const yPrf = height - paddingY - (d.profit / max) * chartHeight;

      revPts.push(`${x},${yRev}`);
      prfPts.push(`${x},${yPrf}`);

      // Shorten date label YYYY-MM-DD -> DD/MM to fit X axis
      const parts = d.dateLabel.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.dateLabel;

      // Filter to maximum of 6 ticks to keep X axis clean
      if (n <= 6) {
        ticks.push({ x, label });
      } else {
        const step = Math.ceil(n / 6);
        if (i === 0 || i === n - 1 || i % step === 0) {
          ticks.push({ x, label });
        }
      }
    });

    this.revenuePoints = revPts.join(' ');
    this.profitPoints = prfPts.join(' ');

    // Complete closed path coordinates for rendering shaded area gradient fill
    const bottomY = height - paddingY;
    if (n > 0) {
      const startX = paddingX;
      const endX = paddingX + (n > 1 ? chartWidth : chartWidth / 2);
      this.revenueAreaPoints = `${startX},${bottomY} ${this.revenuePoints} ${endX},${bottomY}`;
      this.profitAreaPoints = `${startX},${bottomY} ${this.profitPoints} ${endX},${bottomY}`;
    }

    this.chartTicks = ticks;
  }
}
