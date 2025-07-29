import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReplayService } from '../../services/replay.service';
import { AuthService } from '../../services/auth';
import { GameData } from '../../types/game';
import { GameList } from '../game-list/game-list';
import { Router } from '@angular/router';

@Component({
  selector: 'app-replay-list',
  imports: [CommonModule, GameList],
  templateUrl: './replay-list.html',
  styleUrl: './replay-list.scss',
})
export class ReplayComponent implements OnInit, OnDestroy {
  replays: GameData[] = []; // Array to hold replay data
  loading = true;
  error: string | null = null;
  private userId: string | null = null;

  constructor(
    private replayService: ReplayService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe({
      next: (user) => {
        if (user && user.userId) {
          this.userId = user.userId;
          this.fetchReplays(this.userId);
        }
      },
      error: (err) => {
        console.error('Error fetching user:', err);
      },
    });
  }

  ngOnDestroy(): void {
    // No cleanup needed
  }

  // Method to manually refresh the replay list
  refreshReplays(): void {
    if (this.userId) {
      this.fetchReplays(this.userId);
    }
  }

  // Method to fetch replays for a specific userId
  fetchReplays(userId: string): void {
    this.loading = true;
    this.error = null;

    this.replayService.getGameHistory(userId).subscribe({
      next: (data) => {
        this.replays = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
        console.error('Error fetching replays:', err);
      },
    });
  }

  startReplay(gameId: string): void {
    this.replayService.setCurrentGame(gameId);
    this.router.navigate(['/replay']);
  }
}
