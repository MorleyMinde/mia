import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, switchMap, of } from 'rxjs';
import { PatientProfile } from '../../core/models/user-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { ProviderService } from '../../core/services/provider.service';

@Component({
  selector: 'app-provider-patients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './provider-patients.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderPatientsComponent {
  private readonly providerService = inject(ProviderService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly linkedPatients = signal<PatientProfile[]>([]);
  readonly searchResults = signal<PatientProfile[]>([]);
  readonly searchControl = this.fb.control('');
  readonly searching = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly providerId = computed(() => this.authService.user()?.uid ?? null);
  readonly displayedPatients = computed(() => {
    // If there's a search term, show search results
    // Otherwise show linked patients
    //const searchTerm = this.searchControl.value?.trim() || '';
    //return searchTerm.length >= 2 ? this.searchResults() : this.linkedPatients();
    return this.searchResults();
  });

  constructor() {
    // Load linked patients
    effect((onCleanup) => {
      const providerId = this.providerId();
      if (!providerId) {
        this.linkedPatients.set([]);
        return;
      }
      const sub = this.providerService.listenToLinkedPatients(providerId).subscribe(async (links) => {
        // For now, we'll keep this simple and just show linked patient IDs
        // In a real app, you'd want to load the full profiles
        this.linkedPatients.set([]);
      });
      onCleanup(() => sub.unsubscribe());
    });

    // Set up search with debounce using switchMap for proper observable handling
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap((searchTerm) => {
          console.log('Search term:', searchTerm);
          
          if (!searchTerm || searchTerm.trim().length < 2) {
            this.searchResults.set([]);
            this.searching.set(false);
            return of([]);
          }

          this.searching.set(true);
          this.errorMessage.set(null);
          return this.providerService.searchPatientsByName(searchTerm.trim());
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (results) => {
          console.log('Search results:', results);
          this.searchResults.set(results);
          this.searching.set(false);
        },
        error: (error: any) => {
          console.error('Search error:', error);
          this.errorMessage.set('Failed to search patients');
          this.searchResults.set([]);
          this.searching.set(false);
        }
      });
  }

  async selectPatient(patient: PatientProfile) {
    // Link the patient if not already linked
    if (this.providerId()) {
      try {
        await this.providerService.linkPatient(this.providerId()!, patient.uid);
      } catch (error) {
        console.error('Error linking patient:', error);
      }
    }

    // View as this patient - navigate with UID in URL
    this.context.viewAsPatient(patient.uid);
    this.router.navigate(['/provider/patient', patient.uid]);
  }

  registerPatient() {
    this.router.navigate(['/provider/register-patient']);
  }

  getAge(yearOfBirth: number): string {
    const currentYear = new Date().getFullYear();
    return `${currentYear - yearOfBirth} yrs`;
  }
}
