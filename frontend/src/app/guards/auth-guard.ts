import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { inject } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { asyncScheduler, scheduled } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getUser().pipe(
    map((user) => {
      if (user.active) {
        if (
          route.pathFromRoot.some((r) => r.routeConfig?.path === 'membership')
        ) {
          return router.createUrlTree(['/']);
        }
        return true;
      } else {
        if (
          route.pathFromRoot.some((r) => r.routeConfig?.path === 'membership')
        ) {
          return true;
        }
        return router.createUrlTree(['/membership']);
      }
    }),
    catchError((err) => {
      return scheduled([router.createUrlTree(['/login'])], asyncScheduler);
    }),
  );
};
