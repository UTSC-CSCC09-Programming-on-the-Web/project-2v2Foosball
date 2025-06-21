import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  isLoading = false;

  constructor(private authService: AuthService) {}

  onLogin(provider: 'github') {
    this.isLoading = true;
    this.authService.login(provider);
  }
}
