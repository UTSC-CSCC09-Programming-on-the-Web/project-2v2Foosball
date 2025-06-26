import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-player-rod',
  imports: [CommonModule],
  templateUrl: './player-rod.html',
  styleUrls: ['./player-rod.scss'],
})
export class PlayerRodComponent {
  @Input() figureCount: number = 3;
  @Input() rodHeight: number = 300;
  
  rodOffsetY = 0;
  private socketSub: Subscription | null = null;
  private movementStep = 10;

  getPositions(): number[] {
    // Temporary logic to calculate positions based on figureCount
    // TODO: Replace with either fix positioning for <5 figures or a better algorithm
    const spacing = 100 / (this.figureCount + 1);
    const shift = -spacing * 0.15; // Attempt to align
    const result = Array.from({ length: this.figureCount }, (_, i) => spacing * (i + 1) + shift);
    return result;
  }

  constructor(private socketService: SocketService) {}
  
  ngOnInit(): void {
    this.socketSub = this.socketService.listen<{ key: string; userId: string }>('key.pressed')
      .subscribe(({ key }) => {
        if (key === 'a') {
          this.rodOffsetY = this.rodOffsetY - this.movementStep;
        } else if (key === 's') {
          this.rodOffsetY = this.rodOffsetY + this.movementStep;
        }
      });
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }
}