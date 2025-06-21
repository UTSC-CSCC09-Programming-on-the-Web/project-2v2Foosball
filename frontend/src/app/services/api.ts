import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { User } from '../types/user';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
  ) {}

  // Add User to Queue
  addToQueue(): Observable<User> {
    return this.authService.getUser().pipe(
      switchMap((user) => {
        return this.http.post<User>(
          `${environment.apiUrl}/queue/add`,
          {
            user: user,
          },
          { withCredentials: true },
        );
      }),
    );
  }

  // remove User from Queue
  removeFromQueue(): Observable<User> {
    return this.authService.getUser().pipe(
      switchMap((user) => {
        return this.http.post<User>(
          `${environment.apiUrl}/queue/remove`,
          {
            user: user,
          },
          { withCredentials: true },
        );
      }),
    );
  }

  // Get Queue
  getQueue(): Observable<{ queue: User[] }> {
    return this.http.get<{ queue: User[] }>(`${environment.apiUrl}/queue`, {
      withCredentials: true,
    });
  }

  // Check if User is in Queue
  isUserInQueue(): Observable<boolean> {
    return this.http
      .get<{ isInQueue: boolean }>(`${environment.apiUrl}/queue/userInQueue`, {
        withCredentials: true,
      })
      .pipe(switchMap((response) => [response.isInQueue]));
  }

  // Create game
}
