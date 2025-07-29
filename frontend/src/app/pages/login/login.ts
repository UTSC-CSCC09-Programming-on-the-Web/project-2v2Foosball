import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  isGithubLoading = false;
  isGoogleLoading = false;
  isMockEnv = environment.production === false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(provider: 'github' | 'google') {
    if (provider === 'github') this.isGithubLoading = true;
    else this.isGoogleLoading = true;
    this.authService.login(provider);
  }

  onMockLogin(userNumber: number = 1) {
    this.authService.mockLogin(userNumber).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
