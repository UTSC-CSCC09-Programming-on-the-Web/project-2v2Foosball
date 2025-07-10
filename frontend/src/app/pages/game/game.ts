import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ScoreboardComponent } from '../../components/scoreboard/scoreboard';
import { GameFieldComponent } from '../../components/game-field/game-field';
import { BallState, PlayerRodState } from '../../types/game';
import { SocketService } from '../../services/socket.service';
import { Api } from '../../services/api';
import { GameEvent, GameConfig } from '../../types/game';

@Component({
  selector: 'app-game',
  imports: [CommonModule, ScoreboardComponent, GameFieldComponent],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements OnInit, OnDestroy {
  // Game state for child components
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
  score: { team1: number; team2: number } = { team1: 0, team2: 0 };
  config: GameConfig = {
    fieldWidth: 1200,
    fieldHeight: 500,
    goalWidth: 20,
    goalHeight: 200,
    rodWidth: 6,
    rodHeight: 500,
    ballRadius: 10,
    figureRadius: 12,
    maxScore: 5,
    rodSpeed: 5,
    ballSpeed: 10,
  };

  team: 1 | 2 = 1;
  activeRod: 1 | 2 = 1;
  private keystates: Set<string> = new Set();
  loading: boolean = true;

  // Goal celebration
  showGoalCelebration: boolean = false;
  goalCelebrationTimer: any;

  // Subscriptions
  private socketSub: Subscription | null = null;

  constructor(
    private api: Api,
    private socketService: SocketService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadGameState();
    this.setupGameServiceSubscriptions();
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
    // Clean up goal celebration timer
    if (this.goalCelebrationTimer) {
      clearTimeout(this.goalCelebrationTimer);
    }
  }

  private setupGameServiceSubscriptions(): void {
    this.socketSub = this.socketService
      .listen<GameEvent>('game.updated')
      .subscribe((event) => {
        if (
          event.eventType === 'position_update' ||
          event.eventType === 'goal_scored' ||
          event.eventType === 'game_resumed' ||
          event.eventType === 'ball_repositioned'
        ) {
          // Update game state directly - the game field component will handle interpolation
          if (event.gameState.ball) {
            this.ball = { ...event.gameState.ball };
          }
          if (event.gameState.team1?.rods) {
            this.rods.team1 = [...event.gameState.team1.rods];
          }
          if (event.gameState.team2?.rods) {
            this.rods.team2 = [...event.gameState.team2.rods];
          }
          if (event.gameState.team1?.score !== undefined) {
            this.score.team1 = event.gameState.team1.score;
          }
          if (event.gameState.team2?.score !== undefined) {
            this.score.team2 = event.gameState.team2.score;
          }

          // Handle goal events with celebration
          if (event.eventType === 'goal_scored') {
            this.triggerGoalCelebration();
          }
        }
      });
  }

  private loadGameState(): void {
    this.loading = true;
    this.api.getGame().subscribe({
      next: (game) => {
        this.ball = game.state.ball || {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        };
        this.rods = {
          team1: game.state.team1?.rods || [],
          team2: game.state.team2?.rods || [],
        };
        this.score = {
          team1: game.state.team1?.score || 0,
          team2: game.state.team2?.score || 0,
        };
        this.config = game.config;
        this.team = game.meta.team;
        this.activeRod = game.meta.activeRod;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load game state:', err);
        this.router.navigate(['/']);
      },
    });
  }

  private triggerGoalCelebration(): void {
    // Show the goal celebration overlay
    this.showGoalCelebration = true;

    // Clear any existing timer
    if (this.goalCelebrationTimer) {
      clearTimeout(this.goalCelebrationTimer);
    }

    // Hide the celebration after 3 seconds
    this.goalCelebrationTimer = setTimeout(() => {
      this.showGoalCelebration = false;
    }, 3000);
  }

  onKeyPresses(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if (event.type === 'keydown') {
      if (key === 'a') {
        if (this.activeRod === 2) {
          // If w or s is held, stop previous rod
          if (this.keystates.has('w') || this.keystates.has('s')) {
            this.socketService.emit('game.keypress', {
              key: this.keystates.has('w') ? 'w' : 's',
              activeRod: this.activeRod,
              type: 'keyup',
            });
          }
          this.activeRod = 1;
        }
      } else if (key === 'd') {
        if (this.activeRod === 1) {
          // If w or s is held, stop previous rod
          if (this.keystates.has('w') || this.keystates.has('s')) {
            this.socketService.emit('game.keypress', {
              key: this.keystates.has('w') ? 'w' : 's',
              activeRod: this.activeRod,
              type: 'keyup',
            });
          }
          this.activeRod = 2;
        }
      } else {
        this.keystates.add(key);
        // Send keypress to server
        this.socketService.emit('game.keypress', {
          key: key,
          activeRod: this.activeRod,
          type: event.type,
        });
      }
    } else if (event.type === 'keyup') {
      this.keystates.delete(key);
      if (key === 'w' || key === 's') {
        // Send keyup to server
        this.socketService.emit('game.keypress', {
          key: key,
          activeRod: this.activeRod,
          type: event.type,
        });
      }
    }
  }
}
