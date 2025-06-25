import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    console.log('Connecting to Socket.IO at:', environment.socketUrl);
    this.socket = io(environment.socketUrl); // Connect to root URL for Socket.IO

    this.socket.on('connect', () => {
      console.log('Socket.IO connected successfully');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
  }

  // Listening for an event
  listen<T>(eventName: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });
    });
  }

  // Emit an event
  emit(eventName: string, data?: any) {
    this.socket.emit(eventName, data);
  }

  // Optionally, disconnect
  disconnect() {
    this.socket.disconnect();
  }
}
