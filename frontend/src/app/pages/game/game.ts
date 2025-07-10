import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
  imports: [ScoreboardComponent, GameFieldComponent],
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

  // Subscriptions
  private socketSub: Subscription | null = null;

  constructor(
    private api: Api,
    private socketService: SocketService,
    private router: Router,
  ) {
    console.log('Game constructor - initial state:', {
      ball: this.ball,
      rods: this.rods,
      config: this.config,
    });

    this.api.getGame().subscribe({
      next: (game) => {
        console.log('Game data received:', game);
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

        console.log('Game state after setting:', {
          ball: this.ball,
          rods: this.rods,
          config: this.config,
        });
      },
      error: (err) => {
        console.error('Failed to load game state:', err);
        this.router.navigate(['/']);
      },
    });
  }

  ngOnInit(): void {
    this.setupGameServiceSubscriptions();
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  private setupGameServiceSubscriptions(): void {
    this.socketSub = this.socketService
      .listen<GameEvent>('game.updated')
      .subscribe((event) => {
        if (
          event.eventType === 'position_update' ||
          event.eventType === 'goal_scored'
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

          // Log goal events
          if (event.eventType === 'goal_scored') {
            console.log('Goal scored! New score:', this.score);
          }
        }
      });
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
