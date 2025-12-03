import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HealthEntry } from '../../core/models/daily-entry.model';
import { Condition, PatientProfile, PatientThresholds } from '../../core/models/user-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { EntryService } from '../../core/services/entry.service';
import { HealthRulesService } from '../../core/services/health-rules.service';
import { ProfileService } from '../../core/services/profile.service';

const defaultThresholds: PatientThresholds = {
  bpSysHigh: 140,
  bpDiaHigh: 90,
  bpSysVeryHigh: 180,
  bpDiaVeryHigh: 120,
  glucoseFastingHigh: 7,
  glucoseRandomHigh: 10,
  glucoseVeryHigh: 13,
  glucoseLow: 3.9
};

@Component({
  selector: 'app-patient-record',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './patient-record.component.html',
  styleUrls: ['./patient-record.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRecordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly entryService = inject(EntryService);
  private readonly healthRules = inject(HealthRulesService);
  private readonly context = inject(ContextService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);

  readonly status = signal<'idle' | 'saving' | 'error' | 'success'>('idle');
  readonly errorMessage = signal<string | null>(null);
  
  // Patient profile data
  readonly patientProfile = signal<PatientProfile | null>(null);
  readonly patientConditions = computed(() => this.patientProfile()?.conditions ?? []);
  readonly patientThresholds = computed(() => this.patientProfile()?.thresholds ?? defaultThresholds);
  
  // Track which sections are expanded
  readonly expandedSections = signal<Set<string>>(new Set(['bp']));

  // Track selected medications and herbs
  readonly selectedMeds = signal<string[]>([]);
  readonly selectedHerbs = signal<string[]>([]);
  
  // Track previously used items (loaded from user's history)
  readonly previousMeds = signal<string[]>([]);
  readonly previousHerbs = signal<string[]>([]);
  
  // Input for adding new items
  readonly newMedInput = signal<string>('');
  readonly newHerbInput = signal<string>('');

  readonly form = this.fb.group({
    date: [this.todayString(), Validators.required],
    time: [this.currentTimeString(), Validators.required],
    bp: this.fb.group({
      sys: [null as number | null],
      dia: [null as number | null]
    }),
    glucose: this.fb.group({
      mmol: [null as number | null],
      context: ['random']
    }),
    medsTaken: [false],
    food: this.fb.group({
      salt: [3],
      carb: [3],
      notes: ['']
    }),
    exercise: this.fb.group({ minutes: [0] }),
    alcohol: [0],
    cigarettes: [0],
    notes: ['']
  });

  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.auth.user()?.uid ?? null);
  readonly creatorRole = computed(() => this.context.context().currentRole);
  
  // Autocomplete suggestions that appear as user types (after 2 characters)
  readonly medSuggestions = computed(() => {
    const input = this.newMedInput().trim().toLowerCase();
    if (input.length < 2) return [];
    
    return this.previousMeds()
      .filter(med => 
        !this.selectedMeds().includes(med) && 
        med.toLowerCase().includes(input)
      )
      .slice(0, 5); // Show max 5 suggestions
  });
  
  readonly herbSuggestions = computed(() => {
    const input = this.newHerbInput().trim().toLowerCase();
    if (input.length < 2) return [];
    
    return this.previousHerbs()
      .filter(herb => 
        !this.selectedHerbs().includes(herb) && 
        herb.toLowerCase().includes(input)
      )
      .slice(0, 5); // Show max 5 suggestions
  });

  constructor() {
    // Load patient profile to get conditions and thresholds
    effect((onCleanup) => {
      const patientId = this.activePatientId();
      if (!patientId) {
        this.patientProfile.set(null);
        return;
      }
      
      const profileSub = this.profileService.listenToProfile(patientId).subscribe(profile => {
        if (profile && profile.role === 'patient') {
          this.patientProfile.set(profile);
        } else {
          this.patientProfile.set(null);
        }
      });
      
      onCleanup(() => profileSub.unsubscribe());
    });

    // Load previous medications and herbs from user's entry history
    effect((onCleanup) => {
      const patientId = this.activePatientId();
      if (!patientId) return;
      
      const sub = this.entryService.listenToEntries(patientId).subscribe(entries => {
        // Extract unique meds and herbs from history
        const allMeds = new Set<string>();
        const allHerbs = new Set<string>();
        
        entries.forEach(entry => {
          entry.meds?.names?.forEach(med => allMeds.add(med));
          entry.herbs?.forEach(herb => allHerbs.add(herb));
        });
        
        this.previousMeds.set(Array.from(allMeds).sort());
        this.previousHerbs.set(Array.from(allHerbs).sort());
      });
      
      onCleanup(() => sub.unsubscribe());
    });
  }

  toggleSection(section: string) {
    const expanded = this.expandedSections();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    this.expandedSections.set(newExpanded);
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections().has(section);
  }

  // Medication management
  addMed(medName: string) {
    const trimmed = medName.trim();
    if (!trimmed || this.selectedMeds().includes(trimmed)) return;
    
    this.selectedMeds.update(meds => [...meds, trimmed]);
    this.newMedInput.set('');
  }

  removeMed(medName: string) {
    this.selectedMeds.update(meds => meds.filter(m => m !== medName));
  }

  selectMedFromSuggestion(medName: string) {
    this.addMed(medName);
    this.newMedInput.set(''); // Clear input after selection
  }

  // Herb management
  addHerb(herbName: string) {
    const trimmed = herbName.trim();
    if (!trimmed || this.selectedHerbs().includes(trimmed)) return;
    
    this.selectedHerbs.update(herbs => [...herbs, trimmed]);
    this.newHerbInput.set('');
  }

  removeHerb(herbName: string) {
    this.selectedHerbs.update(herbs => herbs.filter(h => h !== herbName));
  }

  selectHerbFromSuggestion(herbName: string) {
    this.addHerb(herbName);
    this.newHerbInput.set(''); // Clear input after selection
  }

  cancel() {
    // Check if user has entered any data
    const hasData = this.hasFormData();
    
    // If there's data, confirm before canceling
    if (hasData) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) {
        return;
      }
    }
    
    // Navigate back based on current role
    const currentRole = this.creatorRole();
    if (currentRole === 'provider') {
      this.router.navigate(['/provider/dashboard']);
    } else {
      this.router.navigate(['/patient']);
    }
  }

  private hasFormData(): boolean {
    const raw = this.form.getRawValue();
    return !!(
      (raw.bp?.sys != null || raw.bp?.dia != null) ||
      raw.glucose?.mmol != null ||
      this.selectedMeds().length > 0 ||
      raw.food?.notes ||
      (raw.food?.salt !== 3) ||
      (raw.food?.carb !== 3) ||
      (raw.exercise?.minutes && raw.exercise.minutes > 0) ||
      (raw.alcohol && raw.alcohol > 0) ||
      (raw.cigarettes && raw.cigarettes > 0) ||
      this.selectedHerbs().length > 0 ||
      raw.notes
    );
  }

  async save() {
    if (this.form.invalid || !this.activePatientId()) {
      this.form.markAllAsTouched();
      return;
    }

    // Check if at least one health metric is provided
    const raw = this.form.getRawValue();
    const hasData = 
      (raw.bp?.sys != null && raw.bp?.dia != null) ||
      raw.glucose?.mmol != null ||
      this.selectedMeds().length > 0 ||
      raw.food?.notes ||
      (raw.exercise?.minutes && raw.exercise.minutes > 0) ||
      (raw.alcohol && raw.alcohol > 0) ||
      (raw.cigarettes && raw.cigarettes > 0) ||
      this.selectedHerbs().length > 0 ||
      raw.notes;

    if (!hasData) {
      this.errorMessage.set('Please enter at least one health metric');
      return;
    }

    this.status.set('saving');
    this.errorMessage.set(null);

    try {
      // Combine date and time into a timestamp
      const dateStr = raw.date ?? this.todayString();
      const timeStr = raw.time ?? this.currentTimeString();
      const timestamp = this.createTimestamp(dateStr, timeStr);

      const bp =
        raw.bp && raw.bp.sys != null && raw.bp.dia != null
          ? {
              sys: Number(raw.bp.sys),
              dia: Number(raw.bp.dia)
            }
          : undefined;
      const glucose =
        raw.glucose && raw.glucose.mmol != null
          ? {
              mmol: Number(raw.glucose.mmol),
              context: (raw.glucose.context ?? 'random') as 'fasting' | 'random'
            }
          : undefined;
      const food = raw.food?.notes || (raw.food?.salt !== 3) || (raw.food?.carb !== 3)
        ? {
            salt: (raw.food.salt ?? 3) as 1 | 2 | 3 | 4 | 5,
            carb: (raw.food.carb ?? 3) as 1 | 2 | 3 | 4 | 5,
            notes: raw.food.notes || undefined
          }
        : undefined;
      const exercise =
        raw.exercise && raw.exercise.minutes != null && raw.exercise.minutes > 0 
          ? { minutes: Number(raw.exercise.minutes) } 
          : undefined;

      const entry: HealthEntry = {
        timestamp,
        bp,
        glucose,
        meds: this.selectedMeds().length > 0 ? {
          taken: raw.medsTaken ?? false,
          names: this.selectedMeds()
        } : undefined,
        food,
        exercise,
        alcohol: raw.alcohol != null && raw.alcohol > 0 ? Number(raw.alcohol) : undefined,
        cigarettes: raw.cigarettes != null && raw.cigarettes > 0 ? Number(raw.cigarettes) : undefined,
        herbs: this.selectedHerbs().length > 0 ? this.selectedHerbs() : undefined,
        notes: raw.notes ?? undefined,
        status: 'green',
        statusReasons: [],
        riskScore: 0,
        actions: [],
        createdByRole: this.creatorRole(),
        createdByUid: this.auth.user()?.uid ?? 'anonymous',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const thresholds = this.patientThresholds();
      const conditions = this.patientConditions();
      
      const statusResult = this.healthRules.computeStatus(entry, thresholds, conditions);
      entry.status = statusResult.status;
      entry.statusReasons = statusResult.reasons;
      entry.riskScore = this.healthRules.computeRiskScore(entry, thresholds, conditions);
      entry.actions = this.healthRules.generateActions(entry, statusResult, conditions, thresholds);

      console.log('=== SAVING ENTRY ===');
      console.log('Patient ID:', this.activePatientId());
      console.log('Entry object:', JSON.stringify(entry, null, 2));
      console.log('Timestamp:', entry.timestamp);
      console.log('Timestamp ISO:', entry.timestamp.toISOString());
      console.log('Timestamp valid?', !isNaN(entry.timestamp.getTime()));
      
      await this.entryService.saveEntry(this.activePatientId()!, entry);
      
      console.log('✅ Entry saved successfully to Firestore');
      this.status.set('success');
      
      // Give Firestore a moment to propagate before navigating
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate based on role
      if (this.creatorRole() === 'provider') {
        console.log('Navigating to /provider/dashboard');
        await this.router.navigate(['/provider/dashboard']);
      } else {
        console.log('Navigating to /patient');
        await this.router.navigate(['/patient']);
      }
    } catch (error: any) {
      console.error('Error saving entry:', error);
      this.status.set('error');
      this.errorMessage.set(error?.message ?? 'Unable to save entry');
    }
  }

  private todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private currentTimeString(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // HH:MM
  }

  private createTimestamp(dateStr: string, timeStr: string): Date {
    return new Date(`${dateStr}T${timeStr}:00`);
  }
}
