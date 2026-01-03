import { Routes } from '@angular/router';
import { redirectLoggedInGuard } from './core/guards/redirect-auth.guard';
import { authRequiredGuard } from './core/guards/auth-required.guard';
import { providerRequiredGuard } from './core/guards/provider-required.guard';
import { rootRedirectGuard } from './core/guards/root-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [rootRedirectGuard],
    children: []
  },
  {
    path: 'auth',
    canMatch: [redirectLoggedInGuard],
    loadComponent: () => import('./features/auth/auth-shell.component').then((m) => m.AuthShellComponent)
  },
  {
    path: 'patient',
    canMatch: [authRequiredGuard],
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
    canMatch: [authRequiredGuard, providerRequiredGuard],
    loadComponent: () => import('./features/provider/provider-shell.component').then((m) => m.ProviderShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/provider/provider-home.component').then((m) => m.ProviderHomeComponent)
      },
      {
        path: 'patient/:uid',
        loadComponent: () => import('./features/provider/provider-patient-dashboard.component').then((m) => m.ProviderPatientDashboardComponent)
      },
      {
        path: 'register-patient',
        loadComponent: () => import('./features/provider/provider-register-patient.component').then((m) => m.ProviderRegisterPatientComponent)
      },
      {
        path: 'record',
        loadComponent: () => import('./features/patient/patient-record.component').then((m) => m.PatientRecordComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/provider/provider-profile.component').then((m) => m.ProviderProfileComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];
