import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HealthEntry } from '../../core/models/daily-entry.model';
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

  readonly allEntries = signal<HealthEntry[] | null>(null);
  readonly loading = signal(false);

  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.authService.user()?.uid ?? null);
  
  readonly todayEntries = computed(() => {
    const entries = this.allEntries();
    if (!entries) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= today && entryDate < tomorrow;
    });
  });

  readonly latestEntry = computed(() => this.todayEntries()[0] ?? null);
  
  readonly overallStatus = computed(() => {
    const entries = this.todayEntries();
    if (entries.length === 0) return null;
    
    // Return worst status from today's entries
    const hasRed = entries.some(e => e.status === 'red');
    const hasYellow = entries.some(e => e.status === 'yellow');
    
    if (hasRed) return 'red';
    if (hasYellow) return 'yellow';
    return 'green';
  });

  constructor() {
    effect((onCleanup) => {
      const patientId = this.activePatientId();
      if (!patientId) {
        this.allEntries.set(null);
        return;
      }
      this.loading.set(true);
      const subscription = this.entryService.listenToEntries(patientId).subscribe({
        next: (entries) => {
          this.allEntries.set(entries);
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

  formatTime(timestamp: Date | undefined): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
