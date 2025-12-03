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
}
