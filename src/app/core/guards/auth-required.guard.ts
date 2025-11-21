import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authRequiredGuard: CanMatchFn = (
  _route: Route,
  _segments: UrlSegment[]
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return auth
    .requireUser()
    .then(() => true)
    .catch(() => router.createUrlTree(['/auth']));
};
