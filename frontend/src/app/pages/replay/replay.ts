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
import { Router } from '@angular/router';
import {
  BallResetAction,
  GoalAction,
  PlayerInputAction,
  ReplayAction,
} from '../../types/replay';

@Component({
  selector: 'app-replay',
  imports: [ScoreboardComponent, Celebrations, ReplayFieldComponent],
  templateUrl: './replay.html',
  styleUrl: './replay.scss',
})
export class ReplayPage implements OnInit, OnDestroy {
  gameId: string | null = null;
  isConnected = false;
  isLoading = true;
  error: string | null = null;

  private replayActions: ReplayAction[] = [];
  private replayStartTime: number = 0;
  private nextActionIndex: number = 0;
  private replayDuration: number = 0;
  private currentReplayTime: number = 0;
  private animationFrame: any | null = null;

  // TODO: Implement replay controls
  isPlaying: boolean = true;
  private replaySpeed: number = 1.0;

  // Goal celebration
  showGoalCelebration: boolean = false;
  goalCelebrationTimer: any;
  score: { team1: number; team2: number } = {
    team1: 0,
    team2: 0,
  };
  private isFirstScoreUpdate: boolean = true;

  // Game end screen
  showGameEndScreen: boolean = false;
  gameWinner: 1 | 2 | null = null;
  finalScore: { team1: number; team2: number } | null = null;

  // Game state for child components - this will be updated with delayed state
  ball: BallState = {
    x: 600,
    y: 250,
    vx: -5,
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
    rodWidth: 6,
    rodHeight: 500,
    ballRadius: 10,
    figureRadius: 12,
    maxScore: 5,
    rodSpeed: 5,
    ballSpeed: 10,
  };

  constructor(private replayService: ReplayService, private router: Router) {}

  ngOnInit(): void {
    this.replayService.getCurrentGame().subscribe((gameId) => {
      this.gameId = gameId;

      if (!this.gameId) {
        this.onError(
          'No game selected. Please select a game from the games list.'
        );
        return;
      }
      this.setupReplay();
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private onError(error: string) {
    this.error = error;
    this.isLoading = false;
  }

  private setupReplay() {
    // fetch full list of replay actions
    if (!this.gameId) {
      this.onError(
        'No game selected. Please select a game from the games list.'
      );
      return;
    }

    this.replayService.getGameActions(this.gameId).subscribe({
      next: (actions) => {
        this.replayActions = actions;
        this.replayDuration = actions[actions.length - 1]?.elapsedMs || 0;
        this.replayStartTime = performance.now();
        this.isLoading = false;
        this.isPlaying = true;

        this.startReplayLoop();
      },
      error: (error) => {
        this.onError(error);
      },
    });
  }

  private startReplayLoop() {
    const replayLoop = () => {
      if (!this.isPlaying) return;

      const currentRealTime = performance.now();
      this.currentReplayTime =
        (currentRealTime - this.replayStartTime) * this.replaySpeed;

      // Process all actions that should have happened by now
      while (this.nextActionIndex < this.replayActions.length) {
        const nextAction = this.replayActions[this.nextActionIndex];
        if (this.currentReplayTime >= nextAction.elapsedMs) {
          this.processAction(nextAction);
          this.nextActionIndex++;
        } else {
          break;
        }
      }

      // Check if replay is finished
      if (this.nextActionIndex >= this.replayActions.length) {
        this.isPlaying = false;
        console.log('Replay finished');
        return;
      }

      this.animationFrame = requestAnimationFrame(replayLoop);
    };

    replayLoop();
  }

  private processAction(action: ReplayAction) {
    let data;
    console.log(
      `Processing action ${action.actionId} of type ${action.type} at ${action.elapsedMs} ms`
    );

    switch (action.type) {
      case 'game_start':
        data = action.data! as GameInit;
        this.config = data.config;
        this.rods = {
          team1: data.state.team1!.rods!,
          team2: data.state.team2!.rods!,
        };
        this.ball = { ...data.state.ball! };
        break;
      case 'player_input_start':
        data = action.data! as PlayerInputAction;
        this.updateRodMovement(data, true);
        break;
      case 'player_input_end':
        data = action.data! as PlayerInputAction;
        this.updateRodMovement(data, false);
        break;
      case 'ball_reset':
        data = action.data! as BallResetAction;
        this.ball = { ...data.ball };
        // reset rods too
        this.rods = {
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

        break;
      case 'goal':
        data = action.data! as GoalAction;
        this.score = {
          team1: data.score1,
          team2: data.score2,
        };
        break;
      case 'game_ended':
        this.showGameEndScreen = true;
        this.finalScore = this.score;
        this.gameWinner = this.score.team1 === 5 ? 1 : 2;
        this.isPlaying = false;
        break;
    }
  }

  private updateRodMovement(action: PlayerInputAction, isStart: boolean) {
    const team = action.team === 1 ? 'team1' : 'team2';
    const rodIndex = action.activeRod - 1;

    if (this.rods[team][rodIndex]) {
      if (isStart) {
        // Start movement
        this.rods[team][rodIndex].vy =
          action.key === 'w' ? -this.config.rodSpeed : this.config.rodSpeed;
      }
      // Stop movement
      else this.rods[team][rodIndex].vy = 0;
    }
    // Create new reference to trigger change detection
    this.rods = { ...this.rods };
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
}
