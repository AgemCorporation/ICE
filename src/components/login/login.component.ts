
import { Component, inject, signal, computed, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, AppUser } from '../../services/data.service';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

@Component({
   selector: 'app-login',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, RouterLink],
   template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-y-auto transition-colors duration-300">
      
      <!-- Background Elements -->
      <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-900/20 blur-[120px] rounded-full"></div>
         <div class="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-brand-500/10 dark:bg-brand-900/20 blur-[100px] rounded-full"></div>
      </div>

      <!-- Theme Toggle (Top Right) -->
      <button (click)="themeService.toggle()" class="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all z-20">
         @if(themeService.isDark()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
         } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
         }
      </button>

         <!-- STANDARD LOGIN PORTAL -->
         <div class="flex flex-col gap-6 w-full max-w-sm relative z-10 py-8 animate-fade-in">
            <!-- Garage / Admin Login Card -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">
              
              <!-- Header -->
              <div class="text-center mb-8 flex flex-col items-center">
                 @if (dataService.platformConfig().logoUrl) {
                    <img [src]="dataService.platformConfig().logoUrl" class="h-16 w-auto object-contain mb-4">
                 } @else {
                    <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4 shadow-lg text-brand-600 dark:text-brand-500">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="size-6">
                          <path d="M501.1 395.7L384 278.6c-23.1-23.1-57.6-27.6-85.4-13.9L192 158.1V96L64 0 0 64l96 128h62.1l106.6 106.6c-13.6 27.8-9.2 62.3 13.9 85.4l117.1 117.1c14.6 14.6 38.2 14.6 52.7 0l52.7-52.7c14.5-14.6 14.5-38.2 0-52.7zM331.7 225c28.3 0 54.9 11 74.9 31l19.4 19.4c15.8-6.9 30.8-16.5 43.8-29.5 37.1-37.1 49.7-89.3 37.9-136.7-2.2-9-13.5-12.1-20.1-5.5l-74.4 74.4-67.9-11.3L334 98.9l74.4-74.4c6.6-6.6 3.4-17.9-5.7-20.2-47.4-11.7-99.6.9-136.6 37.9-28.5 28.5-41.9 66.1-41.2 103.6l82.1 82.1c8.1-1.9 16.5-2.9 24.7-2.9zm-103.9 82l-56.7-56.7L18.7 402.8c-25 25-25 65.5 0 90.5s65.5 25 90.5 0l123.6-123.6c-7.6-19.9-9.9-41.6-5-62.7zM64 472c-13.2 0-24-10.8-24-24 0-13.3 10.7-24 24-24s24 10.7 24 24c0 13.2-10.7 24-24 24z"/>
                       </svg>
                    </div>
                 }
                 <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">{{ dataService.platformConfig().appName || 'ICE BY MECATECH' }}</h1>
                 <p class="text-slate-500 dark:text-slate-400 text-xs">Portail de connexion unifié</p>
              </div>
      
              <!-- Login Form -->
              <form [formGroup]="loginForm" (ngSubmit)="onFormSubmit()" class="space-y-4 mb-6">
                 <div>
                    <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Adresse Email</label>
                    <input type="email" formControlName="email" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600" placeholder="exemple@autofix.ci">
                 </div>
                 <div>
                    <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Mot de passe</label>
                    <input type="password" formControlName="password" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600" placeholder="••••••••">
                 </div>
                 <button type="submit" class="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-500/20 text-sm">
                    Se connecter
                 </button>
              </form>

              <!-- Footer -->
              <div class="mt-8 text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                 <p class="text-[10px] text-slate-400 dark:text-slate-600">
                    © 2026 ICE BY MECATECH v1.0
                 </p>
              </div>
            </div>
         </div>
    </div>
  `,
   styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class LoginComponent {
   dataService = inject(DataService);
   themeService = inject(ThemeService);
   toastService = inject(ToastService);
   router = inject(Router);
   fb = inject(FormBuilder);
   cdr = inject(ChangeDetectorRef);

   @HostListener('click') onHostClick() { this.cdr.markForCheck(); }
   @HostListener('touchend') onHostTouch() { this.cdr.markForCheck(); }

   loginForm: FormGroup;
   isLoading = signal(false);

   constructor() {
      this.loginForm = this.fb.group({
         email: ['', [Validators.required, Validators.email]],
         password: ['', Validators.required]
      });
   }

   onFormSubmit() {
      if (this.loginForm.invalid) {
         this.loginForm.markAllAsTouched();
         return;
      }

      const { email, password } = this.loginForm.value;
      this.isLoading.set(true);

      // Server-side login via POST /api/auth/login
      this.dataService.loginWithCredentials(email, password).subscribe({
         next: (res) => {
            this.isLoading.set(false);
            this.login(res.user, res.token);
         },
         error: (err) => {
            this.isLoading.set(false);
            const msg = err?.error?.message || 'Identifiants incorrects';
            this.toastService.show(msg, 'error');
         }
      });
   }

   login(user: AppUser, token?: string) {
      this.dataService.loginAs(user, token);
      if (user.role === 'SuperAdmin' || user.role === 'Root') {
         this.router.navigate(['/super-admin']);
      } else {
         this.router.navigate(['/dashboard']);
      }
   }



   getRoleColor(role: string): string {
      switch (role) {
         case 'Admin': return 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white';
         case 'Manager': return 'bg-brand-100 text-brand-700 dark:bg-brand-600 dark:text-white';
         case 'Secretaire': return 'bg-purple-100 text-purple-700 dark:bg-purple-600 dark:text-white';
         case 'Mecanicien': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-600 dark:text-white';
         default: return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      }
   }
}
