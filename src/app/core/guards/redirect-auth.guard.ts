import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment, Route } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ContextService } from '../services/context.service';

export const redirectLoggedInGuard: CanMatchFn = (
  _route: Route,
  _segments: UrlSegment[]
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const context = inject(ContextService);
  if (auth.isAuthenticated()) {
    const role = context.currentRole();
    return router.createUrlTree(role === 'provider' ? ['/provider'] : ['/patient']);
  }
  return true;
};
