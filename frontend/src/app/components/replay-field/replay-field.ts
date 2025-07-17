import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { BallState, PlayerRodState, GameConfig } from '../../types/game';

@Component({
  selector: 'app-replay-field',
  imports: [],
  templateUrl: './replay-field.html',
  styleUrl: './replay-field.scss',
})
export class ReplayFieldComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @ViewChild('replayCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animationFrame!: number;
  private canvas!: HTMLCanvasElement;

  // Game state tracking for replay simulation
  private goalJustScored = false;

  // Game state inputs - these will be updated directly from replay actions
  @Input({ required: true }) ball!: BallState;
  @Input({ required: true }) rods!: {
    team1: PlayerRodState[];
    team2: PlayerRodState[];
  };
  @Input({ required: true }) config!: GameConfig;

  @Output() showGoalCelebration = new EventEmitter<null>();

  constructor() {}

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;

    if (!this.ctx) {
      console.error('Could not get 2D context from canvas');
      return;
    }

    this.setupCanvas();
    this.startReplayLoop();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // No need for interpolation targets anymore
    // Just redraw when inputs change
    if (this.ctx) {
      this.draw();
    }
  }

  private setupCanvas(): void {
    // Set canvas size based on config
    this.canvas.width = this.config.fieldWidth;
    this.canvas.height = this.config.fieldHeight;
    this.ctx.imageSmoothingEnabled = true;
  }

  public onResize(): void {
    this.draw();
  }

  private startReplayLoop(): void {
    const replayLoop = () => {
      this.update();
      this.draw();
      this.animationFrame = requestAnimationFrame(replayLoop);
    };
    replayLoop();
  }

  private update(): void {
    if (!this.ball || !this.rods || !this.rods.team1 || !this.rods.team2) {
      return;
    }

    // Update ball physics
    this.updateBallPhysics();

    // Check collisions and bounds
    this.checkBounds();
    this.checkCollisions();
    this.checkGoals();

    // Update rods
    this.updateRods('team1');
    this.updateRods('team2');
  }

  private updateBallPhysics(): void {
    const ball = this.ball;
    // Update ball position based on its velocity
    ball.x += ball.vx;
    ball.y += ball.vy;
  }

  private checkBounds(): void {
    const ball = this.ball;
    const { fieldWidth, fieldHeight, ballRadius } = this.config;

    const reflect = (pos: number, vel: number, min: number, max: number) => {
      if (pos < min + ballRadius) {
        pos = min + ballRadius;
        vel = Math.abs(vel);
      } else if (pos > max - ballRadius) {
        pos = max - ballRadius;
        vel = -Math.abs(vel);
      }
      return { pos, vel };
    };

    const xCheck = reflect(ball.x, ball.vx, 0, fieldWidth);
    const yCheck = reflect(ball.y, ball.vy, 0, fieldHeight);

    ball.x = xCheck.pos;
    ball.vx = xCheck.vel;
    ball.y = yCheck.pos;
    ball.vy = yCheck.vel;
  }

  private checkCollisions(): void {
    const ball = this.ball;

    // If the ball is on the left side of the field, check team1 rods
    if (ball.x < this.config.fieldWidth / 2) {
      this.rods.team1.forEach((rod) => {
        rod.figures.forEach((figure) => {
          const dx = ball.x - rod.x;
          const dy = ball.y - figure.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < this.config.ballRadius + this.config.figureRadius) {
            // Ball hits the figure (circle-circle collision)
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = Math.abs(speed * Math.cos(angle));
            ball.vy = speed * Math.sin(angle);
            // Move ball out of collision
            const overlap =
              this.config.ballRadius + this.config.figureRadius - distance;
            ball.x += overlap * Math.cos(angle);
            ball.y += overlap * Math.sin(angle);
          }
        });
      });
    } else {
      // Ball is on right side, check team2 rods
      this.rods.team2.forEach((rod) => {
        rod.figures.forEach((figure) => {
          const dx = ball.x - rod.x;
          const dy = ball.y - figure.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < this.config.ballRadius + this.config.figureRadius) {
            // Ball hits the figure (circle-circle collision)
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = -Math.abs(speed * Math.cos(angle));
            ball.vy = speed * Math.sin(angle);
            // Move ball out of collision
            const overlap =
              this.config.ballRadius + this.config.figureRadius - distance;
            ball.x += overlap * Math.cos(angle);
            ball.y += overlap * Math.sin(angle);
          }
        });
      });
    }
  }

  private checkGoals(): void {
    const ball = this.ball;
    const { fieldWidth, fieldHeight, goalWidth, goalHeight, ballRadius } =
      this.config;
    const leftGoalX = goalWidth / 2;
    const rightGoalX = fieldWidth - goalWidth / 2;
    const goalTop = fieldHeight / 2 - goalHeight / 2;
    const goalBottom = fieldHeight / 2 + goalHeight / 2;

    // Check if ball is in goal area
    const ballInLeftGoal =
      ball.x < leftGoalX + ballRadius &&
      ball.y >= goalTop &&
      ball.y <= goalBottom;

    const ballInRightGoal =
      ball.x > rightGoalX - ballRadius &&
      ball.y >= goalTop &&
      ball.y <= goalBottom;

    // If ball is not in any goal area, reset the goal flag
    if (!ballInLeftGoal && !ballInRightGoal) {
      this.goalJustScored = false;
      return;
    }

    // If a goal was already scored this round, don't score again
    if (this.goalJustScored) {
      return;
    }

    if (ballInLeftGoal || ballInRightGoal) {
      // Don't handle scoring here - let the parent handle it via replay actions
      // Just stop the ball to prevent it from bouncing around in the goal
      this.goalJustScored = true;
      this.showGoalCelebration.emit();
      ball.vx = 0;
      ball.vy = 0;
    }
  }

  private updateRods(team: 'team1' | 'team2'): void {
    this.rods[team].forEach((rod) => {
      const lambda = (figure: any) => {
        figure.y += rod.vy;

        // Ensure figures stay within the rod bounds
        if (figure.y < this.config.figureRadius) {
          figure.y = this.config.figureRadius;
          return false;
        } else if (
          figure.y >
          this.config.fieldHeight - this.config.figureRadius
        ) {
          figure.y = this.config.fieldHeight - this.config.figureRadius;
          return false;
        }
        return true;
      };

      if (rod.vy < 0) {
        for (let i = 0; i < rod.figures.length; i++) {
          if (!lambda(rod.figures[i])) {
            break;
          }
        }
      } else {
        for (let i = rod.figures.length - 1; i >= 0; i--) {
          if (!lambda(rod.figures[i])) {
            break;
          }
        }
      }
    });
  }

  private draw(): void {
    if (!this.ctx) return;

    this.clearCanvas();
    this.drawField();
    this.drawFieldMarkings();
    this.drawGoals();

    // Draw game objects
    if (this.ball && this.rods && this.rods.team1 && this.rods.team2) {
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

  private drawFigure(x: number, figure: any, color: string): void {
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
