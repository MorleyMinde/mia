import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DailyEntry } from '../../core/models/daily-entry.model';
import { PatientThresholds } from '../../core/models/user-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { EntryService } from '../../core/services/entry.service';
import { HealthRulesService } from '../../core/services/health-rules.service';

const defaultThresholds: PatientThresholds = {
  bpSysHigh: 140,
  bpDiaHigh: 90,
  bpSysVeryHigh: 180,
  glucoseFastingHigh: 7,
  glucoseRandomHigh: 10,
  glucoseVeryHigh: 13,
  glucoseLow: 3.9
};

@Component({
  selector: 'app-patient-record',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  readonly status = signal<'idle' | 'saving' | 'error' | 'success'>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    date: [this.todayString(), Validators.required],
    bp: this.fb.group({
      sys: [null as number | null, Validators.required],
      dia: [null as number | null, Validators.required],
      time: ['']
    }),
    glucose: this.fb.group({
      mmol: [null as number | null],
      context: ['random'],
      time: ['']
    }),
    meds: this.fb.group({
      taken: [true],
      names: ['']
    }),
    food: this.fb.group({
      salt: [3],
      carb: [3],
      notes: ['']
    }),
    exercise: this.fb.group({ minutes: [0] }),
    alcohol: [0],
    cigarettes: [0],
    herbs: [''],
    notes: ['']
  });

  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.auth.user()?.uid ?? null);
  readonly creatorRole = computed(() => this.context.context().currentRole);

  async save() {
    if (this.form.invalid || !this.activePatientId()) {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('saving');
    this.errorMessage.set(null);

    try {
      const raw = this.form.getRawValue();
      const date = raw.date ?? this.todayString();
      const bp =
        raw.bp && raw.bp.sys != null && raw.bp.dia != null
          ? {
              sys: Number(raw.bp.sys),
              dia: Number(raw.bp.dia),
              time: raw.bp.time || undefined
            }
          : undefined;
      const glucose =
        raw.glucose && raw.glucose.mmol != null
          ? {
              mmol: Number(raw.glucose.mmol),
              context: (raw.glucose.context ?? 'random') as 'fasting' | 'random',
              time: raw.glucose.time || undefined
            }
          : undefined;
      const food = raw.food
        ? {
            salt: (raw.food.salt ?? 3) as 1 | 2 | 3 | 4 | 5,
            carb: (raw.food.carb ?? 3) as 1 | 2 | 3 | 4 | 5,
            notes: raw.food.notes || undefined
          }
        : undefined;
      const exercise =
        raw.exercise && raw.exercise.minutes != null ? { minutes: Number(raw.exercise.minutes) } : undefined;

      const entry: DailyEntry = {
        date,
        bp,
        glucose,
        meds: {
          taken: raw.meds?.taken ?? true,
          names: raw.meds?.names ? raw.meds.names.split(',').map((n) => n.trim()).filter(Boolean) : undefined
        },
        food,
        exercise,
        alcohol: raw.alcohol != null ? Number(raw.alcohol) : undefined,
        cigarettes: raw.cigarettes != null ? Number(raw.cigarettes) : undefined,
        herbs: raw.herbs ? raw.herbs.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
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

      const statusResult = this.healthRules.computeStatus(entry, defaultThresholds);
      entry.status = statusResult.status;
      entry.statusReasons = statusResult.reasons;
      entry.riskScore = this.healthRules.computeRiskScore(entry, defaultThresholds);
      entry.actions = this.healthRules.generateActions(entry, statusResult);

      await this.entryService.saveEntry(this.activePatientId()!, entry);
      this.status.set('success');
      await this.router.navigate(['/patient']);
    } catch (error: any) {
      console.error(error);
      this.status.set('error');
      this.errorMessage.set(error?.message ?? 'Unable to save entry');
    }
  }

  private todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
