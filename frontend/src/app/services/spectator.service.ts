import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SocketService } from './socket.service';
import { environment } from '../../environments/environment';

export interface ActiveGame {
  gameId: string;
  startTime: string;
  score: {
    team1: number;
    team2: number;
  };
  players: {
    team1: Array<{ userId: string; name: string; avatar: string }>;
    team2: Array<{ userId: string; name: string; avatar: string }>;
  };
  spectatorCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class SpectatorService {
  constructor(
    private http: HttpClient,
    private socketService: SocketService,
  ) {}

  // Get list of active games from REST API
  getActiveGames(): Observable<ActiveGame[]> {
    return this.http.get<ActiveGame[]>(
      `${environment.apiUrl}/spectator/active-games`,
    );
  }

  // Join spectating a specific game via socket
  joinSpectating(gameId: string): void {
    this.socketService.emit('spectator.join', { gameId });
  }

  // Leave spectating a specific game via socket
  leaveSpectating(gameId: string): void {
    this.socketService.emit('spectator.leave', { gameId });
  }

  // Listen for spectator game updates
  onSpectatorUpdate(): Observable<any> {
    return this.socketService.listen('spectator.updated');
  }

  // Listen for spectator count updates
  onSpectatorCountUpdate(): Observable<any> {
    return this.socketService.listen('spectator.count.updated');
  }

  // Listen for spectator errors
  onSpectatorError(): Observable<any> {
    return this.socketService.listen('spectator.error');
  }

  // Listen for game ended while spectating
  onSpectatorGameEnded(): Observable<any> {
    return this.socketService.listen('spectator.gameEnded');
  }
}
