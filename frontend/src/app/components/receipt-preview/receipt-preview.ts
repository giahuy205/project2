import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-receipt-preview',
  imports: [CommonModule, RouterModule],
  templateUrl: './receipt-preview.html',
  styleUrl: './receipt-preview.css',
})
export class ReceiptPreview {}
