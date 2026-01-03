import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './patient-shell.component.html',
  styleUrls: ['./patient-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly context = inject(ContextService);

  // My Health section navigation
  readonly myHealthNavItems = [
    { label: 'patient.today', icon: '🟢', path: '/patient', section: 'my-health' },
    { label: 'patient.record', icon: '✍️', path: '/patient/record', section: 'my-health' },
    { label: 'patient.history', icon: '📅', path: '/patient/history', section: 'my-health' },
    { label: 'patient.insights', icon: '💡', path: '/patient/insights', section: 'my-health' },
    { label: 'auth.profile', icon: '🙂', path: '/patient/profile', section: 'my-health' }
  ];

  readonly navItems = this.myHealthNavItems;

  readonly userInitial = computed(() => (this.authService.user()?.displayName?.[0] || 'U').toUpperCase());

  goToProfile() {
    this.router.navigate(['/patient/profile']);
  }
}
