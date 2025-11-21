import { Injectable, inject } from '@angular/core';
import {
  CollectionReference,
  DocumentReference,
  Firestore,
  collection,
  collectionData,
  doc,
  getDocs,
  query,
  setDoc,
  where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ProviderPatientLink } from '../models/provider-link.model';
import { PatientProfile, UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private readonly firestore = inject(Firestore);

  private linksCollection(providerId: string): CollectionReference<ProviderPatientLink> {
    return collection(this.firestore, 'providers', providerId, 'patients') as CollectionReference<ProviderPatientLink>;
  }

  listenToLinkedPatients(providerId: string): Observable<ProviderPatientLink[]> {
    return collectionData(this.linksCollection(providerId), { idField: 'patientId' }) as Observable<ProviderPatientLink[]>;
  }

  async linkPatientByShareCode(providerId: string, shareCode: string) {
    const patientsCollection = collection(this.firestore, 'users') as CollectionReference<UserProfile>;
    const snapshot = await getDocs(query(patientsCollection, where('shareCode', '==', shareCode)));
    if (snapshot.empty) {
      throw new Error('No patient found with that share code');
    }
    const patient = snapshot.docs[0];
    if ((patient.data() as UserProfile).role !== 'patient') {
      throw new Error('Share code belongs to a provider');
    }
    const patientId = patient.id;
    const reference = doc(this.firestore, 'providers', providerId, 'patients', patientId) as DocumentReference<ProviderPatientLink>;
    await setDoc(reference, { providerId, patientId, createdAt: new Date() });
  }

  async linkPatient(providerId: string, patientId: string) {
    const reference = doc(this.firestore, 'providers', providerId, 'patients', patientId) as DocumentReference<ProviderPatientLink>;
    await setDoc(reference, { providerId, patientId, createdAt: new Date() });
  }

  searchPatientsByName(searchTerm: string): Observable<PatientProfile[]> {
    const patientsCollection = collection(this.firestore, 'users') as CollectionReference<UserProfile>;
    
    console.log('Searching for patients with term:', searchTerm);
    
    // Convert search term to lowercase for querying
    const searchLower = searchTerm.toLowerCase();
    
    // Use range query for prefix matching on displayNameLower field
    // This queries directly in Firestore instead of filtering on the frontend
    const patientsQuery = query(
      patientsCollection,
      where('role', '==', 'patient'),
      where('displayNameLower', '>=', searchLower),
      where('displayNameLower', '<=', searchLower + '\uf8ff')
    );
    
    return new Observable<PatientProfile[]>((observer) => {
      collectionData(patientsQuery, { idField: 'uid' }).subscribe({
        next: (patients) => {
          console.log('Patients found via Firestore query:', patients.length);
          
          // Limit results to 20 for performance
          const results = (patients as PatientProfile[]).slice(0, 20);
          
          results.forEach(patient => {
            console.log('Match found:', patient.displayName);
          });

          console.log('Final results:', results.length);
          observer.next(results);
          observer.complete();
        },
        error: (error) => {
          console.error('Firestore error:', error);
          observer.error(error);
        }
      });
    });
  }
}
