import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { User } from '../types/user';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';
import { GameInit } from '../types/game';

@Injectable({
  providedIn: 'root',
})
export class Api {
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  // Add User to Queue
  addToQueue(user: User): Observable<User> {
    return this.http.post<User>(
      `${environment.apiUrl}/queues/add`,
      { user },
      { withCredentials: true }
    );
  }

  // remove User from Queue
  removeFromQueue(user: User): Observable<User> {
    return this.http.post<User>(
      `${environment.apiUrl}/queues/remove`,
      { user },
      { withCredentials: true }
    );
  }

  // Get Queue
  getQueue(): Observable<{ queue: User[] }> {
    return this.http.get<{ queue: User[] }>(`${environment.apiUrl}/queues`, {
      withCredentials: true,
    });
  }

  // Check if User is in Queue
  isUserInQueue(): Observable<boolean> {
    return this.http
      .get<{ isInQueue: boolean }>(`${environment.apiUrl}/queues/userInQueue`, {
        withCredentials: true,
      })
      .pipe(switchMap((response) => [response.isInQueue]));
  }

  // Check if User is in an active game
  isUserInGame(): Observable<boolean> {
    return this.http
      .get<{ isInGame: boolean }>(`${environment.apiUrl}/queues/userInGame`, {
        withCredentials: true,
      })
      .pipe(switchMap((response) => [response.isInGame]));
  }

  getGame(): Observable<GameInit> {
    return this.http.get<GameInit>(`${environment.apiUrl}/games`, {
      withCredentials: true,
    });
  }
}
