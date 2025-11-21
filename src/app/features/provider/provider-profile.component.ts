import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProfileService } from '../../core/services/profile.service';
import { ProviderProfile } from '../../core/models/user-profile.model';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-profile.component.html',
  styleUrls: ['./provider-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly context = inject(ContextService);
  private readonly router = inject(Router);

  readonly profile = signal<ProviderProfile | null>(null);
  readonly displayEmail = computed(() => this.authService.user()?.email ?? '');

  constructor() {
    effect((onCleanup) => {
      const uid = this.authService.user()?.uid;
      if (!uid) {
        this.profile.set(null);
        return;
      }
      const sub = this.profileService.listenToProfile(uid).subscribe((profile) => this.profile.set(profile as ProviderProfile));
      onCleanup(() => sub.unsubscribe());
    });
  }

  async logout() {
    await this.authService.signOut();
    this.context.setRole('patient');
    this.context.exitViewAs();
    await this.router.navigate(['/auth']);
  }
}
