import { Injectable, Signal, computed, signal } from '@angular/core';
import { ViewingContext } from '../models/viewing-context.model';
import { UserRole } from '../models/user-profile.model';

const defaultContext: ViewingContext = { currentRole: 'patient' };

@Injectable({ providedIn: 'root' })
export class ContextService {
  private readonly _context = signal<ViewingContext>(defaultContext);

  readonly context: Signal<ViewingContext> = computed(() => this._context());
  readonly actingAsPatientId = computed(() => this._context().actingAsPatientId);
  readonly currentRole = computed(() => this._context().currentRole);

  setRole(role: UserRole) {
    this._context.update((ctx) => ({ ...ctx, currentRole: role }));
  }

  viewAsPatient(patientId: string) {
    this._context.update((ctx) => ({ ...ctx, actingAsPatientId: patientId }));
  }

  exitViewAs() {
    this._context.update((ctx) => ({ ...ctx, actingAsPatientId: ctx.currentRole === 'patient' ? ctx.actingAsPatientId : undefined }));
  }
}
