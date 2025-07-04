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

  // game state
  @Input({ required: true }) ball!: BallState;
  @Input({ required: true }) rods!: {
    team1: PlayerRodState[];
    team2: PlayerRodState[];
  };
  @Input({ required: true }) config!: GameConfig;
  @Input({ required: true }) team!: 1 | 2;
  @Input({ required: true }) activeRod!: 1 | 2;

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
    this.startGameLoop();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  ngOnChanges(change: SimpleChanges): void {
    if (this.ctx) this.draw();
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

  private update(): void {
    this.updateRods(1);
    this.updateRods(2);
    this.updateBall();
    this.checkCollisions();
  }

  private updateRods(team: 1 | 2): void {
    this.rods[`team${team}`].forEach((rod) => {
      const lambda = (figure: FigureState) => {
        figure.y += rod.vy;

        // Ensure figures stay within the rod bounds
        if (figure.y < this.config.figureRadius) {
          figure.y = this.config.figureRadius;
          return false;
        } else if (
          figure.y >
          this.config.rodHeight - this.config.figureRadius
        ) {
          figure.y = this.config.rodHeight - this.config.figureRadius;
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

  private updateBall(): void {}

  private checkCollisions(): void {}

  private draw(): void {
    this.clearCanvas();
    this.drawField();
    this.drawFieldMarkings();
    this.drawGoals();
    this.drawRods();
    this.drawBall();
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
    // Ball shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(
      this.ball.x + 2,
      this.ball.y + 2,
      this.config.ballRadius,
      0,
      2 * Math.PI,
    );
    this.ctx.fill();

    // Ball body
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(
      this.ball.x,
      this.ball.y,
      this.config.ballRadius,
      0,
      2 * Math.PI,
    );
    this.ctx.fill();

    // Ball outline
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawRods(): void {
    // Draw team 1 rods (red team)
    this.rods.team1.forEach((rod, i) => {
      this.drawRod(rod, '#ff4444', this.team === 1 && this.activeRod - 1 === i);
    });

    // Draw team 2 rods (blue team)
    this.rods.team2.forEach((rod, i) => {
      this.drawRod(rod, '#4444ff', this.team === 2 && this.activeRod - 1 === i);
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
