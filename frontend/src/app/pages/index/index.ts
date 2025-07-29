import { Component, OnInit, OnDestroy } from '@angular/core';
import { Header } from '../../components/header/header';
import { QueueComponent } from '../../components/queue/queue';
import { SpectatorListComponent } from '../../components/spectator-list/spectator-list';
import { AuthService } from '../../services/auth';
import { Api } from '../../services/api';
import { User } from '../../types/user';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ReplayComponent } from '../../components/replay-list/replay-list';

@Component({
  selector: 'app-index',
  imports: [
    Header,
    CommonModule,
    QueueComponent,
    SpectatorListComponent,
    ReplayComponent,
  ],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index implements OnInit, OnDestroy {
  user!: User;
  isQueued: boolean = false;
  isInGame: boolean = false;
  queue: User[] = [];
  private queueSocketSub: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private api: Api,
    private socketService: SocketService,
    private router: Router,
  ) {
    authService.getUser().subscribe((user) => {
      this.user = user;
    });
  }

  ngOnInit(): void {
    this.checkUserInQueue();
    this.checkUserInGame();
    this.printQueue();

    this.queueSocketSub = this.socketService
      .listen<User[]>('queue.updated')
      .subscribe((queue) => {
        this.queue = queue;
      });

    this.socketService.listen('game.joined').subscribe((game) => {
      this.isQueued = false;
      this.router.navigate(['/game']);
    });
  }

  ngOnDestroy(): void {
    this.queueSocketSub?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
  }

  addToQueue(): void {
    this.socketService.emit('queue.join');
    this.isQueued = true;
  }

  removeFromQueue(): void {
    this.socketService.emit('queue.leave');
    this.isQueued = false;
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

  checkUserInGame(): void {
    this.api.isUserInGame().subscribe((isInGame) => {
      this.isInGame = isInGame;
    });
  }
}
