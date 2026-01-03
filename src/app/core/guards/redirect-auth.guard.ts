import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment, Route } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

export const redirectLoggedInGuard: CanMatchFn = async (
  _route: Route,
  _segments: UrlSegment[]
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const profileService = inject(ProfileService);
  if (auth.isAuthenticated()) {
    // Get role from database profile
    const role = await profileService.getCurrentUserRole();
    return router.createUrlTree(role === 'provider' ? ['/provider'] : ['/patient']);
  }
  return true;
};
