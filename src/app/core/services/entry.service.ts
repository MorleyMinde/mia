import { Injectable, inject } from '@angular/core';
import {
  CollectionReference,
  DocumentReference,
  Firestore,
  Timestamp,
  collection,
  collectionData,
  doc,
  orderBy,
  query,
  setDoc,
  where
} from '@angular/fire/firestore';
import { HealthEntry } from '../models/daily-entry.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class EntryService {
  private readonly firestore = inject(Firestore);

  private collection(uid: string): CollectionReference<HealthEntry> {
    return collection(this.firestore, 'users', uid, 'entries') as CollectionReference<HealthEntry>;
  }

  /**
   * Listen to all entries for a user, ordered by timestamp descending
   */
  listenToEntries(uid: string): Observable<HealthEntry[]> {
    console.log('[EntryService] Setting up listener for uid:', uid);
    const q = query(this.collection(uid), orderBy('timestamp', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map((entries) => {
        console.log('[EntryService] Raw entries from Firestore:', entries.length);
        if (entries.length > 0) {
          console.log('[EntryService] Raw first entry:', entries[0]);
        }
        
        const converted = entries.map(entry => ({
          ...entry,
          timestamp: this.toDate(entry.timestamp),
          createdAt: this.toDate(entry.createdAt),
          updatedAt: this.toDate(entry.updatedAt)
        }));
        
        console.log('[EntryService] Converted entries:', converted.length);
        if (converted.length > 0) {
          console.log('[EntryService] Converted first entry:', converted[0]);
        }
        
        return converted;
      })
    ) as Observable<HealthEntry[]>;
  }

  /**
   * Listen to entries for a specific date range
   */
  listenToEntriesForDateRange(uid: string, startDate: Date, endDate: Date): Observable<HealthEntry[]> {
    const q = query(
      this.collection(uid),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map((entries) =>
        entries.map(entry => ({
          ...entry,
          timestamp: this.toDate(entry.timestamp),
          createdAt: this.toDate(entry.createdAt),
          updatedAt: this.toDate(entry.updatedAt)
        }))
      )
    ) as Observable<HealthEntry[]>;
  }

  /**
   * Save or update an entry
   */
  async saveEntry(uid: string, entry: HealthEntry) {
    console.log('[EntryService] saveEntry called with uid:', uid);
    console.log('[EntryService] Entry to save:', entry);
    
    // Generate ID from timestamp if not provided
    const entryId = entry.id || this.generateEntryId(entry.timestamp);
    console.log('[EntryService] Generated entry ID:', entryId);
    
    const reference = doc(this.firestore, 'users', uid, 'entries', entryId) as DocumentReference<HealthEntry>;
    console.log('[EntryService] Document path:', `users/${uid}/entries/${entryId}`);
    
    const sanitizedEntry = this.removeUndefined({
      ...entry,
      id: entryId,
      timestamp: Timestamp.fromDate(entry.timestamp),
      createdAt: Timestamp.fromDate(entry.createdAt),
      updatedAt: Timestamp.fromDate(entry.updatedAt)
    });
    
    console.log('[EntryService] Sanitized entry:', sanitizedEntry);
    console.log('[EntryService] Attempting to save to Firestore...');
    
    try {
      await setDoc(reference, sanitizedEntry, { merge: true });
      console.log('[EntryService] Successfully saved to Firestore');
    } catch (error) {
      console.error('[EntryService] Error saving to Firestore:', error);
      throw error;
    }
  }

  /**
   * Generate a unique ID from timestamp
   */
  private generateEntryId(timestamp: Date): string {
    return timestamp.getTime().toString();
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  private toDate(value: any): Date {
    if (!value) {
      console.warn('[EntryService] toDate called with null/undefined value');
      return new Date();
    }
    
    if (value instanceof Date) {
      return value;
    }
    
    if (typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
      try {
        return value.toDate();
      } catch (error) {
        console.error('[EntryService] Error calling toDate():', error);
        return new Date(value.seconds * 1000); // Fallback for Firestore Timestamp
      }
    }
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.warn('[EntryService] Invalid date value:', value);
        return new Date();
      }
      return date;
    } catch (error) {
      console.error('[EntryService] Error parsing date:', error, value);
      return new Date();
    }
  }

  private removeUndefined<T>(value: T): T {
    if (value === undefined || value === null) {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.removeUndefined(item))
        .filter((item) => item !== undefined) as unknown as T;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (val === undefined) {
          continue;
        }
        const cleaned = this.removeUndefined(val);
        if (cleaned !== undefined) {
          result[key] = cleaned;
        }
      }
      return result as T;
    }

    return value;
  }
}
