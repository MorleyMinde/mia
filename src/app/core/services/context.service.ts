import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { ViewingContext } from '../models/viewing-context.model';
import { UserRole } from '../models/user-profile.model';
import { ProfileService } from './profile.service';
import { AuthService } from './auth.service';

const defaultContext: ViewingContext = { currentRole: 'patient' };

@Injectable({ providedIn: 'root' })
export class ContextService {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly _context = signal<ViewingContext>(defaultContext);

  readonly context: Signal<ViewingContext> = computed(() => this._context());
  readonly actingAsPatientId = computed(() => this._context().actingAsPatientId);
  readonly currentRole = computed(() => this._context().currentRole);

  constructor() {
    // Load role from profile when user is authenticated
    effect(() => {
      const user = this.authService.user();
      if (user) {
        // Refresh role asynchronously (don't await in effect)
        this.refreshRoleFromProfile().catch((error) => {
          console.error('Error refreshing role in effect:', error);
        });
      } else {
        // Reset to patient when logged out
        this._context.update((ctx) => ({ ...ctx, currentRole: 'patient' }));
      }
    });
  }

  get roleSnapshot(): UserRole {
    return this._context().currentRole;
  }

  /**
   * Set role in context (does not persist to localStorage - role comes from database)
   */
  setRole(role: UserRole) {
    this._context.update((ctx) => ({ ...ctx, currentRole: role }));
  }

  /**
   * Refresh role from database profile
   */
  async refreshRoleFromProfile(): Promise<void> {
    try {
      const role = await this.profileService.getCurrentUserRole();
      this.setRole(role);
    } catch (error) {
      console.error('Error refreshing role from profile:', error);
      // Default to patient on error
      this.setRole('patient');
    }
  }

  viewAsPatient(patientId: string) {
    this._context.update((ctx) => ({ ...ctx, actingAsPatientId: patientId }));
  }

  exitViewAs() {
    this._context.update((ctx) => ({ ...ctx, actingAsPatientId: ctx.currentRole === 'patient' ? ctx.actingAsPatientId : undefined }));
  }
}
