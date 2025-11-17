import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DailyEntry } from '../../core/models/daily-entry.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { EntryService } from '../../core/services/entry.service';

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientHistoryComponent {
  private readonly entryService = inject(EntryService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);

  readonly entries = signal<DailyEntry[]>([]);
  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.authService.user()?.uid ?? null);

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

  statusBadge(status: string): string {
    switch (status) {
      case 'red':
        return 'bg-red-100 text-red-900';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-900';
      default:
        return 'bg-green-100 text-green-900';
    }
  }
}
