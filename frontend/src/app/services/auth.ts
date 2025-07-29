import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { User } from '../types/user';
import { map, catchError } from 'rxjs/operators';
import { asyncScheduler, scheduled } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user: User | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // Redirect to backend for login with GitHub
  login(provider: 'github'): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  mockLogin(userNumber: number = 1): Observable<any> {
    let endpoint = 'mock';
    if (userNumber === 2) {
      endpoint = 'mock2';
    } else if (userNumber === 3) {
      endpoint = 'mock3';
    } else if (userNumber === 4) {
      endpoint = 'mock4';
    }

    return this.http.post(
      `${environment.apiUrl}/auth/${endpoint}`,
      {},
      { withCredentials: true },
    );
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe(() => {
        this.user = null;
        this.router.navigate(['/login']);
      });
  }

  getUser(): Observable<User> {
    if (this.user) {
      return scheduled([this.user], asyncScheduler);
    }

    return this.http
      .get<User>(`${environment.apiUrl}/auth/me`, {
        withCredentials: true,
      })
      .pipe(
        map((user: User) => {
          this.user = user;
          return user;
        }),
        catchError(() => {
          return throwError(() => {
            return new Error('User not authenticated');
          });
        }),
      );
  }
}
