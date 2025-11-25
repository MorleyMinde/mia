import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProviderPatientsComponent } from './provider-patients.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-provider-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, ProviderPatientsComponent, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './provider-shell.component.html',
  styleUrls: ['./provider-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderShellComponent {
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly screenWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1024);
  readonly isDesktop = computed(() => this.screenWidth() >= 1024);

  readonly viewingPatientId = computed(() => this.context.context().actingAsPatientId);
  readonly hasActivePatient = computed(() => !!this.viewingPatientId());

  readonly navItems = [
    { label: 'Patients', path: '/provider', icon: '👥' },
    { label: 'Today', path: '/provider/today', icon: '🩺', requiresPatient: true },
    { label: 'Record', path: '/provider/record', icon: '✍️', requiresPatient: true },
    { label: 'History', path: '/provider/history', icon: '📅', requiresPatient: true },
    { label: 'Insights', path: '/provider/insights', icon: '📊', requiresPatient: true }
  ];

  exitViewAs() {
    this.context.exitViewAs();
    this.router.navigate(['/provider']);
  }

  async logout() {
    await this.authService.signOut();
    this.context.setRole('patient');
    this.context.exitViewAs();
    await this.router.navigate(['/auth']);
  }

  readonly userInitial = computed(() => (this.authService.user()?.displayName?.[0] || 'U').toUpperCase());

  goToProfile() {
    this.router.navigate(['/provider/profile']);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    const target = event.target as Window;
    this.screenWidth.set(target.innerWidth);
  }

  showListPanel(): boolean {
    // Show list only when no patient is selected
    // Once a patient is selected, hide the list on all screen sizes
    return !this.hasActivePatient();
  }

  showDetailPanel(): boolean {
    // Show details only when a patient is selected
    return this.hasActivePatient();
  }

  backToList() {
    this.context.exitViewAs();
    this.router.navigate(['/provider']);
  }
}
