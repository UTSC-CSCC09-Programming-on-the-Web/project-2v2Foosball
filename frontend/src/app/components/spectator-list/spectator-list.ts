import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SpectatorService, ActiveGame } from '../../services/spectator.service';

@Component({
  selector: 'app-spectator-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spectator-list.html',
  styleUrl: './spectator-list.scss',
})
export class SpectatorListComponent implements OnInit, OnDestroy {
  activeGames: ActiveGame[] = [];
  loading = true;
  error: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private spectatorService: SpectatorService) {}

  ngOnInit(): void {
    this.loadActiveGames();
    this.setupSpectatorCountUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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
    // TODO: Navigate to spectator game view or emit event
    console.log('Spectating game:', gameId);
    this.spectatorService.joinSpectating(gameId);
  }

  refreshGames(): void {
    this.loadActiveGames();
  }

  getGameDuration(startTime: string): string {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
