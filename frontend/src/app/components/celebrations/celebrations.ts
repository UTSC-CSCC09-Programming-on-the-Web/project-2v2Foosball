import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-celebrations',
  imports: [],
  templateUrl: './celebrations.html',
  styleUrl: './celebrations.scss',
})
export class Celebrations {
  @Input({ required: true }) showGoalCelebration: boolean = false;
  @Input({ required: true }) showGameEndScreen: boolean = false;

  @Input({ required: true }) gameWinner: 1 | 2 | null = null;
  @Input({ required: true }) finalScore: {
    team1: number;
    team2: number;
  } | null = null;

  constructor(private router: Router) {}

  returnToMainMenu(): void {
    // Navigate back to the main menu/queue page
    this.router.navigate(['/']);
  }
}
