import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Index } from './pages/index';
import { authGuard } from './guards/auth-guard';
import { Membership } from './pages/membership/membership';
import { loginGuard } from './guards/login-guard';

export const routes: Routes = [
  {
    path: '',
    component: Index,
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: Login,
    canActivate: [loginGuard],
  },
  {
    path: 'membership',
    component: Membership,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
