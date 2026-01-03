import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-provider-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, TranslateModule, LanguageSwitcherComponent],
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

  // Provider navigation items
  readonly navItems = [
    { label: 'provider.patients', icon: '👥', path: '/provider' },
    { label: 'provider.registerPatient', icon: '➕', path: '/provider/register-patient' },
    //{ label: 'auth.profile', icon: '🙂', path: '/provider/profile' }
  ];

  exitViewAs() {
    this.context.exitViewAs();
    this.router.navigate(['/provider']);
  }

  async logout() {
    await this.authService.signOut();
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
    // List panel is no longer used in the shell layout
    return false;
  }

  backToList() {
    this.context.exitViewAs();
    this.router.navigate(['/provider']);
  }
}
