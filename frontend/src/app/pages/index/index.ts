import { Component, OnInit } from '@angular/core';
import { Header } from '../../components/header/header';
import { QueueComponent } from '../../components/queue/queue';
import { AuthService } from '../../services/auth';
import { Api } from '../../services/api';
import { User } from '../../types/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-index',
  imports: [Header, CommonModule, QueueComponent],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index implements OnInit {
  user!: User;
  isQueued: boolean = false;
  queue: User[] = [];

  constructor(
    private authService: AuthService,
    private api: Api,
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe((user) => {
      this.user = user!;
      this.checkUserInQueue();
      this.printQueue();
    });
  }

  logout(): void {
    this.authService.logout();
  }

  addToQueue(): void {
    this.api.addToQueue(this.user).subscribe(() => {
      this.isQueued = true;
      this.printQueue();
    });
  }

  removeFromQueue(): void {
    this.api.removeFromQueue(this.user).subscribe(() => {
      this.isQueued = false;
      this.printQueue();
    });
  }

  printQueue(): void {
    this.api.getQueue().subscribe((response) => {
      this.queue = response.queue;
    });
  }

  checkUserInQueue(): void {
    this.api.isUserInQueue().subscribe((isInQueue) => {
      this.isQueued = isInQueue;
    });
  }
}
