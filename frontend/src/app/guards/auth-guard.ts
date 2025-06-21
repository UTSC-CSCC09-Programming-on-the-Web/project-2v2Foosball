import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth";
import { inject } from "@angular/core";
import { map, catchError } from "rxjs/operators";
import { asyncScheduler, scheduled } from "rxjs";
import { StripeService } from "../services/stripe";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const stripeService = inject(StripeService);
  const router = inject(Router);

  return authService.getUser().pipe(
    map((user) => {
      if (user.active) {
        return true;
      } else {
        return router.createUrlTree(["/membership"]);
      }
    }),
    catchError((err) => {
      return scheduled([router.createUrlTree(["/login"])], asyncScheduler);
    }),
  );
};
