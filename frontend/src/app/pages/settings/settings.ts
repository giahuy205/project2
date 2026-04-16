import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {}
