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
  isLoading = false;
  isMockEnv = environment.production === false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onLogin(provider: 'github') {
    this.isLoading = true;
    this.authService.login(provider);
  }

  onMockLogin() {
    this.authService.mockLogin().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
