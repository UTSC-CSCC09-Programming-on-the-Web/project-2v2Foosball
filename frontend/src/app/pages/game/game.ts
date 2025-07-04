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
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  };
  rods: { team1: PlayerRodState[]; team2: PlayerRodState[] } = {
    team1: [],
    team2: [],
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
        if (event.eventType === 'position_update') {
          if (event.gameState.ball) {
            const dx = event.gameState.ball.x - this.ball.x;
            const dy = event.gameState.ball.y - this.ball.y;

            if (
              Math.abs(dx) > this.config.ballSpeed ||
              Math.abs(dy) > this.config.ballSpeed
            ) {
              console.log('Ball out of sync');
              this.ball.x = event.gameState.ball.x;
              this.ball.y = event.gameState.ball.y;
              this.ball.vx = event.gameState.ball.vx;
              this.ball.vy = event.gameState.ball.vy;
            }
          }
          if (event.gameState.team1?.rods) {
            for (let i = 0; i < event.gameState.team1.rods.length; i++) {
              const rod = event.gameState.team1.rods[i];

              const dx = Math.abs(rod.x - this.rods.team1[i].x);

              if (dx > this.config.rodWidth) {
                console.log('Team1 rod out of sync');
                this.rods.team1[i].x = rod.x;
                this.rods.team1[i].vy = rod.vy;
                this.rods.team1[i].figureCount = rod.figureCount;
                this.rods.team1[i].figures = rod.figures;
              }
            }
          }
          if (event.gameState.team2?.rods) {
            for (let i = 0; i < event.gameState.team2.rods.length; i++) {
              const rod = event.gameState.team2.rods[i];

              const dx = Math.abs(rod.x - this.rods.team1[i].x);

              if (dx > this.config.rodWidth) {
                console.log('Team2 rod out of sync');
                this.rods.team2[i].x = rod.x;
                this.rods.team2[i].vy = rod.vy;
                this.rods.team2[i].figureCount = rod.figureCount;
                this.rods.team2[i].figures = rod.figures;
              }
            }
          }
          // this.updateGameState(event.gameState);
        } else if (event.eventType === 'direction_update') {
          if (event.gameState.team1?.rods) {
            this.rods.team1[0].vy = event.gameState.team1.rods[0].vy;
            this.rods.team1[1].vy = event.gameState.team1.rods[1].vy;
          }
          if (event.gameState.team2?.rods) {
            this.rods.team2[0].vy = event.gameState.team2.rods[0].vy;
            this.rods.team2[1].vy = event.gameState.team2.rods[1].vy;
          }
        }
      });
  }

  onKeyPresses(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if (event.type === 'keydown') {
      if (key === 'a') {
        if (this.activeRod === 2) {
          this.activeRod = 1;
        }
      } else if (key === 'd') {
        if (this.activeRod === 1) {
          this.activeRod = 2;
        }
      } else {
        this.keystates.add(key);
        this.rods[`team${this.team}`][this.activeRod - 1].vy =
          key === 'w' ? -this.config.rodSpeed : this.config.rodSpeed;

        this.socketService.emit('game.keypress', {
          key: key,
          activeRod: this.activeRod,
          type: event.type,
        });
      }
    } else if (event.type === 'keyup') {
      this.keystates.delete(key);
      if (key === 'w' || key === 's') {
        this.rods[`team${this.team}`][this.activeRod - 1].vy = 0;

        this.socketService.emit('game.keypress', {
          key: key,
          activeRod: this.activeRod,
          type: event.type,
        });
      }
    }
  }
}
