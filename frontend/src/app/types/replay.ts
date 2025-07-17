import { GameInit } from './game';

export interface PlayerInputAction {
  key: 'w' | 's';
  activeRod: 1 | 2;
  team: 1 | 2;
}

export interface GameEndedAction {
  winner: 1 | 2;
  finalScore: {
    team1: number;
    team2: number;
  };
}

export interface BallResetAction {
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
}

export interface GoalAction {
  score1: number;
  score2: number;
}

export interface ReplayAction {
  actionId: string;
  gameId: string;
  elapsedMs: number;
  type:
    | 'game_start'
    | 'player_input_start'
    | 'player_input_end'
    | 'game_ended'
    | 'ball_reset'
    | 'goal';
  data:
    | PlayerInputAction
    | GameEndedAction
    | BallResetAction
    | GoalAction
    | ReplayAction
    | GameInit
    | null;
}
