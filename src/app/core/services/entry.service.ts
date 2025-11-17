import { Injectable, inject } from '@angular/core';
import {
  CollectionReference,
  DocumentReference,
  Firestore,
  collection,
  collectionData,
  doc,
  orderBy,
  query,
  setDoc
} from '@angular/fire/firestore';
import { DailyEntry } from '../models/daily-entry.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EntryService {
  private readonly firestore = inject(Firestore);

  private collection(uid: string): CollectionReference<DailyEntry> {
    return collection(this.firestore, 'users', uid, 'entries') as CollectionReference<DailyEntry>;
  }

  listenToEntries(uid: string): Observable<DailyEntry[]> {
    const q = query(this.collection(uid), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'date' }) as Observable<DailyEntry[]>;
  }

  async saveEntry(uid: string, entry: DailyEntry) {
    const reference = doc(this.firestore, 'users', uid, 'entries', entry.date) as DocumentReference<DailyEntry>;
    await setDoc(reference, entry, { merge: true });
  }
}
