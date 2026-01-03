import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { Auth, authState } from '@angular/fire/auth';

export const providerRequiredGuard: CanMatchFn = async (
  _route: Route,
  _segments: UrlSegment[]
) => {
  const authService = inject(AuthService);
  const profileService = inject(ProfileService);
  const router = inject(Router);
  const auth = inject(Auth);

  // Wait for auth state to be ready
  try {
    const user = await firstValueFrom(
      authState(auth).pipe(
        timeout({ first: 3000, with: () => of(null) }),
        filter((user) => user !== undefined)
      )
    ).catch(() => null);

    if (!user) {
      // Not authenticated, redirect to auth
      return router.createUrlTree(['/auth']);
    }

    // Get role from database
    const role = await profileService.getCurrentUserRole();
    if (role === 'provider') {
      return true;
    }

    // Not a provider, redirect to patient routes
    return router.createUrlTree(['/patient']);
  } catch (error) {
    console.error('Error in provider required guard:', error);
    // On error, redirect to auth
    return router.createUrlTree(['/auth']);
  }
};

