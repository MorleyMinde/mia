import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PatientProfile } from '../../core/models/user-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProfileService } from '../../core/services/profile.service';
import { ProviderService } from '../../core/services/provider.service';

@Component({
  selector: 'app-provider-patients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './provider-patients.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderPatientsComponent {
  private readonly providerService = inject(ProviderService);
  private readonly profileService = inject(ProfileService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly patients = signal<PatientProfile[]>([]);
  readonly filter = this.fb.control('');
  readonly shareCodeControl = this.fb.control('');
  readonly status = signal<'idle' | 'linking' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly providerId = computed(() => this.authService.user()?.uid ?? null);
  readonly filteredPatients = computed(() => {
    const term = this.filter.value?.toLowerCase?.() ?? '';
    if (!term) return this.patients();
    return this.patients().filter((patient) => patient.displayName.toLowerCase().includes(term) || patient.shareCode?.toLowerCase().includes(term));
  });

  constructor() {
    effect((onCleanup) => {
      const providerId = this.providerId();
      if (!providerId) {
        this.patients.set([]);
        return;
      }
      const sub = this.providerService.listenToLinkedPatients(providerId).subscribe(async (links) => {
        const profiles = await Promise.all(
          links.map((link) => firstValueFrom(this.profileService.listenToProfile(link.patientId)))
        );
        this.patients.set(profiles.filter((profile): profile is PatientProfile => !!profile && profile.role === 'patient'));
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  async addByShareCode() {
    if (!this.shareCodeControl.value || !this.providerId()) {
      return;
    }
    this.status.set('linking');
    this.errorMessage.set(null);
    try {
      await this.providerService.linkPatientByShareCode(this.providerId()!, this.shareCodeControl.value.trim().toUpperCase());
      this.shareCodeControl.reset('');
      this.status.set('idle');
    } catch (error: any) {
      this.status.set('error');
      this.errorMessage.set(error?.message ?? 'Unable to link patient');
    }
  }

  viewAs(patient: PatientProfile) {
    this.context.viewAsPatient(patient.uid);
  }
}
