import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProfileService } from '../../core/services/profile.service';
import { LanguageService } from '../../core/services/language.service';
import { LanguageCode, ProviderProfile } from '../../core/models/user-profile.model';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './provider-profile.component.html',
  styleUrls: ['./provider-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly context = inject(ContextService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly languageService = inject(LanguageService);

  readonly profile = signal<ProviderProfile | null>(null);
  readonly displayEmail = computed(() => this.authService.user()?.email ?? '');
  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);

  readonly profileForm: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    phone: [''],
    lang: ['en' as LanguageCode, Validators.required],
    facilityName: [''],
    providerType: ['']
  });

  constructor() {
    effect((onCleanup) => {
      const uid = this.authService.user()?.uid;
      if (!uid) {
        this.profile.set(null);
        return;
      }
      const sub = this.profileService.listenToProfile(uid).subscribe((profile) => {
        const providerProfile = profile as ProviderProfile;
        this.profile.set(providerProfile);
        // Update form when profile changes (but only if not in edit mode)
        if (!this.isEditMode() && providerProfile) {
          this.updateFormFromProfile(providerProfile);
        }
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  private updateFormFromProfile(profile: ProviderProfile) {
    this.profileForm.patchValue({
      displayName: profile.displayName || '',
      phone: profile.phone || '',
      lang: profile.lang || 'en',
      facilityName: profile.facilityName || '',
      providerType: profile.providerType || ''
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
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const uid = this.authService.user()?.uid;
    if (!uid) {
      return;
    }

    this.isSaving.set(true);
    try {
      const formValue = this.profileForm.getRawValue();
      await this.profileService.updatePartial(uid, {
        displayName: formValue.displayName,
        phone: formValue.phone || undefined,
        lang: formValue.lang,
        facilityName: formValue.facilityName || undefined,
        providerType: formValue.providerType || undefined
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
    await this.authService.signOut();
    this.context.exitViewAs();
    await this.router.navigate(['/auth']);
  }
}
