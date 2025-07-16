import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GameData } from '../types/game';

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
  constructor(private http: HttpClient) {}

  // Fetch paginated game history for a user
  getGameHistory(userId: string, page: number = 0): Observable<GameData[]> {
    return this.http.get<GameData[]>(
      `${environment.apiUrl}/replays/${userId}?page=${page}`
    );
  }

  // Fetch actions for a specific gameId
  getGameActions(gameId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/replays/actions/${gameId}`);
  }
}
