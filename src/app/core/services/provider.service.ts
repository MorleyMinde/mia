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
}
