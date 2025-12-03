import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HealthEntry } from '../../core/models/daily-entry.model';
import { PatientProfile } from '../../core/models/user-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { EntryService } from '../../core/services/entry.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-provider-patient-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './provider-patient-dashboard.component.html',
  styleUrls: ['./provider-patient-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderPatientDashboardComponent {
  private readonly entryService = inject(EntryService);
  private readonly profileService = inject(ProfileService);
  private readonly context = inject(ContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly profile = signal<PatientProfile | null>(null);
  readonly entries = signal<HealthEntry[]>([]);
  readonly loading = signal(true);

  readonly routePatientId = signal<string | null>(null);
  
  readonly activePatientId = computed(() => {
    // First try to get from route params (check both signal and snapshot for reliability)
    const routeUid = this.routePatientId() || this.route.snapshot.paramMap.get('uid');
    return routeUid || this.context.context().actingAsPatientId;
  });
  readonly latestEntry = computed(() => this.entries()[0] ?? null);
  readonly recentEntries = computed(() => this.entries().slice(0, 7));
  
  // Calculate insights
  readonly streakDays = computed(() => this.computeStreak(this.entries()));
  readonly missedMeds = computed(() => this.entries().filter((entry) => entry.meds && !entry.meds.taken).length);
  readonly avgSys = computed(() => this.average(this.entries().slice(0, 7).map((entry) => entry.bp?.sys).filter((v): v is number => !!v)));
  readonly avgGlucose = computed(() => this.average(this.entries().slice(0, 7).map((entry) => entry.glucose?.mmol).filter((v): v is number => !!v)));

  constructor() {
    // Initialize from snapshot first (for initial load/reload)
    const initialUid = this.route.snapshot.paramMap.get('uid');
    if (initialUid) {
      this.routePatientId.set(initialUid);
      this.context.viewAsPatient(initialUid);
    }

    // Subscribe to route params for navigation changes
    this.route.paramMap.subscribe(params => {
      const uid = params.get('uid');
      this.routePatientId.set(uid);
      if (uid) {
        this.context.viewAsPatient(uid);
      }
    });

    effect((onCleanup) => {
      const patientId = this.activePatientId();
      
      if (!patientId) {
        // Only navigate away if we're definitely not on a patient route
        const routeUid = this.route.snapshot.paramMap.get('uid');
        if (!routeUid) {
          this.router.navigate(['/provider']);
        }
        return;
      }

      this.loading.set(true);

      // Load profile
      const profileSub = this.profileService.listenToProfile(patientId).subscribe({
        next: (profile) => this.profile.set(profile as PatientProfile),
        error: (error) => console.error('Profile error:', error)
      });

      // Load entries
      const entriesSub = this.entryService.listenToEntries(patientId).subscribe({
        next: (entries) => {
          this.entries.set(entries);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Entries error:', error);
          this.loading.set(false);
        }
      });

      onCleanup(() => {
        profileSub.unsubscribe();
        entriesSub.unsubscribe();
      });
    });
  }

  statusColor(status: string): string {
    return status === 'red'
      ? 'bg-red-100 border-red-300 text-red-900'
      : status === 'yellow'
      ? 'bg-yellow-100 border-yellow-300 text-yellow-900'
      : 'bg-green-100 border-green-300 text-green-900';
  }

  statusBadge(status: string): string {
    return status === 'red'
      ? 'bg-red-100 text-red-900'
      : status === 'yellow'
      ? 'bg-yellow-100 text-yellow-900'
      : 'bg-green-100 text-green-900';
  }

  goToRecord() {
    const patientId = this.activePatientId();
    if (patientId) {
      this.router.navigate(['/provider/record'], { queryParams: { patient: patientId } });
    } else {
      this.router.navigate(['/provider/record']);
    }
  }

  getAge(yearOfBirth: number | undefined): string {
    if (!yearOfBirth) return '—';
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearOfBirth;
    return `${age} years`;
  }

  backToPatients() {
    this.context.exitViewAs();
    this.router.navigate(['/provider']);
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

