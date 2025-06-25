import { Component, OnInit, OnDestroy } from '@angular/core';
import { Header } from '../../components/header/header';
import { QueueComponent } from '../../components/queue/queue';
import { AuthService } from '../../services/auth';
import { Api } from '../../services/api';
import { User } from '../../types/user';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-index',
  imports: [Header, CommonModule, QueueComponent],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index implements OnInit, OnDestroy {
  user!: User;
  isQueued: boolean = false;
  queue: User[] = [];
  private queueSocketSub: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private api: Api,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe((user) => {
      this.user = user!;
      this.checkUserInQueue();
      this.printQueue();
    });

    this.queueSocketSub = this.socketService
      .listen<User[]>('queue.update')
      .subscribe((queue) => {
        this.queue = queue;
      });
  }

  ngOnDestroy(): void {
    this.queueSocketSub?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
  }

  addToQueue(): void {
    this.api.addToQueue(this.user).subscribe(() => {
      this.isQueued = true;
    });
  }

  removeFromQueue(): void {
    this.api.removeFromQueue(this.user).subscribe(() => {
      this.isQueued = false;
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
