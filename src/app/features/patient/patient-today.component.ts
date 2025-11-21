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
      if (!entry.timestamp) {
        console.warn('[PatientToday] Entry missing timestamp:', entry);
        return false;
      }
      
      // Convert timestamp to Date if needed
      let entryDate: Date;
      if (entry.timestamp instanceof Date) {
        entryDate = entry.timestamp;
      } else if (typeof entry.timestamp === 'object' && 'toDate' in entry.timestamp) {
        entryDate = (entry.timestamp as any).toDate();
      } else {
        entryDate = new Date(entry.timestamp);
      }
      
      // Validate timestamp
      if (isNaN(entryDate.getTime())) {
        console.warn('[PatientToday] Invalid timestamp:', entry.timestamp);
        return false;
      }
      
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
      console.log('[PatientToday] Listening to entries for patient:', patientId);
      const subscription = this.entryService.listenToEntries(patientId).subscribe({
        next: (entries) => {
          console.log('[PatientToday] Received entries:', entries.length);
          if (entries.length > 0) {
            console.log('[PatientToday] First entry:', entries[0]);
          }
          this.allEntries.set(entries);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('[PatientToday] Error fetching entries:', error);
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
    
    try {
      let date: Date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        date = (timestamp as any).toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('[PatientToday] Error formatting time:', error);
      return '';
    }
  }
}
