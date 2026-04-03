import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  private lastMessages: Map<string, number> = new Map();

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Deduplicate: skip if same message was shown within 2 seconds
    const now = Date.now();
    const lastTime = this.lastMessages.get(message);
    if (lastTime && now - lastTime < 2000) return;
    this.lastMessages.set(message, now);

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    const toast: Toast = { id, message, type };
    
    this.toasts.update(current => [...current, toast]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      this.remove(id);
      this.lastMessages.delete(message);
    }, 4000);
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}