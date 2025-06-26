import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { inject } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { asyncScheduler, scheduled } from 'rxjs';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getUser().pipe(
    map((_) => {
      return router.createUrlTree(['/']);
    }),
    catchError((err) => {
      return scheduled([true], asyncScheduler);
    }),
  );
};
