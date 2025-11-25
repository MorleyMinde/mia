import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { provideFunctions, getFunctions, connectFunctionsEmulator } from '@angular/fire/functions';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

// Custom TranslateLoader implementation
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

// Factory function for TranslateLoader
export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return new CustomTranslateLoader(http);
}

// Track which emulators have been connected to avoid multiple connections
const connectedEmulators = {
  firestore: false,
  auth: false,
  functions: false
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators && !connectedEmulators.firestore) {
        try {
          console.log('Connecting to Firestore emulator:', environment.emulators.firestore);
          connectFirestoreEmulator(firestore, environment.emulators.firestore.host, environment.emulators.firestore.port);
          connectedEmulators.firestore = true;
        } catch (error) {
          console.warn('Firestore emulator connection error:', error);
        }
      }
      return firestore;
    }),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators && !connectedEmulators.auth) {
        try {
          connectAuthEmulator(auth, `http://${environment.emulators.auth.host}:${environment.emulators.auth.port}`, { disableWarnings: true });
          connectedEmulators.auth = true;
        } catch (error) {
          console.warn('Auth emulator connection error:', error);
        }
      }
      return auth;
    }),
    provideFunctions(() => {
      const functions = getFunctions();
      if (environment.useEmulators && !connectedEmulators.functions) {
        try {
          connectFunctionsEmulator(functions, environment.emulators.functions.host, environment.emulators.functions.port);
          connectedEmulators.functions = true;
        } catch (error) {
          console.warn('Functions emulator connection error:', error);
        }
      }
      return functions;
    })
  ]
};
