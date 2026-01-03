import { Injectable, inject } from '@angular/core';
import {
  DocumentReference,
  Firestore,
  collection,
  doc,
  docData,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Observable, map, of, firstValueFrom } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';
import { UserProfile, UserRole } from '../models/user-profile.model';
import { AuthService } from './auth.service';
import { Auth, authState } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly auth = inject(Auth);

  listenToProfile(uid: string): Observable<UserProfile | null> {
    const reference = doc(this.firestore, 'users', uid) as DocumentReference<UserProfile>;
    return docData(reference, { idField: 'uid' }).pipe(map((profile) => profile ?? null));
  }

  async upsertProfile(profile: UserProfile) {
    const reference = doc(this.firestore, 'users', profile.uid) as DocumentReference<UserProfile>;
    const profileWithLowercase: any = {
      ...profile,
      displayNameLower: profile.displayName.toLowerCase(),
      updatedAt: new Date(),
      createdAt: profile.createdAt ?? new Date()
    };

    // Firestore does not allow undefined field values; strip them out
    const cleanProfile: any = {};
    Object.keys(profileWithLowercase).forEach((key) => {
      const value = profileWithLowercase[key];
      if (value !== undefined) {
        cleanProfile[key] = value;
      }
    });

    await setDoc(reference, cleanProfile, { merge: true });
  }

  async updatePartial(uid: string, patch: Partial<UserProfile>) {
    const reference = doc(this.firestore, 'users', uid) as DocumentReference<UserProfile>;
    const updateData: any = { ...patch, updatedAt: serverTimestamp() };
    
    // If displayName is being updated, also update displayNameLower
    if ('displayName' in patch && patch.displayName) {
      updateData.displayNameLower = patch.displayName.toLowerCase();
    }
    
    await updateDoc(reference, updateData);
  }

  generateShareCode(): string {
    const dictionary = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 })
      .map(() => dictionary[Math.floor(Math.random() * dictionary.length)])
      .join('');
  }

  /**
   * Get the current user's role from their profile in the database
   * Returns 'patient' if profile doesn't exist or role is not set
   * Waits for auth state to be ready if needed
   */
  async getCurrentUserRole(): Promise<UserRole> {
    // First try to get user from signal (fast path)
    let user = this.authService.user();
    
    // If signal is not ready yet, wait for auth state
    if (!user) {
      try {
        user = await firstValueFrom(
          authState(this.auth).pipe(
            timeout({ first: 3000, with: () => of(null) }),
            filter((u) => u !== null)
          )
        ).catch(() => null);
      } catch (error) {
        console.error('Error waiting for auth state:', error);
        return 'patient';
      }
    }

    if (!user) {
      return 'patient';
    }

    try {
      const reference = doc(this.firestore, 'users', user.uid) as DocumentReference<UserProfile>;
      const snapshot = await getDoc(reference);
      if (!snapshot.exists()) {
        return 'patient';
      }
      const profile = snapshot.data();
      return profile?.role ?? 'patient';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'patient';
    }
  }

  /**
   * Observable that emits the current user's role from their profile
   * Returns 'patient' if user is not authenticated or profile doesn't exist
   */
  getCurrentUserRole$(): Observable<UserRole> {
    const user = this.authService.user();
    if (!user) {
      return of('patient' as UserRole);
    }
    return this.listenToProfile(user.uid).pipe(
      map((profile) => profile?.role ?? 'patient')
    );
  }

  /**
   * Check if the current user is a provider
   */
  async isProvider(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'provider';
  }
}
