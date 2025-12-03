import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Condition, LanguageCode, PatientProfile } from '../../core/models/user-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ProviderService } from '../../core/services/provider.service';

@Component({
  selector: 'app-provider-register-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './provider-register-patient.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderRegisterPatientComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly providerService = inject(ProviderService);
  private readonly router = inject(Router);

  readonly status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly createdPatient = signal<{ uid: string; email: string; password: string; shareCode: string } | null>(null);

  readonly registrationForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    language: ['en' as LanguageCode, Validators.required],
    phone: [''],
    yearOfBirth: [''],
    conditions: this.fb.group({
      hypertension: [false],
      diabetes: [false]
    })
  });

  get providerId(): string | null {
    return this.authService.user()?.uid ?? null;
  }

  async submit() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const providerId = this.providerId;
    if (!providerId) {
      this.errorMessage.set('Provider not authenticated');
      return;
    }

    this.status.set('loading');
    this.errorMessage.set(null);

    try {
      const raw = this.registrationForm.getRawValue();
      const shareCode = this.profileService.generateShareCode();
      
      // Store provider email for re-authentication
      const providerEmail = this.authService.user()?.email;
      
      // Create patient account (this will sign out the provider)
      const user = await this.authService.createPatientAccount(
        raw.displayName,
        raw.email,
        raw.password
      );

      // Create patient profile
      const timestamp = new Date();
      const patientProfile: PatientProfile = {
        uid: user.uid,
        role: 'patient',
        displayName: raw.displayName,
        displayNameLower: raw.displayName.toLowerCase(),
        lang: raw.language,
        phone: raw.phone || undefined,
        shareCode,
        yearOfBirth: raw.yearOfBirth ? Number(raw.yearOfBirth) : undefined,
        conditions: this.extractConditions(raw.conditions),
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await this.profileService.upsertProfile(patientProfile);

      // Link patient to provider (using stored providerId)
      await this.providerService.linkPatient(providerId, user.uid);

      // Store created patient info for display
      this.createdPatient.set({
        uid: user.uid,
        email: raw.email,
        password: raw.password,
        shareCode
      });

      this.status.set('success');
      
      // Note: Provider is now signed out. They'll need to sign back in.
      // In production, use Firebase Admin SDK via Cloud Function to avoid this issue.
    } catch (error: any) {
      console.error('Error registering patient:', error);
      this.status.set('error');
      this.errorMessage.set(this.toHumanError(error));
    }
  }

  async viewPatient() {
    const patient = this.createdPatient();
    if (patient) {
      // Note: Provider is signed out, so they'll need to sign back in first
      // For now, redirect to auth
      this.router.navigate(['/auth']);
    }
  }

  async registerAnother() {
    this.registrationForm.reset();
    this.status.set('idle');
    this.errorMessage.set(null);
    this.createdPatient.set(null);
  }

  cancel() {
    this.router.navigate(['/provider']);
  }

  private extractConditions(group: { [key: string]: any }): Condition[] {
    const result: Condition[] = [];
    if (group['hypertension']) {
      result.push('hypertension');
    }
    if (group['diabetes']) {
      result.push('diabetes');
    }
    return result;
  }

  private toHumanError(error: any): string {
    const code = error?.code ?? '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check and try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Check your internet connection and try again.';
      default:
        return error?.message ?? 'Something went wrong. Please try again.';
    }
  }
}

