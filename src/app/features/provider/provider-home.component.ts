import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-provider-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-home.component.html',
  styleUrls: ['./provider-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderHomeComponent {}
