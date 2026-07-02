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
  topProduct = 'Đang tải...';
  recentOrders: any[] = [];
  revenueTrend: any[] = [];

  svgPoints = '0,30 20,25 40,35 60,15 80,20 100,5'; // default fallback points
  svgPath = 'M 0 35 L 100 35';
  svgAreaPath = 'M 0 35 L 100 35 L 100 35 L 0 35 Z';

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<any>('/api/dashboard/stats').subscribe({
      next: (res) => {
        this.todayRevenue = res.todayRevenue || 0;
        this.todayOrders = res.todayOrders || 0;
        this.lowStockCount = res.lowStockCount || 0;
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

  generateSvgPoints() {
    if (this.revenueTrend.length === 0) {
      this.svgPoints = '0,35 100,35';
      this.svgPath = 'M 0 35 L 100 35';
      this.svgAreaPath = 'M 0 35 L 100 35 L 100 35 L 0 35 Z';
      return;
    }

    const revenues = this.revenueTrend.map(d => d.revenue);
    const maxRev = Math.max(...revenues, 1000);

    const points: string[] = [];
    const pts: { x: number; y: number }[] = [];
    const count = this.revenueTrend.length;
    for (let i = 0; i < count; i++) {
      const x = (i * 100) / (count - 1 || 1);
      const y = 35 - ((this.revenueTrend[i].revenue / maxRev) * 30);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      pts.push({ x, y });
    }
    this.svgPoints = points.join(' ');

    if (count > 1) {
      let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < count - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 3;
        const cp1y = p0.y;
        const cp2x = p1.x - (p1.x - p0.x) / 3;
        const cp2y = p1.y;
        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
      this.svgPath = path;
      this.svgAreaPath = `${path} L ${pts[count - 1].x.toFixed(1)} 35 L ${pts[0].x.toFixed(1)} 35 Z`;
    } else {
      this.svgPath = `M 0 ${pts[0].y.toFixed(1)} L 100 ${pts[0].y.toFixed(1)}`;
      this.svgAreaPath = `M 0 ${pts[0].y.toFixed(1)} L 100 ${pts[0].y.toFixed(1)} L 100 35 L 0 35 Z`;
    }
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
