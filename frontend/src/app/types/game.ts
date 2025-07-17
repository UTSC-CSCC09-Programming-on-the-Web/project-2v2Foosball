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
    | 'ball_repositioned'
    | 'game_ended'
    | 'initial_state';
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
  winner?: 1 | 2;
  finalScore?: {
    team1: number;
    team2: number;
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

export interface GameData {
  gameId: string;
  status: 'in_progress' | 'finished';
  createdAt: string;
  score: {
    team1: number;
    team2: number;
  };
  players: {
    team1: Array<{ userId: string; name: string; avatar: string }>;
    team2: Array<{ userId: string; name: string; avatar: string }>;
  };
  spectatorCount?: number;
}
