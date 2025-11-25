import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProfileService } from '../../core/services/profile.service';
import { PatientProfile } from '../../core/models/user-profile.model';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly profile = signal<PatientProfile | null>(null);
  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.authService.user()?.uid ?? null);
  readonly canLogout = computed(() => this.context.currentRole() === 'patient');

  constructor() {
    effect((onCleanup) => {
      const uid = this.activePatientId();
      if (!uid) {
        this.profile.set(null);
        return;
      }
      const sub = this.profileService.listenToProfile(uid).subscribe((profile) => this.profile.set(profile as PatientProfile));
      onCleanup(() => sub.unsubscribe());
    });
  }

  async logout() {
    if (!this.canLogout()) {
      return;
    }
    await this.authService.signOut();
    this.context.setRole('patient');
    await this.router.navigate(['/auth']);
  }
}
