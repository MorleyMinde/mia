import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './patient-shell.component.html',
  styleUrls: ['./patient-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly context = inject(ContextService);

  readonly navItems = [
    { label: 'Today', icon: '🟢', path: '/patient' },
    { label: 'History', icon: '📅', path: '/patient/history' },
    { label: 'Insights', icon: '💡', path: '/patient/insights' },
    { label: 'Profile', icon: '🙂', path: '/patient/profile' }
  ];

  readonly userInitial = computed(() => (this.authService.user()?.displayName?.[0] || 'U').toUpperCase());

  goToProfile() {
    this.router.navigate(['/patient/profile']);
  }
}
