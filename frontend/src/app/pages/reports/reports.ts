import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, RouterModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {}
