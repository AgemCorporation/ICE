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
  private activeTimeout: any = null;

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    const toast: Toast = { id, message, type };
    
    // Only show one toast at a time — replace previous
    if (this.activeTimeout) clearTimeout(this.activeTimeout);
    this.toasts.set([toast]);

    // Auto remove after 3 seconds
    this.activeTimeout = setTimeout(() => {
      this.remove(id);
      this.activeTimeout = null;
    }, 4000);
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}