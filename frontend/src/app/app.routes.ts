import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Index } from './pages/index';
import { authGuard } from './guards/auth-guard';
import { Membership } from './pages/membership/membership';
import { loginGuard } from './guards/login-guard';
import { Game } from './pages/game/game';
import { SpectatorPage } from './pages/spectator/spectator';

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
    path: 'game',
    component: Game,
    canActivate: [authGuard],
  },
  {
    path: 'spectator',
    component: SpectatorPage,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
