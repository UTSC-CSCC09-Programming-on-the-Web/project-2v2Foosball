import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.scss',
})
export class ScoreboardComponent {
  @Input({ required: true }) score!: { team1: number; team2: number };
  @Input() maxScore: number = 5;

  constructor() {}
}
