import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { HealthEntry } from '../../core/models/daily-entry.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { EntryService } from '../../core/services/entry.service';

@Component({
  selector: 'app-patient-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-insights.component.html',
  styleUrls: ['./patient-insights.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientInsightsComponent {
  private readonly entryService = inject(EntryService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);

  readonly entries = signal<HealthEntry[]>([]);
  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.authService.user()?.uid ?? null);

  readonly streakDays = computed(() => this.computeStreak(this.entries()));
  readonly missedMeds = computed(() => this.entries().filter((entry) => entry.meds && !entry.meds.taken).length);
  readonly avgSys = computed(() => this.average(this.entries().map((entry) => entry.bp?.sys).filter((v): v is number => !!v)));
  readonly avgGlucose = computed(() => this.average(this.entries().map((entry) => entry.glucose?.mmol).filter((v): v is number => !!v)));

  constructor() {
    effect((onCleanup) => {
      const patientId = this.activePatientId();
      if (!patientId) {
        this.entries.set([]);
        return;
      }
      const sub = this.entryService.listenToEntries(patientId).subscribe((entries) => this.entries.set(entries));
      onCleanup(() => sub.unsubscribe());
    });
  }

  private computeStreak(entries: HealthEntry[]): number {
    if (!entries.length) return 0;
    
    // Group entries by date
    const dateMap = new Map<string, HealthEntry[]>();
    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, []);
      }
      dateMap.get(dateStr)!.push(entry);
    });
    
    // Count consecutive days with entries
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  private average(values: number[]): number {
    if (!values.length) return 0;
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
  }
}
