export interface GameInit {
  config: GameConfig;
  state: GameState;
  meta: GameMeta;
}

export interface GameEvent {
  eventType:
    | 'position_update'
    | 'direction_update'
    | 'goal_scored'
    | 'game_resumed'
    | 'ball_repositioned';
  gameState: GameState;
}

export interface GameState {
  ball?: BallState;
  team1?: {
    rods?: PlayerRodState[];
    score?: number;
  };
  team2?: {
    rods?: PlayerRodState[];
    score?: number;
  };
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PlayerRodState {
  x: number;
  vy: number;
  figureCount: number;
  figures: FigureState[];
}

export interface FigureState {
  y: number;
}

export interface GameConfig {
  fieldWidth: number;
  fieldHeight: number;
  goalWidth: number;
  goalHeight: number;
  rodWidth: number;
  rodHeight: number;
  rodSpeed: number;
  ballRadius: number;
  ballSpeed: number;
  figureRadius: number;
  maxScore?: number;
}

export interface GameMeta {
  team: 1 | 2;
  activeRod: 1 | 2;
}
