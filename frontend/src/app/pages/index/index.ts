import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Header } from '../../components/header/header';
import { QueueComponent } from '../../components/queue/queue';
import { ScoreboardComponent } from '../../components/scoreboard/scoreboard';
import { GameFieldComponent } from '../../components/game-field/game-field';
import { PlayerRodComponent } from '../../components/player-rod/player-rod';
import { AuthService } from '../../services/auth';
import { Api } from '../../services/api';
import { User } from '../../types/user';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-index',
  imports: [
    Header,
    CommonModule,
    QueueComponent,
    ScoreboardComponent,
    GameFieldComponent,
    PlayerRodComponent,
  ],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index implements OnInit, OnDestroy {
  user!: User;
  isQueued: boolean = false;
  inGame: boolean = false;
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
      .listen<User[]>('queue.updated')
      .subscribe((queue) => {
        this.queue = queue;
      });

    this.socketService.listen('game.joined').subscribe((game) => {
      // TODO: handle game joined event
      this.isQueued = false;
      this.inGame = true;
      console.log('Game joined:', game);
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

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    this.socketService.emit('key.pressed', { key });
  }
}
