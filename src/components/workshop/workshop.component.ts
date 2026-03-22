import { Component, inject, signal, computed, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DataService, AppUser } from '../../services/data.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

@Component({
   selector: 'app-workshop',
   standalone: true,
   imports: [CommonModule, RouterLink],
   template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-y-auto transition-colors duration-300">
      <!-- Background Elements -->
      <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-500/10 dark:bg-brand-900/20 blur-[120px] rounded-full"></div>
         <div class="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-900/20 blur-[100px] rounded-full"></div>
      </div>

      <!-- Theme Toggle -->
      <button (click)="themeService.toggle()" class="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all z-20">
         @if(themeService.isDark()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
         } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
         }
      </button>

      <div class="w-full h-screen flex flex-col p-4 animate-fade-in z-10 relative">
        <div class="flex justify-between items-center mb-8 shrink-0">
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">Accès Atelier</h1>
            <div class="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800">
               ID Garage: {{ tenantId() }}
            </div>
        </div>

        @if (isLoading()) {
            <div class="flex-1 flex flex-col items-center justify-center gap-4">
                <div class="w-12 h-12 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 dark:border-t-brand-500 rounded-full animate-spin"></div>
                <div class="text-slate-500 dark:text-slate-400 font-medium">Chargement des mécaniciens...</div>
            </div>
        } @else if (mechanics().length === 0) {
            <div class="flex-1 flex flex-col items-center justify-center gap-4">
                <div class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div class="text-xl font-bold text-slate-900 dark:text-white">Aucun mécanicien trouvé</div>
                <p class="text-slate-500 dark:text-slate-400">Ce garage n'a pas de mécanicien actif enregistré.</p>
                <a routerLink="/login" class="mt-4 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors">Retour à la connexion</a>
            </div>
        } @else {
            <!-- Mechanic Grid -->
            <div class="flex-1 overflow-y-auto">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto pb-20">
                    @for (mech of mechanics(); track mech.id) {
                        <button (click)="selectMechanic(mech)" class="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-500 hover:scale-105 transition-all shadow-xl aspect-square group active:scale-95">
                            <div class="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-700 dark:text-slate-300 group-hover:bg-brand-100 group-hover:text-brand-600 dark:group-hover:bg-brand-900 dark:group-hover:text-brand-400 transition-colors shadow-inner">
                                {{ mech.firstName.charAt(0) }}{{ mech.lastName.charAt(0) }}
                            </div>
                            <div class="text-center">
                                <div class="font-bold text-xl text-slate-900 dark:text-white mb-1">{{ mech.firstName }}</div>
                                <div class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ mech.lastName }}</div>
                            </div>
                        </button>
                    }
                </div>
            </div>
        }
      </div>

      <!-- PIN PAD MODAL -->
      @if (selectedMechanic()) {
         <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
            <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 dark:border-slate-800 flex flex-col items-center relative overflow-hidden">
               <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-brand-600"></div>
               
               <div class="w-24 h-24 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-3xl font-bold mb-6 shadow-iner ring-4 ring-white dark:ring-slate-900 z-10 -mt-2">
                  {{ selectedMechanic()?.firstName.charAt(0) }}{{ selectedMechanic()?.lastName.charAt(0) }}
               </div>
               
               <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">{{ selectedMechanic()?.firstName }}</h2>
               <p class="text-slate-500 dark:text-slate-400 text-sm mb-8">Veuillez entrer votre code PIN personnel.</p>
               
               <!-- Dots Display -->
               <div class="flex gap-5 mb-8">
                  @for (i of [0, 1, 2, 3]; track i) {
                     <div class="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 transition-all duration-300"
                          [class.bg-brand-500]="enteredPin().length > i"
                          [class.border-brand-500]="enteredPin().length > i"
                          [class.scale-110]="enteredPin().length > i">
                     </div>
                  }
               </div>

               <!-- Numpad -->
               <div class="grid grid-cols-3 gap-4 w-full mb-2">
                  @for (num of [1, 2, 3, 4, 5, 6, 7, 8, 9]; track num) {
                     <button (click)="enterPinDigit(num)" class="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-2xl font-bold text-slate-900 dark:text-white transition-all active:scale-95 shadow-sm border border-slate-200 dark:border-slate-700">
                        {{ num }}
                     </button>
                  }
                  <button (click)="closePinModal()" class="h-16 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium flex items-center justify-center transition-colors">
                     Annuler
                  </button>
                  <button (click)="enterPinDigit(0)" class="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-2xl font-bold text-slate-900 dark:text-white transition-all active:scale-95 shadow-sm border border-slate-200 dark:border-slate-700">
                     0
                  </button>
                  <button (click)="clearPin()" class="h-16 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center justify-center transition-colors">
                     Effacer
                  </button>
               </div>
            </div>
         </div>
      }
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
export class WorkshopComponent implements OnInit {
   dataService = inject(DataService);
   themeService = inject(ThemeService);
   toastService = inject(ToastService);
   router = inject(Router);
   route = inject(ActivatedRoute);
   http = inject(HttpClient);
   cdr = inject(ChangeDetectorRef);

