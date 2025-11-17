import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './patient-shell.component.html',
  styleUrls: ['./patient-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientShellComponent {
  readonly navItems = [
    { label: 'Today', icon: '🟢', path: '/patient' },
    { label: 'History', icon: '📅', path: '/patient/history' },
    { label: 'Insights', icon: '💡', path: '/patient/insights' },
    { label: 'Profile', icon: '🙂', path: '/patient/profile' }
  ];
}
