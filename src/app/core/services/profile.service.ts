import { Injectable, inject } from '@angular/core';
import {
  DocumentReference,
  Firestore,
  collection,
  doc,
  docData,
  serverTimestamp,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly firestore = inject(Firestore);

  listenToProfile(uid: string): Observable<UserProfile | null> {
    const reference = doc(this.firestore, 'users', uid) as DocumentReference<UserProfile>;
    return docData(reference, { idField: 'uid' }).pipe(map((profile) => profile ?? null));
  }

  async upsertProfile(profile: UserProfile) {
    const reference = doc(this.firestore, 'users', profile.uid) as DocumentReference<UserProfile>;
    const profileWithLowercase = {
      ...profile,
      displayNameLower: profile.displayName.toLowerCase(),
      updatedAt: new Date(),
      createdAt: profile.createdAt ?? new Date()
    };
    await setDoc(reference, profileWithLowercase, { merge: true });
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
}
