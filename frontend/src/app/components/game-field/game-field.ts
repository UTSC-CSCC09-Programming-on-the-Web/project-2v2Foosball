import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewChecked,
  HostListener,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  BallState,
  FigureState,
  PlayerRodState,
  GameConfig,
} from '../../types/game';

interface InterpolatedBallState extends BallState {
  targetX: number;
  targetY: number;
}

interface InterpolatedFigureState extends FigureState {
  targetY: number;
}

interface InterpolatedPlayerRodState extends PlayerRodState {
  figures: InterpolatedFigureState[];
}

@Component({
  selector: 'app-game-field',
  imports: [],
  templateUrl: './game-field.html',
  styleUrl: './game-field.scss',
})
export class GameFieldComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animationFrame!: number;
  private canvas!: HTMLCanvasElement;

  // Interpolation properties
  private interpolatedBall!: InterpolatedBallState;
  private interpolatedRods!: {
    team1: InterpolatedPlayerRodState[];
    team2: InterpolatedPlayerRodState[];
  };
  private interpolationSpeed = 0.35; // For interpolation @ 30 FPS

  // game state
  @Input({ required: true }) ball!: BallState;
  @Input({ required: true }) rods!: {
    team1: PlayerRodState[];
    team2: PlayerRodState[];
  };
  @Input({ required: true }) config!: GameConfig;
  @Input({ required: true }) team!: 1 | 2;
  @Input({ required: true }) activeRod!: 1 | 2 | 3 | 4;
  @Input({ required: true }) rodPosition!: 'front' | 'back';

  @Output() keystate = new EventEmitter<KeyboardEvent>();

  constructor() {}

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;

    if (!this.ctx) {
      console.error('Could not get 2D context from canvas');
      return;
    }

    this.setupCanvas();
    this.initializeInterpolation();
    this.startGameLoop();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  ngOnChanges(change: SimpleChanges): void {
    if (this.ctx) {
      if (!this.interpolatedBall || !this.interpolatedRods) {
        this.initializeInterpolation();
      } else {
        this.updateInterpolationTargets();
      }
    } else {
      // If context isn't ready yet, we'll initialize on the next update cycle
      setTimeout(() => {
        if (this.ctx && (!this.interpolatedBall || !this.interpolatedRods)) {
          this.initializeInterpolation();
        }
      }, 0);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.repeat) {
      return;
    }
    if (['w', 'a', 's', 'd'].includes(event.key)) {
      event.preventDefault();
      this.keystate.emit(event);
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    if (['w', 'a', 's', 'd'].includes(event.key)) {
      event.preventDefault();
      this.keystate.emit(event);
    }
  }

  private setupCanvas(): void {
    this.canvas.width = this.config.fieldWidth;
    this.canvas.height = this.config.fieldHeight;
    this.ctx.imageSmoothingEnabled = true;
  }

  public onResize(): void {
    this.draw();
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      this.update();
      this.draw();
      this.animationFrame = requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }

  private initializeInterpolation(): void {
    // Ensure we have valid data before initializing
    if (!this.ball || !this.rods || !this.rods.team1 || !this.rods.team2) {
      return;
    }

    // Initialize interpolated ball state
    this.interpolatedBall = {
      ...this.ball,
      targetX: this.ball.x,
      targetY: this.ball.y,
    };

    // Initialize interpolated rod states
    this.interpolatedRods = {
      team1: this.rods.team1.map((rod) => ({
        ...rod,
        figures: rod.figures.map((figure) => ({
          ...figure,
          targetY: figure.y,
        })),
      })),
      team2: this.rods.team2.map((rod) => ({
        ...rod,
        figures: rod.figures.map((figure) => ({
          ...figure,
          targetY: figure.y,
        })),
      })),
    };
  }

  private updateInterpolationTargets(): void {
    if (!this.interpolatedBall || !this.interpolatedRods) {
      this.initializeInterpolation();
      return;
    }

    // Update ball targets
    this.interpolatedBall.targetX = this.ball.x;
    this.interpolatedBall.targetY = this.ball.y;
    this.interpolatedBall.vx = this.ball.vx;
    this.interpolatedBall.vy = this.ball.vy;

    // Update rod targets
    ['team1', 'team2'].forEach((team) => {
      const teamKey = team as 'team1' | 'team2';
      this.rods[teamKey].forEach((rod, rodIndex) => {
        if (this.interpolatedRods[teamKey][rodIndex]) {
          this.interpolatedRods[teamKey][rodIndex].vy = rod.vy;
          rod.figures.forEach((figure, figureIndex) => {
            if (this.interpolatedRods[teamKey][rodIndex].figures[figureIndex]) {
              this.interpolatedRods[teamKey][rodIndex].figures[
                figureIndex
              ].targetY = figure.y;
            }
          });
        }
      });
    });
  }

  private update(): void {
    if (!this.interpolatedBall || !this.interpolatedRods) {
      // Try to initialize if we have valid data
      if (this.ball && this.rods && this.rods.team1 && this.rods.team2) {
        this.initializeInterpolation();
      }
      return;
    }

    // Interpolate ball position
    this.interpolatedBall.x +=
      (this.interpolatedBall.targetX - this.interpolatedBall.x) *
      this.interpolationSpeed;
    this.interpolatedBall.y +=
      (this.interpolatedBall.targetY - this.interpolatedBall.y) *
      this.interpolationSpeed;

    // Interpolate figure positions
    ['team1', 'team2'].forEach((team) => {
      const teamKey = team as 'team1' | 'team2';
      this.interpolatedRods[teamKey].forEach((rod) => {
        rod.figures.forEach((figure) => {
          figure.y += (figure.targetY - figure.y) * this.interpolationSpeed;
        });
      });
    });
  }

  private draw(): void {
    this.clearCanvas();
    this.drawField();
    this.drawFieldMarkings();
    this.drawGoals();

    // Always ensure interpolation is initialized before drawing
    if (!this.interpolatedBall || !this.interpolatedRods) {
      if (this.ball && this.rods && this.rods.team1 && this.rods.team2) {
        this.initializeInterpolation();
      }
    }

    // Use interpolated rendering for smooth animation
    if (this.interpolatedBall && this.interpolatedRods) {
      this.drawBall();
      this.drawRods();
    }
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.config.fieldWidth, this.config.fieldHeight);
  }

  private drawField(): void {
    const gradient = this.ctx.createLinearGradient(
      0,
      0,
      this.config.fieldWidth,
      0,
    );
    gradient.addColorStop(0, '#2e7d32');
    gradient.addColorStop(0.5, '#4caf50');
    gradient.addColorStop(1, '#2e7d32');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.fieldWidth, this.config.fieldHeight);
  }

  private drawFieldMarkings(): void {
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;

    // Center line
    this.ctx.beginPath();
    this.ctx.moveTo(this.config.fieldWidth / 2, 0);
    this.ctx.lineTo(this.config.fieldWidth / 2, this.config.fieldHeight);
    this.ctx.stroke();

    // Center circle
    this.ctx.beginPath();
    this.ctx.arc(
      this.config.fieldWidth / 2,
      this.config.fieldHeight / 2,
      50,
      0,
      2 * Math.PI,
    );
    this.ctx.stroke();

    // Goal lines
    const goalLineLeftX = this.config.fieldWidth * 0.025;
    const goalLineRightX = this.config.fieldWidth * 0.975;

    this.ctx.beginPath();
    this.ctx.moveTo(goalLineLeftX, 0);
    this.ctx.lineTo(goalLineLeftX, this.config.fieldHeight);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(goalLineRightX, 0);
    this.ctx.lineTo(goalLineRightX, this.config.fieldHeight);
    this.ctx.stroke();
  }

  private drawGoals(): void {
    const goalTop = this.config.fieldHeight / 2 - this.config.goalHeight / 2;

    // Left goal
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(
      0,
      goalTop,
      this.config.goalWidth,
      this.config.goalHeight,
    );

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      0,
      goalTop,
      this.config.goalWidth,
      this.config.goalHeight,
    );

    // Right goal
    this.ctx.fillRect(
      this.config.fieldWidth - this.config.goalWidth,
      goalTop,
      this.config.goalWidth,
      this.config.goalHeight,
    );
    this.ctx.strokeRect(
      this.config.fieldWidth - this.config.goalWidth,
      goalTop,
      this.config.goalWidth,
      this.config.goalHeight,
    );
  }

  private drawBall(): void {
    const ball = this.interpolatedBall;

    // Ball shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(
      ball.x + 2,
      ball.y + 2,
      this.config.ballRadius,
      0,
      2 * Math.PI,
    );
    this.ctx.fill();

    // Ball body
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, this.config.ballRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Ball outline
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawRods(): void {
    // Draw team 1 rods (red team)
    this.interpolatedRods.team1.forEach((rod, i) => {
      const rodNumber = i + 1; // Convert 0-based index to 1-based rod number
      const isActiveRod = this.team === 1 && this.activeRod === rodNumber;
      const isControllableRod =
        this.team === 1 && this.isRodControllable(rodNumber);
      this.drawRod(rod, '#ff4444', isActiveRod, isControllableRod);
    });

    // Draw team 2 rods (blue team)
    this.interpolatedRods.team2.forEach((rod, i) => {
      const rodNumber = i + 1; // Convert 0-based index to 1-based rod number
      const isActiveRod = this.team === 2 && this.activeRod === rodNumber;
      const isControllableRod =
        this.team === 2 && this.isRodControllable(rodNumber);
      this.drawRod(rod, '#4444ff', isActiveRod, isControllableRod);
    });
  }

  // Helper method to check if a rod is controllable by the current player
  private isRodControllable(rodNumber: number): boolean {
    const allowedRods = this.rodPosition === 'front' ? [1, 2] : [3, 4];
    return allowedRods.includes(rodNumber);
  }

  private drawRod(
    rod: InterpolatedPlayerRodState,
    color: string,
    active: boolean,
    controllable: boolean = false,
  ): void {
    // Draw the rod itself with different styling based on status
    if (active) {
      this.ctx.strokeStyle = '#000000'; // Black for active rod
      this.ctx.lineWidth = this.config.rodWidth + 2; // Thicker for active
    } else if (controllable) {
      this.ctx.strokeStyle = '#ffffff'; // White for controllable rods
      this.ctx.lineWidth = this.config.rodWidth + 1; // Slightly thicker for controllable
    } else {
      this.ctx.strokeStyle = '#888888'; // Light gray for other rods
      this.ctx.lineWidth = this.config.rodWidth;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(rod.x, 0);
    this.ctx.lineTo(rod.x, this.config.rodHeight);
    this.ctx.stroke();

    // Draw the figures on the rod
    rod.figures.forEach((figure) => {
      this.drawFigure(rod.x, figure, color, active, controllable);
    });
  }

  private drawFigure(
    x: number,
    figure: InterpolatedFigureState,
    color: string,
    active: boolean = false,
    controllable: boolean = false,
  ): void {
    // Figure shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x + 1, figure.y + 1, this.config.figureRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Figure body - keep original team color
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, figure.y, this.config.figureRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Figure outline
    this.ctx.strokeStyle = active ? '#ffffff' : '#000000';
    this.ctx.lineWidth = active ? 2 : 1;
    this.ctx.beginPath();
    this.ctx.arc(x, figure.y, this.config.figureRadius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }
}
