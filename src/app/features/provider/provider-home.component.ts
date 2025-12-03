import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ProviderPatientsComponent } from './provider-patients.component';

@Component({
  selector: 'app-provider-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, ProviderPatientsComponent],
  templateUrl: './provider-home.component.html',
  styleUrls: ['./provider-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderHomeComponent {}
