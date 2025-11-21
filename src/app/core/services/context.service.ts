import { Injectable, Signal, computed, signal } from '@angular/core';
import { ViewingContext } from '../models/viewing-context.model';
import { UserRole } from '../models/user-profile.model';

const ROLE_STORAGE_KEY = 'mtuniafya-role';

function readStoredRole(): UserRole {
  if (typeof window === 'undefined') {
    return 'patient';
  }
  const stored = window.localStorage.getItem(ROLE_STORAGE_KEY);
  return stored === 'provider' ? 'provider' : 'patient';
}

function persistRole(role: UserRole) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ROLE_STORAGE_KEY, role);
  }
}

const defaultContext: ViewingContext = { currentRole: readStoredRole() };

@Injectable({ providedIn: 'root' })
export class ContextService {
  private readonly _context = signal<ViewingContext>(defaultContext);

  readonly context: Signal<ViewingContext> = computed(() => this._context());
  readonly actingAsPatientId = computed(() => this._context().actingAsPatientId);
  readonly currentRole = computed(() => this._context().currentRole);

  get roleSnapshot(): UserRole {
    return this._context().currentRole;
  }

  setRole(role: UserRole) {
    this._context.update((ctx) => ({ ...ctx, currentRole: role }));
    persistRole(role);
  }

  viewAsPatient(patientId: string) {
    this._context.update((ctx) => ({ ...ctx, actingAsPatientId: patientId }));
  }

  exitViewAs() {
    this._context.update((ctx) => ({ ...ctx, actingAsPatientId: ctx.currentRole === 'patient' ? ctx.actingAsPatientId : undefined }));
  }
}
