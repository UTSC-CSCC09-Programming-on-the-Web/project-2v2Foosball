import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  BallState,
  PlayerRodState,
  GameConfig,
  FigureState,
} from '../../types/game';

@Component({
  selector: 'app-spectator-field',
  imports: [],
  templateUrl: './spectator-field.html',
  styleUrl: './spectator-field.scss',
})
export class SpectatorFieldComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @ViewChild('spectatorCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;

  // Game state inputs - these will be the delayed state from the backend
  @Input({ required: true }) ball!: BallState;
  @Input({ required: true }) rods!: {
    team1: PlayerRodState[];
    team2: PlayerRodState[];
  };
  @Input({ required: true }) config!: GameConfig;

  constructor() {}

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;

    if (!this.ctx) {
      console.error('Could not get 2D context from canvas');
      return;
    }

    this.setupCanvas();
    this.draw();
  }

  ngOnDestroy(): void {
    // No animation frame to cancel since we only draw on state changes
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.ctx) {
      this.draw();
    }
  }

  private setupCanvas(): void {
    // Set canvas size based on config
    this.canvas.width = this.config.fieldWidth;
    this.canvas.height = this.config.fieldHeight;
  }

  private draw(): void {
    if (!this.ctx) return;

    this.clearCanvas();
    this.drawField();
    this.drawFieldMarkings();
    this.drawGoals();
    this.drawBall();
    this.drawRods();
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.config.fieldWidth, this.config.fieldHeight);
  }

  private drawField(): void {
    const gradient = this.ctx.createLinearGradient(
      0,
      0,
      this.config.fieldWidth,
      0
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
      2 * Math.PI
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
      this.config.goalHeight
    );

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      0,
      goalTop,
      this.config.goalWidth,
      this.config.goalHeight
    );

    // Right goal
    this.ctx.fillRect(
      this.config.fieldWidth - this.config.goalWidth,
      goalTop,
      this.config.goalWidth,
      this.config.goalHeight
    );
    this.ctx.strokeRect(
      this.config.fieldWidth - this.config.goalWidth,
      goalTop,
      this.config.goalWidth,
      this.config.goalHeight
    );
  }

  private drawBall(): void {
    const ball = this.ball;

    // Ball shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(
      ball.x + 2,
      ball.y + 2,
      this.config.ballRadius,
      0,
      2 * Math.PI
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
    this.rods.team1.forEach((rod) => {
      this.drawRod(rod, '#ff4444', false);
    });

    // Draw team 2 rods (blue team)
    this.rods.team2.forEach((rod) => {
      this.drawRod(rod, '#4444ff', false);
    });
  }

  private drawRod(rod: PlayerRodState, color: string, active: boolean): void {
    // Draw the rod itself
    this.ctx.strokeStyle = active ? '#000000' : '#888888';
    this.ctx.lineWidth = this.config.rodWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(rod.x, 0);
    this.ctx.lineTo(rod.x, this.config.rodHeight);
    this.ctx.stroke();

    // Draw the figures on the rod
    rod.figures.forEach((figure) => {
      this.drawFigure(rod.x, figure, color);
    });
  }

  private drawFigure(x: number, figure: FigureState, color: string): void {
    // Figure shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x + 1, figure.y + 1, this.config.figureRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Figure body
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, figure.y, this.config.figureRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Figure outline
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Figure highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x - 3, figure.y - 3, this.config.figureRadius, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}
