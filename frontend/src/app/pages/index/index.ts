import { Component, OnInit } from '@angular/core';
import { Header } from '../../components/header/header';
import { AuthService } from '../../services/auth';
import { Api } from '../../services/api';
import { User } from '../../types/user';
// import { NgModule } from '@angular/core';
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
  ) {
    this.authService.getUser().subscribe((user) => {
      this.user = user!;
    });
  }

  ngOnInit(): void {
    this.checkUserInQueue();
  }

  logout(): void {
    this.authService.logout();
  }

  addToQueue(): void {
    this.api.addToQueue().subscribe((user) => {
      this.checkUserInQueue();
    });
  }

  removeFromQueue(): void {
    this.api.removeFromQueue().subscribe((user) => {
      this.checkUserInQueue();
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
