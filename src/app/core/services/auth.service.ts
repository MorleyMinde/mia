import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser
} from '@angular/fire/auth';
import { from, lastValueFrom, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly provider = new GoogleAuthProvider();
  private readonly _user = signal<FirebaseUser | null>(null);

  readonly user: Signal<FirebaseUser | null> = computed(() => this._user());
  readonly isAuthenticated = computed(() => !!this._user());

  constructor() {
    authState(this.auth).subscribe((firebaseUser) => this._user.set(firebaseUser));
  }

  signInWithEmail(email: string, password: string): Observable<FirebaseUser> {
    return from(signInWithEmailAndPassword(this.auth, email, password).then((cred) => cred.user));
  }

  signUpWithEmail(displayName: string, email: string, password: string): Observable<FirebaseUser> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password).then(async (cred) => {
        await updateProfile(cred.user, { displayName });
        return cred.user;
      })
    );
  }

  signInWithGoogle(): Observable<FirebaseUser> {
    return from(signInWithPopup(this.auth, this.provider).then((cred) => cred.user));
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  async requireUser(): Promise<FirebaseUser> {
    const current = this._user();
    if (current) {
      return current;
    }
    const awaited = await lastValueFrom(authState(this.auth));
    if (!awaited) {
      throw new Error('User not authenticated');
    }
    return awaited;
  }
}
