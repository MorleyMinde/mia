import { UserRole } from './user-profile.model';

export interface ViewingContext {
  currentRole: UserRole;
  actingAsPatientId?: string;
}
