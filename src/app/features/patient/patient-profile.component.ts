import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProfileService } from '../../core/services/profile.service';
import { LanguageService } from '../../core/services/language.service';
import { Condition, LanguageCode, PatientProfile } from '../../core/models/user-profile.model';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly languageService = inject(LanguageService);

  readonly profile = signal<PatientProfile | null>(null);
  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.authService.user()?.uid ?? null);
  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  
  // Can logout if viewing own profile (not a provider viewing a patient)
  readonly canLogout = computed(() => {
    const viewingPatientId = this.activePatientId();
    const currentUserId = this.authService.user()?.uid;
    return viewingPatientId === currentUserId;
  });

  // Can edit if viewing own profile
  readonly canEdit = computed(() => {
    const viewingPatientId = this.activePatientId();
    const currentUserId = this.authService.user()?.uid;
    return viewingPatientId === currentUserId;
  });

  readonly profileForm: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    phone: [''],
    lang: ['en' as LanguageCode, Validators.required],
    yearOfBirth: [null as number | null],
    conditions: this.fb.group({
      hypertension: [false],
      diabetes: [false]
    })
  });

  constructor() {
    effect((onCleanup) => {
      const uid = this.activePatientId();
      if (!uid) {
        this.profile.set(null);
        return;
      }
      const sub = this.profileService.listenToProfile(uid).subscribe((profile) => {
        const patientProfile = profile as PatientProfile;
        this.profile.set(patientProfile);
        // Update form when profile changes (but only if not in edit mode)
        if (!this.isEditMode() && patientProfile) {
          this.updateFormFromProfile(patientProfile);
        }
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  private updateFormFromProfile(profile: PatientProfile) {
    this.profileForm.patchValue({
      displayName: profile.displayName || '',
      phone: profile.phone || '',
      lang: profile.lang || 'en',
      yearOfBirth: profile.yearOfBirth || null,
      conditions: {
        hypertension: profile.conditions?.includes('hypertension') || false,
        diabetes: profile.conditions?.includes('diabetes') || false
      }
    });
  }

  startEdit() {
    const profile = this.profile();
    if (profile) {
      this.updateFormFromProfile(profile);
      this.isEditMode.set(true);
    }
  }

  cancelEdit() {
    const profile = this.profile();
    if (profile) {
      this.updateFormFromProfile(profile);
    }
    this.isEditMode.set(false);
  }

  async saveProfile() {
    if (this.profileForm.invalid || !this.canEdit()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const uid = this.activePatientId();
    if (!uid) {
      return;
    }

    this.isSaving.set(true);
    try {
      const formValue = this.profileForm.getRawValue();
      const conditions: Condition[] = [];
      if (formValue.conditions.hypertension) {
        conditions.push('hypertension');
      }
      if (formValue.conditions.diabetes) {
        conditions.push('diabetes');
      }

      await this.profileService.updatePartial(uid, {
        displayName: formValue.displayName,
        phone: formValue.phone || undefined,
        lang: formValue.lang,
        yearOfBirth: formValue.yearOfBirth || undefined,
        conditions: conditions.length > 0 ? conditions : undefined
      });

      // Update language service if language changed
      this.languageService.setLanguage(formValue.lang);

      this.isEditMode.set(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async logout() {
    if (!this.canLogout()) {
      return;
    }
    await this.authService.signOut();
    await this.router.navigate(['/auth']);
  }
}
