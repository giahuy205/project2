import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-staff',
  imports: [CommonModule, RouterModule],
  templateUrl: './staff.html',
  styleUrl: './staff.css',
})
export class Staff {}
