import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';
import { environment } from '../../environments/environment';
import { GameData } from '../types/game';

@Injectable({
  providedIn: 'root',
})
export class SpectatorService {
  private currentGameId = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private socketService: SocketService) {}

  // Get list of active games from REST API
  getActiveGames(): Observable<GameData[]> {
    return this.http.get<GameData[]>(
      `${environment.apiUrl}/spectator/active-games`,
      { withCredentials: true }
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

  // Clear the current game
  clearCurrentGame(): void {
    this.currentGameId.next(null);
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
