import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-modal',
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-modal.html',
  styleUrl: './payment-modal.css',
})
export class PaymentModal {}
