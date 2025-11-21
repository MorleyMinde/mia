import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProfileService } from '../../core/services/profile.service';
import { Condition, LanguageCode, PatientProfile, ProviderProfile, UserRole } from '../../core/models/user-profile.model';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AsyncPipe],
  templateUrl: './auth-shell.component.html',
  styleUrls: ['./auth-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthShellComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly contextService = inject(ContextService);
  private readonly router = inject(Router);

  readonly selectedRole = signal<UserRole>('patient');
  readonly mode = signal<'signin' | 'signup'>('signin');
  readonly status = signal<'idle' | 'loading' | 'error' | 'success'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly showAdvanced = signal(false);

  readonly onboardingForm: FormGroup = this.fb.group({
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    language: ['en' as LanguageCode, Validators.required],
    phone: [''],
    yearOfBirth: [''],
    conditions: this.fb.group({
      hypertension: [false],
      diabetes: [false]
    }),
    shareCode: [{ value: '', disabled: true }]
  });

  constructor() {
    effect(() => {
      const isPatientSignup = this.selectedRole() === 'patient' && this.mode() === 'signup';
      if (isPatientSignup) {
        const shareCode = this.profileService.generateShareCode();
        this.onboardingForm.patchValue({ shareCode });
      }

      const displayNameControl = this.onboardingForm.get('displayName');
      if (displayNameControl) {
        if (this.mode() === 'signup') {
          displayNameControl.setValidators([Validators.required, Validators.minLength(2)]);
        } else {
          displayNameControl.clearValidators();
        }
        displayNameControl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  selectRole(role: UserRole) {
    this.selectedRole.set(role);
  }

  toggleMode() {
    this.mode.set(this.mode() === 'signup' ? 'signin' : 'signup');
  }

  async submit() {
    if (this.mode() === 'signup' && this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    this.status.set('loading');
    this.errorMessage.set(null);

    try {
      const { email, password, displayName } = this.onboardingForm.getRawValue();
      const user = this.mode() === 'signup'
        ? await firstValueFrom(this.authService.signUpWithEmail(displayName, email, password))
        : await firstValueFrom(this.authService.signInWithEmail(email, password));

      if (this.mode() === 'signup') {
        await this.persistProfile(user.uid);
      }

      this.contextService.setRole(this.selectedRole());
      await this.router.navigate([this.selectedRole() === 'patient' ? '/patient' : '/provider']);
      this.status.set('success');
    } catch (error: any) {
      console.error(error);
      this.status.set('error');
      this.errorMessage.set(this.toHumanError(error));
    }
  }

  async continueWithGoogle() {
    this.status.set('loading');
    try {
      const user = await firstValueFrom(this.authService.signInWithGoogle());
      if (this.mode() === 'signup') {
        await this.persistProfile(user.uid);
      }
      this.contextService.setRole(this.selectedRole());
      await this.router.navigate([this.selectedRole() === 'patient' ? '/patient' : '/provider']);
      this.status.set('success');
    } catch (error: any) {
      console.error(error);
      this.status.set('error');
      this.errorMessage.set(this.toHumanError(error));
    }
  }

  private async persistProfile(uid: string) {
    const raw = this.onboardingForm.getRawValue();
    const timestamp = new Date();
    if (this.selectedRole() === 'patient') {
      const patientProfile: PatientProfile = {
        uid,
        role: 'patient',
        displayName: raw.displayName,
        displayNameLower: raw.displayName.toLowerCase(),
        lang: raw.language,
        phone: raw.phone ?? undefined,
        shareCode: raw.shareCode,
        yearOfBirth: raw.yearOfBirth ? Number(raw.yearOfBirth) : undefined,
        conditions: this.extractConditions(raw.conditions),
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await this.profileService.upsertProfile(patientProfile);
    } else {
      const providerProfile: ProviderProfile = {
        uid,
        role: 'provider',
        displayName: raw.displayName,
        displayNameLower: raw.displayName.toLowerCase(),
        lang: raw.language,
        phone: raw.phone ?? undefined,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await this.profileService.upsertProfile(providerProfile);
    }
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
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email or password is incorrect. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try signing in instead.';
      case 'auth/network-request-failed':
        return 'Network error. Check your internet connection and try again.';
      default:
        return error?.message ?? 'Something went wrong. Please try again.';
    }
  }
}
