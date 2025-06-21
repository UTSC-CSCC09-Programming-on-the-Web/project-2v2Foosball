import { Component, OnInit } from '@angular/core';
import { Header } from '../../components/header/header';
import { AuthService } from '../../services/auth';
import { Api } from '../../services/api';
import { User } from '../../types/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-index',
  imports: [Header, CommonModule],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index implements OnInit {
  user!: User;
  isQueued: boolean = false;

  constructor(
    private authService: AuthService,
    private api: Api,
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe((user) => {
      this.user = user!;
      this.checkUserInQueue();
    });
  }

  logout(): void {
    this.authService.logout();
  }

  addToQueue(user: User): void {
    this.api.addToQueue(user).subscribe(() => {
      this.isQueued = true;
    });  
  }

  removeFromQueue(user: User): void {
    this.api.removeFromQueue(user).subscribe(() => {
      this.isQueued = false;
    });
  }

  printQueue(): void {
    this.api.getQueue().subscribe((response) => {
      console.log('Current queue:', response.queue);
    });
  }

  checkUserInQueue(): void {
    this.api.isUserInQueue().subscribe((isInQueue) => {
      this.isQueued = isInQueue;
    });
  }
}
