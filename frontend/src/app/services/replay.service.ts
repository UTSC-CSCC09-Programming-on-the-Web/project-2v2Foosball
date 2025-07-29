import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GameData } from '../types/game';
import { ReplayAction } from '../types/replay';

export interface Replay {
  gameId: string;
  score1: number;
  score2: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReplayService {
  private currentGameId = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  // Fetch paginated game history for a user
  getGameHistory(userId: string, page: number = 0): Observable<GameData[]> {
    return this.http.get<GameData[]>(
      `${environment.apiUrl}/replays/${userId}?page=${page}`,
      {
        withCredentials: true,
      }
    );
  }

  // Fetch actions for a specific gameId
  getGameActions(gameId: string): Observable<ReplayAction[]> {
    return this.http.get<ReplayAction[]>(
      `${environment.apiUrl}/replays/actions/${gameId}`,
      {
        withCredentials: true,
      }
    );
  }

  // Set the current game being spectated
  setCurrentGame(gameId: string): void {
    this.currentGameId.next(gameId);
  }

  // Get the current game being spectated
  getCurrentGame(): Observable<string | null> {
    return this.currentGameId.asObservable();
  }

  clearCurrentGame(): void {
    this.currentGameId.next(null);
  }
}
