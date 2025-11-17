import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProfileService } from '../../core/services/profile.service';
import { PatientProfile } from '../../core/models/user-profile.model';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);

  readonly profile = signal<PatientProfile | null>(null);
  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.authService.user()?.uid ?? null);

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
}
