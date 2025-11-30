import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HealthEntry } from '../../core/models/daily-entry.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { EntryService } from '../../core/services/entry.service';

interface DayGroup {
  date: Date;
  dateString: string;
  entries: HealthEntry[];
  worstStatus: 'green' | 'yellow' | 'red';
}

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './patient-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientHistoryComponent {
  private readonly entryService = inject(EntryService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);

  readonly entries = signal<HealthEntry[]>([]);
  readonly activePatientId = computed(() => this.context.context().actingAsPatientId ?? this.authService.user()?.uid ?? null);
  
  readonly groupedEntries = computed(() => {
    const entries = this.entries();
    const groups = new Map<string, DayGroup>();
    
    entries.forEach(entry => {
      // Skip entries with invalid timestamps
      if (!entry.timestamp) return;
      
      // Ensure we have a valid Date object
      let timestamp: Date;
      if (entry.timestamp instanceof Date) {
        timestamp = entry.timestamp;
      } else if (typeof entry.timestamp === 'object' && 'toDate' in entry.timestamp) {
        // Handle Firestore Timestamp
        timestamp = (entry.timestamp as any).toDate();
      } else {
        timestamp = new Date(entry.timestamp);
      }
      
      // Validate the date is valid
      if (isNaN(timestamp.getTime())) {
        console.warn('Invalid timestamp for entry:', entry);
        return;
      }
      
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);
      const dateString = date.toISOString().split('T')[0];
      
      if (!groups.has(dateString)) {
        groups.set(dateString, {
          date,
          dateString,
          entries: [],
          worstStatus: 'green'
        });
      }
      
      const group = groups.get(dateString)!;
      group.entries.push(entry);
      
      // Update worst status
      if (entry.status === 'red') {
        group.worstStatus = 'red';
      } else if (entry.status === 'yellow' && group.worstStatus === 'green') {
        group.worstStatus = 'yellow';
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  readonly expandedDays = signal<Set<string>>(new Set());

  constructor() {
    effect((onCleanup) => {
      const patientId = this.activePatientId();
      if (!patientId) {
        this.entries.set([]);
        return;
      }
      console.log('[PatientHistory] Listening to entries for patient:', patientId);
      const sub = this.entryService.listenToEntries(patientId).subscribe({
        next: (entries) => {
          console.log('[PatientHistory] Received entries:', entries.length);
          if (entries.length > 0) {
            console.log('[PatientHistory] Sample entry:', entries[0]);
          }
          this.entries.set(entries);
        },
        error: (error) => {
          console.error('[PatientHistory] Error fetching entries:', error);
          this.entries.set([]);
        }
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  toggleDay(dateString: string) {
    const expanded = this.expandedDays();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(dateString)) {
      newExpanded.delete(dateString);
    } else {
      newExpanded.add(dateString);
    }
    this.expandedDays.set(newExpanded);
  }

  isDayExpanded(dateString: string): boolean {
    return this.expandedDays().has(dateString);
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

  formatTime(timestamp: Date | any): string {
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
      console.error('[PatientHistory] Error formatting time:', error);
      return '';
    }
  }
}
