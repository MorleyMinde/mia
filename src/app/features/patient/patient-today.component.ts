import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DailyEntry } from '../../core/models/daily-entry.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { EntryService } from '../../core/services/entry.service';

@Component({
  selector: 'app-patient-today',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-today.component.html',
  styleUrls: ['./patient-today.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientTodayComponent {
  private readonly entryService = inject(EntryService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);

  readonly entries = signal<DailyEntry[] | null>(null);
  readonly loading = signal(false);

  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.authService.user()?.uid ?? null);
  readonly latestEntry = computed(() => this.entries()?.[0] ?? null);
  readonly hasTodayEntry = computed(() => {
    const entry = this.latestEntry();
    if (!entry) {
      return false;
    }
    const today = new Date().toISOString().slice(0, 10);
    return entry.date === today;
  });

  constructor() {
    effect((onCleanup) => {
      const patientId = this.activePatientId();
      if (!patientId) {
        this.entries.set(null);
        return;
      }
      this.loading.set(true);
      const subscription = this.entryService.listenToEntries(patientId).subscribe({
        next: (entries) => {
          this.entries.set(entries);
          this.loading.set(false);
        },
        error: (error) => {
          console.error(error);
          this.loading.set(false);
        }
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  statusColor(status: string | null): string {
    return status === 'red' ? 'bg-red-100 border-red-300 text-red-900' : status === 'yellow' ? 'bg-yellow-100 border-yellow-300 text-yellow-900' : 'bg-green-100 border-green-300 text-green-900';
  }
}
