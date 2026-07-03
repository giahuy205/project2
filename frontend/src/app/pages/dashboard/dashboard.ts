import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  todayRevenue = 0;
  todayOrders = 0;
  lowStockCount = 0;
  pendingImportsCount = 0;
  topProduct = 'Đang tải...';
  recentOrders: any[] = [];
  revenueTrend: any[] = [];

  chartMaxVal = 1000;
  chartYGrid: number[] = [];
  revenuePointsArray: { x: number, y: number, value: number, label: string }[] = [];
  revenuePath = '';
  revenueAreaPath = '';
  chartTicks: { x: number, label: string }[] = [];

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<any>('/api/dashboard/stats').subscribe({
      next: (res) => {
        this.todayRevenue = res.todayRevenue || 0;
        this.todayOrders = res.todayOrders || 0;
        this.lowStockCount = res.lowStockCount || 0;
        this.pendingImportsCount = res.pendingImportsCount || 0;
        this.topProduct = res.topProduct || 'Chưa có';
        this.recentOrders = res.recentOrders || [];
        this.revenueTrend = res.revenueTrend || [];
        this.generateSvgPoints();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
      }
    });
  }

  getSplinePath(points: { x: number, y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    const n = points.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p1.x - (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return path;
  }

  generateSvgPoints() {
    const width = 600;
    const height = 250;
    const paddingX = 50;
    const paddingY = 30;
    
    if (this.revenueTrend.length === 0) {
      this.chartMaxVal = 1000;
      this.revenuePointsArray = [];
      this.revenuePath = '';
      this.revenueAreaPath = '';
      this.chartTicks = [];
      this.chartYGrid = [height - paddingY, paddingY];
      return;
    }

    const revenues = this.revenueTrend.map(d => d.revenue);
    let max = Math.max(...revenues);
    if (max === 0) max = 1000;
    this.chartMaxVal = max;

    const chartWidth = width - 2 * paddingX;
    const chartHeight = height - 2 * paddingY;

    this.chartYGrid = [
      height - paddingY,
      height - paddingY - chartHeight * 0.33,
      height - paddingY - chartHeight * 0.66,
      paddingY
    ];

    const n = this.revenueTrend.length;
    this.chartTicks = [];
    let pointsList: { x: number, y: number, value: number, label: string }[] = [];

    this.revenueTrend.forEach((d, i) => {
      const x = paddingX + (n > 1 ? (i / (n - 1)) * chartWidth : chartWidth / 2);
      const yVal = height - paddingY - (d.revenue / max) * chartHeight;
      pointsList.push({ x, y: yVal, value: d.revenue, label: d.dateLabel });
      this.chartTicks.push({ x, label: d.dateLabel });
    });

    const bottomY = height - paddingY;
    const pathStr = this.getSplinePath(pointsList);
    let areaPathStr = '';
    if (pointsList.length > 0) {
      const startX = pointsList[0].x;
      const endX = pointsList[pointsList.length - 1].x;
      areaPathStr = `${pathStr} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
    }

    this.revenuePointsArray = pointsList;
    this.revenuePath = pathStr;
    this.revenueAreaPath = areaPathStr;
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
