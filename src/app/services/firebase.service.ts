import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore: Firestore = inject(Firestore);

  // Example: Get data from Firestore
  getData(collectionName: string): Observable<any[]> {
    const dataCollection = collection(this.firestore, collectionName);
    return collectionData(dataCollection, { idField: 'id' });
  }

  // Example: Add data to Firestore
  async addData(collectionName: string, data: any): Promise<void> {
    const dataCollection = collection(this.firestore, collectionName);
    await addDoc(dataCollection, data);
  }
}

