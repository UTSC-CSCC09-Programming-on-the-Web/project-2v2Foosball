import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SpectatorService } from '../../services/spectator.service';
import { GameData } from '../../types/game';
import { GameList } from '../game-list/game-list';

@Component({
  selector: 'app-spectator-list',
  standalone: true,
  imports: [CommonModule, GameList],
  templateUrl: './spectator-list.html',
  styleUrl: './spectator-list.scss',
})
export class SpectatorListComponent implements OnInit, OnDestroy {
  activeGames: GameData[] = [];
  loading = true;
  error: string | null = null;
  private subscriptions: Subscription[] = [];
  private updateTimer: any;

  constructor(
    private spectatorService: SpectatorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadActiveGames();
    this.setupSpectatorCountUpdates();
    this.startUpdateTimer();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }

  private startUpdateTimer(): void {
    this.updateTimer = setInterval(() => {
      // Always trigger change detection to update the displayed times
      this.cdr.detectChanges();
      this.refreshGameData();
    }, 1000);
  }

  private refreshGameData(): void {
    // Silently refresh the game data without showing loading state
    const sub = this.spectatorService.getActiveGames().subscribe({
      next: (games) => {
        // Update scores and other game data while preserving existing games
        games.forEach((updatedGame) => {
          const existingGame = this.activeGames.find(
            (g) => g.gameId === updatedGame.gameId
          );
          if (existingGame) {
            // Update the scores and other data
            existingGame.score = updatedGame.score;
            existingGame.players = updatedGame.players;
            // Keep the existing spectatorCount as it's updated via socket
          } else {
            // New game appeared
            this.activeGames.push(updatedGame);
          }
        });

        // Remove games that no longer exist
        this.activeGames = this.activeGames.filter((game) =>
          games.some((g) => g.gameId === game.gameId)
        );
      },
      error: (err) => {
        console.error('Error refreshing game data:', err);
      },
    });

    this.subscriptions.push(sub);
  }

  private loadActiveGames(): void {
    this.loading = true;
    this.error = null;

    const sub = this.spectatorService.getActiveGames().subscribe({
      next: (games) => {
        this.activeGames = games;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load active games';
        this.loading = false;
        console.error('Error loading active games:', err);
      },
    });

    this.subscriptions.push(sub);
  }

  private setupSpectatorCountUpdates(): void {
    // Listen for real-time spectator count updates
    const sub = this.spectatorService
      .onSpectatorCountUpdate()
      .subscribe((data) => {
        const game = this.activeGames.find((g) => g.gameId === data.gameId);
        if (game) {
          game.spectatorCount = data.count;
        }
      });

    this.subscriptions.push(sub);
  }

  spectateGame(gameId: string): void {
    this.spectatorService.setCurrentGame(gameId);
    this.router.navigate(['/spectator']);
  }

  refreshGames(): void {
    this.loadActiveGames();
  }
}
