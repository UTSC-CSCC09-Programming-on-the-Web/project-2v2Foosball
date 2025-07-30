import { Component, OnDestroy, OnInit } from '@angular/core';
import { ScoreboardComponent } from '../../components/scoreboard/scoreboard';
import { Celebrations } from '../../components/celebrations/celebrations';
import { ReplayFieldComponent } from '../../components/replay-field/replay-field';
import {
  BallState,
  GameConfig,
  GameInit,
  PlayerRodState,
} from '../../types/game';
import { Replay, ReplayService } from '../../services/replay.service';
import { SocketService } from '../../services/socket.service';
import { Router } from '@angular/router';
import {
  BallResetAction,
  GoalAction,
  PlayerInputAction,
  ReplayAction,
} from '../../types/replay';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-replay',
  imports: [ScoreboardComponent, Celebrations, ReplayFieldComponent],
  templateUrl: './replay.html',
  styleUrl: './replay.scss',
})
export class ReplayPage implements OnInit, OnDestroy {
  private replayStartedSub?: Subscription;
  private replayStateSub?: Subscription;
  private replayStoppedSub?: Subscription;
  private replayRewindSub?: Subscription;
  private replayGoalSub?: Subscription;
  private replayGameEndedSub?: Subscription;
  gameId: string | null = null;
  isConnected = false;
  isLoading = true;
  isPaused = false;
  error: string | null = null;

  // State received from backend
  ball: BallState = { x: 600, y: 250, vx: 0, vy: 0 };
  rods: { team1: PlayerRodState[]; team2: PlayerRodState[] } = {
    team1: [],
    team2: [],
  };
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
  score: { team1: number; team2: number } = { team1: 0, team2: 0 };
  showGameEndScreen: boolean = false;
  gameWinner: 1 | 2 | null = null;
  finalScore: { team1: number; team2: number } | null = null;
  showGoalCelebration: boolean = false;
  goalCelebrationTimer: any;

  constructor(
    private replayService: ReplayService,
    private socketService: SocketService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.replayStartedSub = this.socketService
      .listen('replay.started')
      .subscribe(() => {
        this.isLoading = false;
      });

    // Subscribe to replay.state updates from backend
    this.replayStateSub = this.socketService
      .listen<any>('replay.state')
      .subscribe((state) => {
        if (state) {
          this.ball = state.ball;
          this.rods = state.rods;
          this.config = state.config;
          this.score = state.score;
        }
      });

    this.replayStoppedSub = this.socketService
      .listen<any>('replay.stopped')
      .subscribe(() => {});

    // Subscribe to goal events to trigger celebrations
    this.replayGoalSub = this.socketService
      .listen<any>('replay.goal')
      .subscribe((goalData) => {
        if (goalData) {
          this.triggerGoalCelebration();
        }
      });

    // Subscribe to game end events to show post-game overlay
    this.replayGameEndedSub = this.socketService
      .listen<any>('replay.game_ended')
      .subscribe((gameEndData) => {
        if (gameEndData) {
          this.handleGameEnd(gameEndData);
        }
      });
  }

  ngOnDestroy(): void {
    this.replayStartedSub?.unsubscribe();
    this.replayStateSub?.unsubscribe();
    this.replayStoppedSub?.unsubscribe();
    this.replayRewindSub?.unsubscribe();
    this.replayGoalSub?.unsubscribe();
    this.replayGameEndedSub?.unsubscribe();
    this.socketService.emit('replay.stop');

    // Clear goal celebration timer
    if (this.goalCelebrationTimer) {
      clearTimeout(this.goalCelebrationTimer);
    }
  }

  private onError(error: string) {
    this.error = error;
    this.isLoading = false;
  }

  private handleGameEnd(gameEndData: any): void {
    // Hide any goal celebration
    this.showGoalCelebration = false;
    if (this.goalCelebrationTimer) {
      clearTimeout(this.goalCelebrationTimer);
    }

    // Set up game end screen data
    this.gameWinner = gameEndData.winner;
    this.finalScore = gameEndData.finalScore;

    // Show the game end screen
    this.showGameEndScreen = true;
  }

  triggerGoalCelebration(): void {
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

  goBack(): void {
    this.router.navigate(['/']);
  }

  pauseReplay(): void {
    this.isPaused = true;
    this.replayService.pauseReplay();
  }

  resumeReplay(): void {
    this.isPaused = false;
    this.replayService.resumeReplay();
  }

  stopReplay(): void {
    this.replayService.stopReplay();
    this.router.navigate(['/']);
  }

  rewindReplay(): void {
    this.replayService.rewindReplay();
  }
}
