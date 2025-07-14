import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../types/user';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queue.html',
  styleUrl: './queue.scss',
})
export class QueueComponent {
  @Input() user!: User;
  @Input() isQueued: boolean = false;
  @Input() isInGame: boolean = false;
  @Input() queue: User[] = [];
  @Output() addToQueue = new EventEmitter<User>();
  @Output() removeFromQueue = new EventEmitter<User>();

  onAddToQueue() {
    this.addToQueue.emit(this.user);
  }

  onRemoveFromQueue() {
    this.removeFromQueue.emit(this.user);
  }
}
