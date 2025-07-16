import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameData } from '../../types/game';

@Component({
  selector: 'app-game-list',
  imports: [],
  templateUrl: './game-list.html',
  styleUrl: './game-list.scss',
})
export class GameList {
  @Input({ required: true }) games!: GameData[];
  @Output() clicked = new EventEmitter<string>();

  constructor() {}

  getGameDuration(startTime: string): string {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onClick(gameId: string): void {
    this.clicked.emit(gameId);
  }
}
