import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
    // Update the time display every second
    this.updateTimer = setInterval(() => {
      // Trigger change detection to update the displayed times
      this.cdr.detectChanges();
    }, 1000);
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

  getGameDuration(startTime: string): string {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
