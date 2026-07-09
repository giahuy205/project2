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

  activeRange = 'month'; // 'today', 'week', 'month', 'year', 'custom'
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
  upt = 0;
  averageProfitPerOrder = 0;

  // Data lists
  trendData: any[] = [];
  productReport: any[] = [];
  staffReport: any[] = [];
  categoryReport: any[] = [];
  paymentReport: any[] = [];
  paymentPieStyle = '#e5e7eb';
  
  // Selected Donut segments and list data
  selectedPaymentSeg: any = null;
  selectedCategorySeg: any = null;
  paymentSegments: any[] = [];
  categorySegments: any[] = [];

  // Tab navigation
  activeTab: string = 'overview';
  activeChartTab: string = 'revenue';
  totalProductsSold = 0;

  // Previous period and comparison variables
  compareWithPrevious = true;
  showMonthlyBarChart = false;
  previousTrendData: any[] = [];
  previousRevenuePointsArray: { x: number, y: number }[] = [];
  previousRevenuePath = '';
  previousProfitPointsArray: { x: number, y: number }[] = [];
  previousProfitPath = '';
  
  // Recent cycles bar chart variables
  recentCyclesData: any[] = [];
  recentCyclesBars: any[] = [];
  recentCyclesMaxVal = 1000;
  recentCyclesTicks: { x: number, label: string }[] = [];
  
  previousTotalAmount = 0;
  previousProfit = 0;
  Math = Math;

  // Comparison growth rates (%)
  revenueGrowth = 0;
  cogsGrowth = 0;
  profitGrowth = 0;
  marginGrowth = 0;
  ordersGrowth = 0;
  productsSoldGrowth = 0;

  calculateGrowth(current: number, previous: number): number {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  // SVG Chart rendering variables
  maxVal = 1000;
  revenuePointsArray: { x: number, y: number }[] = [];
  profitPointsArray: { x: number, y: number }[] = [];
  revenuePath = '';
  profitPath = '';
  revenueAreaPath = '';
  profitAreaPath = '';
  chartBars: any[] = [];
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
    } else if (range === 'last7days') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      this.startDate = this.formatDate(start);
      this.endDate = this.formatDate(today);
    } else if (range === 'last30days') {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      this.startDate = this.formatDate(start);
      this.endDate = this.formatDate(today);
    } else if (range === 'week') {
      // Find Monday of this week
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMonday);
      this.startDate = this.formatDate(monday);
      
      // End date is Sunday of this week to show the full week
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      this.endDate = this.formatDate(sunday);
    } else if (range === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.startDate = this.formatDate(firstDay);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      this.endDate = this.formatDate(lastDay);
    } else if (range === 'lastMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      this.startDate = this.formatDate(firstDay);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      this.endDate = this.formatDate(lastDay);
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

  setChartTab(tab: 'revenue' | 'profit') {
    this.activeChartTab = tab;
    this.generateChartPoints();
    this.generateRecentCyclesBars();
    this.cdr.detectChanges();
  }

  toggleComparison() {
    this.compareWithPrevious = !this.compareWithPrevious;
    this.loadData();
  }

  getPreviousPeriodParams(): string {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const prevStart = new Date(start);
    prevStart.setDate(start.getDate() - diffDays);

    const prevEnd = new Date(end);
    prevEnd.setDate(end.getDate() - diffDays);

    return `?startDate=${this.formatDate(prevStart)}&endDate=${this.formatDate(prevEnd)}`;
  }

  aggregateDataByMonth(data: any[]): any[] {
    const monthlyMap = new Map<string, { revenue: number, profit: number }>();
    data.forEach(d => {
      const parts = d.dateLabel.split('-');
      if (parts.length >= 2) {
        const monthKey = `${parts[0]}-${parts[1]}`;
        const existing = monthlyMap.get(monthKey) || { revenue: 0, profit: 0 };
        existing.revenue += d.revenue || 0;
        existing.profit += d.profit || 0;
        monthlyMap.set(monthKey, existing);
      }
    });

    const aggregated: any[] = [];
    monthlyMap.forEach((val, key) => {
      aggregated.push({
        dateLabel: key,
        revenue: val.revenue,
        profit: val.profit
      });
    });
    return aggregated.sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  }

  loadData() {
    if (!this.startDate || !this.endDate) return;

    // Check if range is > 30 days to show monthly bar chart
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.showMonthlyBarChart = diffDays > 30;

    this.loading = true;
    const params = `?startDate=${this.startDate}&endDate=${this.endDate}`;

    // Reset growth rates
    this.revenueGrowth = 0;
    this.cogsGrowth = 0;
    this.profitGrowth = 0;
    this.marginGrowth = 0;
    this.ordersGrowth = 0;
    this.productsSoldGrowth = 0;

    const prevParams = this.getPreviousPeriodParams();

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
        this.averageProfitPerOrder = this.totalOrders > 0 ? this.profit / this.totalOrders : 0;
        
        if (this.compareWithPrevious) {
          this.http.get<any>(`/api/reports/summary${prevParams}`).subscribe({
            next: (prevRes) => {
              const prevGrossRevenue = prevRes.grossRevenue || 0;
              const prevCogs = prevRes.cogs || 0;
              const prevProfit = prevRes.profit || 0;
              const prevMargin = prevRes.margin || 0;
              const prevTotalOrders = prevRes.totalOrders || 0;

              this.revenueGrowth = this.calculateGrowth(this.totalAmount, prevGrossRevenue);
              this.cogsGrowth = this.calculateGrowth(this.cogs, prevCogs);
              this.profitGrowth = this.calculateGrowth(this.profit, prevProfit);
              this.marginGrowth = this.margin - prevMargin;
              this.ordersGrowth = this.calculateGrowth(this.totalOrders, prevTotalOrders);
              this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading previous report summary', err)
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading report summary', err)
    });

    // 2. Fetch Sales Trend
    this.http.get<any[]>(`/api/reports/sales-trend${params}`).subscribe({
      next: (res) => {
        this.trendData = this.fillMissingDates(res, this.startDate, this.endDate);
        
        if (this.compareWithPrevious) {
          const prevParams = this.getPreviousPeriodParams();
          const urlParams = new URLSearchParams(prevParams);
          const prevStart = urlParams.get('startDate') || '';
          const prevEnd = urlParams.get('endDate') || '';
          
          this.http.get<any[]>(`/api/reports/sales-trend${prevParams}`).subscribe({
            next: (prevRes) => {
              this.previousTrendData = this.fillMissingDates(prevRes, prevStart, prevEnd);
              this.generateChartPoints();
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Error loading previous sales trend', err);
              this.previousTrendData = this.fillMissingDates([], prevStart, prevEnd);
              this.generateChartPoints();
              this.cdr.detectChanges();
            }
          });
        } else {
          this.previousTrendData = [];
          this.generateChartPoints();
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error loading sales trend', err)
    });

    // 3. Fetch Product Performance
    this.http.get<any[]>(`/api/reports/products${params}`).subscribe({
      next: (res) => {
        this.productReport = res;
        const totalProductsSold = res.reduce((sum: number, item: any) => sum + (item.quantitySold || 0), 0);
        this.totalProductsSold = totalProductsSold;
        this.upt = this.totalOrders > 0 ? totalProductsSold / this.totalOrders : 0;
        
        if (this.compareWithPrevious) {
          this.http.get<any[]>(`/api/reports/products${prevParams}`).subscribe({
            next: (prevRes) => {
              const prevTotalProductsSold = prevRes.reduce((sum: number, item: any) => sum + (item.quantitySold || 0), 0);
              this.productsSoldGrowth = this.calculateGrowth(this.totalProductsSold, prevTotalProductsSold);
              this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading previous products report', err)
          });
        }
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
        const colors = ['#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#EF4444', '#14B8A6', '#84CC16'];
        this.categoryReport = res.map((item, index) => ({
          ...item,
          color: colors[index % colors.length]
        }));
        this.categorySegments = this.calculateDonutSegments(this.categoryReport, 'revenue');
        this.selectedCategorySeg = null;
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
        this.loadRecentCyclesData();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadRecentCyclesData();
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
      'Tiền mặt': '#3B82F6',
      'Chuyển khoản': '#10B981',
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

    this.paymentSegments = this.calculateDonutSegments(this.paymentReport, 'count');
    this.selectedPaymentSeg = null;

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

  fillMissingDates(data: any[], startStr: string, endStr: string): any[] {
    if (!startStr || !endStr) return data;
    const filled: any[] = [];
    
    const startParts = startStr.split('-');
    const endParts = endStr.split('-');
    
    const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
    const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
    
    const current = new Date(start);
    while (current <= end) {
      const dateKey = this.formatDate(current);
      const found = data.find(d => d.dateLabel === dateKey);
      
      filled.push({
        dateLabel: dateKey,
        revenue: found ? (found.revenue || 0) : 0,
        profit: found ? (found.profit || 0) : 0
      });
      
      current.setDate(current.getDate() + 1);
    }
    return filled;
  }

  generateChartPoints() {
    if (this.trendData.length === 0) {
      this.revenuePointsArray = [];
      this.profitPointsArray = [];
      this.revenuePath = '';
      this.profitPath = '';
      this.revenueAreaPath = '';
      this.profitAreaPath = '';
      this.previousRevenuePointsArray = [];
      this.previousRevenuePath = '';
      this.previousProfitPointsArray = [];
      this.previousProfitPath = '';
      this.chartBars = [];
      this.chartTicks = [];
      return;
    }

    const width = 600;
    const height = 250;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingY = 30;

    let displayTrend = this.trendData;
    let displayPrevTrend = this.previousTrendData;

    if (this.showMonthlyBarChart) {
      displayTrend = this.aggregateDataByMonth(this.trendData);
      displayPrevTrend = this.aggregateDataByMonth(this.previousTrendData);
    }

    // Find max value to scale Y axis based on Revenue (larger value) to keep Y-axis scale stable across tabs
    let max = 0;
    const isRev = this.activeChartTab === 'revenue';
    
    displayTrend.forEach(d => {
      const val = d.revenue || 0;
      if (val > max) max = val;
    });
    if (this.compareWithPrevious && displayPrevTrend.length > 0) {
      displayPrevTrend.forEach(d => {
        const val = d.revenue || 0;
        if (val > max) max = val;
      });
    }
    if (max === 0) max = 1000;
    this.maxVal = max;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - 2 * paddingY;

    // Draw Y axis grids (4 grid lines)
    this.chartYGrid = [
      height - paddingY,
      height - paddingY - chartHeight * 0.33,
      height - paddingY - chartHeight * 0.66,
      paddingY
    ];

    const n = displayTrend.length;
    let ticks: any[] = [];

    // Daily & Monthly line chart (unified)
    const todayStr = this.formatDate(new Date());
    const currentMonthStr = todayStr.substring(0, 7);
    this.chartBars = [];
    let pointsList: { x: number, y: number }[] = [];

    displayTrend.forEach((d, i) => {
      const x = paddingLeft + (n > 1 ? (i / (n - 1)) * chartWidth : chartWidth / 2);
      
      const isFuture = d.dateLabel.length === 7 
        ? d.dateLabel > currentMonthStr 
        : d.dateLabel > todayStr;
        
      if (!isFuture) {
        const val = isRev ? d.revenue : d.profit;
        const yVal = height - paddingY - (val / max) * chartHeight;
        pointsList.push({ x, y: yVal });
      }

      // Determine label based on activeRange
      const parts = d.dateLabel.split('-');
      let label = d.dateLabel;
      
      if (this.activeRange === 'week') {
        if (parts.length === 3) {
          const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          const dayIndex = dateObj.getDay();
          const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          label = weekdayLabels[dayIndex];
        }
      } else if (this.activeRange === 'month') {
        if (parts.length === 3) {
          label = `N${Number(parts[2])}`;
        }
      } else if (this.activeRange === 'year' || this.showMonthlyBarChart) {
        if (parts.length >= 2) {
          label = `Thg ${Number(parts[1])}`;
        }
      } else {
        // Fallback for custom or other ranges
        if (parts.length === 3) {
          label = `${parts[2]}/${parts[1]}`;
        } else if (parts.length === 2) {
          label = `${parts[1]}/${parts[0]}`;
        }
      }

      if (n <= 6) {
        ticks.push({ x, label });
      } else {
        const step = Math.ceil(n / 6);
        if (i === 0 || i === n - 1 || i % step === 0) {
          ticks.push({ x, label });
        }
      }
    });

    const bottomY = height - paddingY;
    const pathStr = this.getSplinePath(pointsList);
    let areaPathStr = '';
    if (pointsList.length > 0) {
      const startX = pointsList[0].x;
      const endX = pointsList[pointsList.length - 1].x;
      areaPathStr = `${pathStr} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
    }

    if (isRev) {
      this.revenuePointsArray = pointsList;
      this.revenuePath = pathStr;
      this.revenueAreaPath = areaPathStr;
      
      this.profitPointsArray = [];
      this.profitPath = '';
      this.profitAreaPath = '';
    } else {
      this.profitPointsArray = pointsList;
      this.profitPath = pathStr;
      this.profitAreaPath = areaPathStr;

      this.revenuePointsArray = [];
      this.revenuePath = '';
      this.revenueAreaPath = '';
    }

    // Draw previous trend line if compare is active
    if (this.compareWithPrevious && displayPrevTrend.length > 0) {
      const prevN = displayPrevTrend.length;
      let prevPointsList: { x: number, y: number }[] = [];
      displayPrevTrend.forEach((d, i) => {
        const x = paddingLeft + (prevN > 1 ? (i / (prevN - 1)) * chartWidth : chartWidth / 2);
        const val = isRev ? d.revenue : d.profit;
        const yVal = height - paddingY - (val / max) * chartHeight;
        prevPointsList.push({ x, y: yVal });
      });

      if (isRev) {
        this.previousRevenuePointsArray = prevPointsList;
        this.previousRevenuePath = this.getSplinePath(prevPointsList);
        
        this.previousProfitPointsArray = [];
        this.previousProfitPath = '';
      } else {
        this.previousProfitPointsArray = prevPointsList;
        this.previousProfitPath = this.getSplinePath(prevPointsList);

        this.previousRevenuePointsArray = [];
        this.previousRevenuePath = '';
      }
    } else {
      this.previousRevenuePointsArray = [];
      this.previousRevenuePath = '';
      this.previousProfitPointsArray = [];
      this.previousProfitPath = '';
    }

    this.chartTicks = ticks;
  }

  getSplinePath(points: { x: number, y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      
      // Control points
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  }

  loadRecentCyclesData() {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);
    
    const range = this.activeRange;
    if (range === 'today' || range === 'last7days') {
      // Go back 6 days (total 7 days: today + 6 past days)
      start.setDate(today.getDate() - 6);
    } else if (range === 'week') {
      // Go back 5 weeks (start from Monday of 5 weeks ago)
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() + distanceToMonday);
      
      start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - 35); // 5 weeks * 7 days = 35 days ago
      
      const sunday = new Date(thisMonday);
      sunday.setDate(thisMonday.getDate() + 6);
      end = sunday;
    } else if (range === 'month' || range === 'lastMonth' || range === 'last30days') {
      // Go back 5 months (start from 1st of 5 months ago)
      start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end = lastDay;
    } else if (range === 'year') {
      // Go back 1 year (last year + this year)
      start = new Date(today.getFullYear() - 1, 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else {
      // Fallback for custom: recent weeks (same as 'week')
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() + distanceToMonday);
      
      start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - 35);
      
      const sunday = new Date(thisMonday);
      sunday.setDate(thisMonday.getDate() + 6);
      end = sunday;
    }
    
    const startStr = this.formatDate(start);
    const endStr = this.formatDate(end);
    const params = `?startDate=${startStr}&endDate=${endStr}`;
    
    this.http.get<any[]>(`/api/reports/sales-trend${params}`).subscribe({
      next: (res) => {
        this.processRecentCycles(res, startStr, endStr, range);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading recent cycles trend', err)
    });
  }

  processRecentCycles(data: any[], startStr: string, endStr: string, range: string) {
    if (range === 'today' || range === 'last7days') {
      const filledDaily = this.fillMissingDates(data, startStr, endStr);
      const buckets = filledDaily.map(d => {
        const parts = d.dateLabel.split('-');
        return {
          label: `${parts[2]}/${parts[1]}`,
          revenue: d.revenue,
          profit: d.profit,
          fullRangeLabel: `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`
        };
      });
      this.recentCyclesData = buckets;
    } else if (range === 'week' || range === 'custom') {
      const filledDaily = this.fillMissingDates(data, startStr, endStr);
      const buckets: any[] = [];
      
      const startParts = startStr.split('-');
      const baseStart = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
      
      for (let w = 0; w < 6; w++) {
        const wStart = new Date(baseStart);
        wStart.setDate(baseStart.getDate() + w * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wStart.getDate() + 6);
        
        const wStartStr = this.formatDate(wStart);
        const wEndStr = this.formatDate(wEnd);
        
        let sumRev = 0;
        let sumPrf = 0;
        filledDaily.forEach(d => {
          if (d.dateLabel >= wStartStr && d.dateLabel <= wEndStr) {
            sumRev += d.revenue || 0;
            sumPrf += d.profit || 0;
          }
        });
        
        const startLabelParts = wStartStr.split('-');
        const endLabelParts = wEndStr.split('-');
        const label = `${startLabelParts[2]}/${startLabelParts[1]}`;
        
        buckets.push({
          label: label,
          revenue: sumRev,
          profit: sumPrf,
          fullRangeLabel: `Tuần từ ${startLabelParts[2]}/${startLabelParts[1]} đến ${endLabelParts[2]}/${endLabelParts[1]}`
        });
      }
      this.recentCyclesData = buckets;
    } else if (range === 'month' || range === 'lastMonth' || range === 'last30days') {
      const filledDaily = this.fillMissingDates(data, startStr, endStr);
      const monthlyMap = new Map<string, { revenue: number, profit: number }>();
      
      const startParts = startStr.split('-');
      const baseStart = new Date(Number(startParts[0]), Number(startParts[1]) - 1, 1);
      const monthsOrder: string[] = [];
      for (let m = 0; m < 6; m++) {
        const nextM = new Date(baseStart.getFullYear(), baseStart.getMonth() + m, 1);
        const yyyy = nextM.getFullYear();
        const mm = String(nextM.getMonth() + 1).padStart(2, '0');
        const monthKey = `${yyyy}-${mm}`;
        monthsOrder.push(monthKey);
        monthlyMap.set(monthKey, { revenue: 0, profit: 0 });
      }
      
      filledDaily.forEach(d => {
        const monthKey = d.dateLabel.substring(0, 7);
        if (monthlyMap.has(monthKey)) {
          const val = monthlyMap.get(monthKey)!;
          val.revenue += d.revenue || 0;
          val.profit += d.profit || 0;
        }
      });
      
      const buckets: any[] = [];
      monthsOrder.forEach(key => {
        const val = monthlyMap.get(key)!;
        const parts = key.split('-');
        buckets.push({
          label: `Thg ${Number(parts[1])}`,
          revenue: val.revenue,
          profit: val.profit,
          fullRangeLabel: `Tháng ${parts[1]}/${parts[0]}`
        });
      });
      this.recentCyclesData = buckets;
    } else if (range === 'year') {
      const filledDaily = this.fillMissingDates(data, startStr, endStr);
      const yearlyMap = new Map<number, { revenue: number, profit: number }>();
      
      const currentYear = new Date().getFullYear();
      yearlyMap.set(currentYear - 1, { revenue: 0, profit: 0 });
      yearlyMap.set(currentYear, { revenue: 0, profit: 0 });
      
      filledDaily.forEach(d => {
        const parts = d.dateLabel.split('-');
        const year = Number(parts[0]);
        if (yearlyMap.has(year)) {
          const val = yearlyMap.get(year)!;
          val.revenue += d.revenue || 0;
          val.profit += d.profit || 0;
        }
      });
      
      const buckets = [
        {
          label: `${currentYear - 1}`,
          revenue: yearlyMap.get(currentYear - 1)!.revenue,
          profit: yearlyMap.get(currentYear - 1)!.profit,
          fullRangeLabel: `Năm ${currentYear - 1}`
        },
        {
          label: `${currentYear}`,
          revenue: yearlyMap.get(currentYear)!.revenue,
          profit: yearlyMap.get(currentYear)!.profit,
          fullRangeLabel: `Năm ${currentYear}`
        }
      ];
      this.recentCyclesData = buckets;
    }
    
    this.generateRecentCyclesBars();
  }

  generateRecentCyclesBars() {
    let max = 0;
    this.recentCyclesData.forEach(b => {
      if (b.revenue > max) max = b.revenue;
      if (b.profit > max) max = b.profit;
    });
    if (max === 0) max = 1000;
    this.recentCyclesMaxVal = max;
    
    const height = 220;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingY = 30;
    const chartWidth = 600 - paddingLeft - paddingRight;
    const chartHeight = height - 2 * paddingY;
    
    const n = this.recentCyclesData.length;
    const spacing = chartWidth / (n || 1);
    
    // Grouped bar widths
    const singleBarW = n === 2 ? 40 : (n === 7 ? 14 : 16);
    const gap = 3;
    const groupW = singleBarW * 2 + gap;
    
    this.recentCyclesBars = [];
    this.recentCyclesTicks = [];
    
    this.recentCyclesData.forEach((b, i) => {
      const revH = (b.revenue / max) * chartHeight;
      const revX = paddingLeft + i * spacing + (spacing - groupW) / 2;
      const revY = height - paddingY - revH;
      
      // Revenue bar
      this.recentCyclesBars.push({
        x: revX,
        y: revY,
        w: singleBarW,
        h: revH,
        value: b.revenue,
        color: 'var(--primary)',
        label: b.label,
        fullRangeLabel: `${b.fullRangeLabel} (Doanh thu)`
      });
      
      // Profit bar
      const profH = (b.profit / max) * chartHeight;
      const profX = revX + singleBarW + gap;
      const profY = height - paddingY - profH;
      
      this.recentCyclesBars.push({
        x: profX,
        y: profY,
        w: singleBarW,
        h: profH,
        value: b.profit,
        color: 'var(--secondary)',
        label: b.label,
        fullRangeLabel: `${b.fullRangeLabel} (Lợi nhuận)`
      });
      
      this.recentCyclesTicks.push({
        x: paddingLeft + i * spacing + spacing / 2,
        label: b.label
      });
    });
  }

  calculateDonutSegments(dataList: any[], valueField: string, colorField: string = 'color'): any[] {
    const total = dataList.reduce((sum, item) => sum + (item[valueField] || 0), 0);
    if (total === 0) return [];

    let accumulatedPercent = 0;
    const circ = 251.32; // Circumference of radius 40 circle

    return dataList.map(item => {
      const val = item[valueField] || 0;
      const percent = (val / total) * 100;
      const strokeLength = (percent / 100) * circ;
      const offset = -((accumulatedPercent / 100) * circ);
      
      accumulatedPercent += percent;

      return {
        item: item,
        percent: percent,
        strokeDashArray: `${strokeLength} ${circ}`,
        strokeDashOffset: offset,
        color: item[colorField] || '#ccc'
      };
    });
  }

  selectPaymentSegment(seg: any) {
    if (this.selectedPaymentSeg === seg) {
      this.selectedPaymentSeg = null;
    } else {
      this.selectedPaymentSeg = seg;
    }
    this.cdr.detectChanges();
  }

  selectCategorySegment(seg: any) {
    if (this.selectedCategorySeg === seg) {
      this.selectedCategorySeg = null;
    } else {
      this.selectedCategorySeg = seg;
    }
    this.cdr.detectChanges();
  }

  isTabActive(tabName: string): boolean {
    return this.activeTab === tabName;
  }
}
