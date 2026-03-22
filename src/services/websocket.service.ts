import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private backendUrl = 'http://192.168.1.75:36864'; // Fallback base URL

  constructor() {}

  connect(url?: string) {
    if (this.socket) {
      if (this.socket.connected) return;
      this.socket.connect();
      return;
    }

    // Default to the provided URL or fallback to the development one
    const connectionUrl = url ? url.replace(/\/api$/, '') : this.backendUrl;

    this.socket = io(connectionUrl, {
      transports: ['websocket', 'polling'], // Fallback mechanism
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('🔗 WebSocket connected to:', connectionUrl);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket Connection Error:', err.message);
    });
  }

  on(eventName: string, callback: (data: any) => void) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(eventName, callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
