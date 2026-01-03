import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProfileService } from '../services/profile.service';
import { Auth, authState } from '@angular/fire/auth';

export const rootRedirectGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const profileService = inject(ProfileService);
  const auth = inject(Auth);

  // Wait for auth state to initialize (with timeout to avoid hanging)
  try {
    const user = await firstValueFrom(
      authState(auth).pipe(
        timeout({ first: 3000, with: () => of(null) }),
        catchError(() => of(null))
      )
    );

    if (user) {
      // User is logged in, route to appropriate dashboard
      const role = await profileService.getCurrentUserRole();
      return router.createUrlTree(role === 'provider' ? ['/provider'] : ['/patient']);
    }
  } catch (error) {
    console.error('Error in root redirect guard:', error);
  }

  // User is not logged in, go to auth
  return router.createUrlTree(['/auth']);
};

