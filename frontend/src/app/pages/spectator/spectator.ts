import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SpectatorFieldComponent } from '../../components/spectator-field/spectator-field';
import { ScoreboardComponent } from '../../components/scoreboard/scoreboard';
import { SpectatorService } from '../../services/spectator.service';
import { BallState, PlayerRodState, GameConfig } from '../../types/game';

@Component({
  selector: 'app-spectator',
  standalone: true,
  imports: [CommonModule, SpectatorFieldComponent, ScoreboardComponent],
  templateUrl: './spectator.html',
  styleUrl: './spectator.scss',
})
export class SpectatorPage implements OnInit, OnDestroy {
  gameId: string | null = null;
  isConnected = false;
  isLoading = true;
  error: string | null = null;
  spectatorCount = 0;
  gameInfo: any = null;

  // Game state for child components - this will be updated with delayed state
  ball: BallState = {
    x: 600,
    y: 250,
    vx: 0,
    vy: 0,
  };

  rods: { team1: PlayerRodState[]; team2: PlayerRodState[] } = {
    team1: [
      {
        x: 100,
        vy: 0,
        figureCount: 1,
        figures: [{ y: 250 }],
      },
      {
        x: 300,
        vy: 0,
        figureCount: 3,
        figures: [{ y: 100 }, { y: 250 }, { y: 400 }],
      },
    ],
    team2: [
      {
        x: 900,
        vy: 0,
        figureCount: 3,
        figures: [{ y: 100 }, { y: 250 }, { y: 400 }],
      },
      {
        x: 1100,
        vy: 0,
        figureCount: 1,
        figures: [{ y: 250 }],
      },
    ],
  };

  config: GameConfig = {
    fieldWidth: 1200,
    fieldHeight: 500,
    goalWidth: 20,
    goalHeight: 200,
    rodWidth: 20,
    rodHeight: 400,
    rodSpeed: 500,
    ballRadius: 10,
    ballSpeed: 300,
    figureRadius: 20,
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private spectatorService: SpectatorService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Subscribe to the current game from the service
    const gameIdSub = this.spectatorService
      .getCurrentGame()
      .subscribe((gameId) => {
        this.gameId = gameId;

        if (!this.gameId) {
          this.error =
            'No game selected. Please select a game from the games list.';
          this.isLoading = false;
          // Redirect back to index after a short delay
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
          return;
        }

        this.setupSpectatorListeners();
        this.joinSpectating();
      });

    this.subscriptions.push(gameIdSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    if (this.gameId && this.isConnected) {
      this.spectatorService.leaveSpectating(this.gameId);
    }

    // Clear the current game from the service
    this.spectatorService.clearCurrentGame();
  }

  private setupSpectatorListeners(): void {
    // Listen for game state updates
    const updateSub = this.spectatorService.onSpectatorUpdate().subscribe({
      next: (data) => {
        if (data.gameId === this.gameId) {
          // Apply the delayed state directly without any interpolation
          this.updateGameStateDirectly(data.gameState);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.error = 'Connection error';
        console.error('Spectator update error:', err);
      },
    });

    // Listen for spectator count updates
    const countSub = this.spectatorService.onSpectatorCountUpdate().subscribe({
      next: (data) => {
        if (data.gameId === this.gameId) {
          this.spectatorCount = data.count;
          this.cdr.detectChanges();
        }
      },
    });

    // Listen for errors
    const errorSub = this.spectatorService.onSpectatorError().subscribe({
      next: (data) => {
        if (data.gameId === this.gameId) {
          this.error = data.message || 'Spectator error';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
    });

    // Listen for game end
    const gameEndSub = this.spectatorService.onSpectatorGameEnded().subscribe({
      next: (data) => {
        if (data.gameId === this.gameId) {
          this.error = 'Game has ended';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 3000);
        }
      },
    });

    this.subscriptions.push(updateSub, countSub, errorSub, gameEndSub);
  }

  private joinSpectating(): void {
    this.spectatorService.joinSpectating(this.gameId!);
    this.isConnected = true;

    // Set a timeout to show error if no initial state is received
    setTimeout(() => {
      if (this.isLoading) {
        this.error = 'Failed to connect to game';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 5000);
  }

  private updateGameStateDirectly(gameState: any): void {
    // Apply the delayed state directly - no interpolation for spectators
    if (gameState.ball) {
      this.ball = { ...gameState.ball };
    }

    if (gameState.rods) {
      this.rods = {
        team1: gameState.rods.team1 || [],
        team2: gameState.rods.team2 || [],
      };
    }

    if (gameState.config) {
      this.config = { ...gameState.config };
    }

    if (gameState.gameInfo) {
      this.gameInfo = gameState.gameInfo;
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