   @HostListener('click') onHostClick() { this.cdr.markForCheck(); }
   @HostListener('touchend') onHostTouch() { this.cdr.markForCheck(); }

   tenantId = signal<string>('');
   mechanics = signal<any[]>([]);
   
   // Workshop Mode State
   selectedMechanic = signal<any | null>(null);
   enteredPin = signal<string>('');
   isLoading = signal(true);

   ngOnInit() {
      // 1. Get the tenant ID from the URL Route Param
      this.route.paramMap.subscribe(params => {
         const tid = params.get('tenantId');
         if (tid) {
            this.tenantId.set(tid);
            // 2. We store this globally so when the mechanic logs out, we know to send them back here!
            localStorage.setItem('kioskTenantId', tid);
            this.fetchMechanics(tid);
         } else {
            this.toastService.show('Identifiant de garage manquant.', 'error');
            this.router.navigate(['/login']);
         }
      });
   }

   fetchMechanics(tid: string) {
      this.isLoading.set(true);
      // Fetch public mechanics for this specific Tenant
      this.http.get<any[]>(`${this.dataService.apiUrl}/user/public/mechanics/${tid}`).subscribe({
         next: (data) => {
            this.mechanics.set(data);
            this.isLoading.set(false);
         },
         error: (err) => {
            console.error('Error fetching mechanics for kiosk', err);
            this.toastService.show('Garage introuvable ou erreur de chargement', 'error');
            this.isLoading.set(false);
         }
      });
   }

   selectMechanic(mech: any) {
      this.selectedMechanic.set(mech);
      this.enteredPin.set('');
   }

   closePinModal() {
      this.selectedMechanic.set(null);
      this.enteredPin.set('');
   }

   enterPinDigit(digit: number) {
      if (this.enteredPin().length < 4) {
         this.enteredPin.update(p => p + digit.toString());

         // Auto submit on 4th digit
         if (this.enteredPin().length === 4) {
            setTimeout(() => this.verifyPin(), 300);
         }
      }
   }

   clearPin() {
      this.enteredPin.set('');
   }

   verifyPin() {
      const user = this.selectedMechanic();
      const pin = this.enteredPin();

      if (!user) return;

      this.toastService.show('Vérification du code...', 'info');

      // Server-side PIN validation via POST /api/auth/pin-login
      this.dataService.loginWithPin(user.id, pin).subscribe({
         next: (res) => {
            this.toastService.show(`Bienvenue, ${user.firstName}`, 'success');
            // Log in using DataService (which applies auth_token globally)
            this.dataService.loginAs(res.user, res.token);
            // Navigate directly to Dashboard
            this.router.navigate(['/dashboard']);
         },
         error: (err) => {
            const msg = err?.error?.message || 'Code PIN incorrect';
            this.toastService.show(msg, 'error');
            this.enteredPin.set('');
         }
      });
   }
}
