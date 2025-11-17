import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth-shell.component').then((m) => m.AuthShellComponent)
  },
  {
    path: 'patient',
    loadComponent: () => import('./features/patient/patient-shell.component').then((m) => m.PatientShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/patient/patient-today.component').then((m) => m.PatientTodayComponent)
      },
      {
        path: 'record',
        loadComponent: () => import('./features/patient/patient-record.component').then((m) => m.PatientRecordComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./features/patient/patient-history.component').then((m) => m.PatientHistoryComponent)
      },
      {
        path: 'insights',
        loadComponent: () => import('./features/patient/patient-insights.component').then((m) => m.PatientInsightsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/patient/patient-profile.component').then((m) => m.PatientProfileComponent)
      }
    ]
  },
  {
    path: 'provider',
    loadComponent: () => import('./features/provider/provider-shell.component').then((m) => m.ProviderShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/provider/provider-patients.component').then((m) => m.ProviderPatientsComponent)
      },
      {
        path: 'today',
        loadComponent: () => import('./features/patient/patient-today.component').then((m) => m.PatientTodayComponent)
      },
      {
        path: 'record',
        loadComponent: () => import('./features/patient/patient-record.component').then((m) => m.PatientRecordComponent)
      },
      {
        path: 'insights',
        loadComponent: () => import('./features/patient/patient-insights.component').then((m) => m.PatientInsightsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];
