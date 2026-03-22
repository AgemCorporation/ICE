
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService, RepairOrder, Client, Vehicle } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col h-full">
       <!-- Header & Controls -->
       <div class="flex flex-col md:flex-row md:justify-between md:items-end mb-6 shrink-0 gap-4">
          <div>
             <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Planning Atelier</h1>
             <p class="text-slate-500 dark:text-slate-400">
                Gestion des ressources et affectation des travaux.
             </p>
          </div>
          
          <div class="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             @if (dataService.canCreateAppointment()) {
                <button (click)="openAppointmentModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-brand-600/20 whitespace-nowrap shrink-0">
                   <span>+ Nouveau RDV</span>
                </button>
             }

             <!-- Legend -->
             <div class="hidden xl:flex items-center gap-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg mr-2 shadow-sm text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Entretien</div>
                <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Standard</div>
                <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Diag/Complexe</div>
             </div>

             <!-- View Mode Switcher -->
             <div class="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <button (click)="viewMode.set('day')" [class]="viewMode() === 'day' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-3 py-1.5 rounded text-xs font-medium transition-all">Jour</button>
                <button (click)="viewMode.set('week')" [class]="viewMode() === 'week' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-3 py-1.5 rounded text-xs font-medium transition-all">Semaine</button>
                <button (click)="viewMode.set('month')" [class]="viewMode() === 'month' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-3 py-1.5 rounded text-xs font-medium transition-all">Mois</button>
             </div>

             <!-- Navigation -->
             <div class="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm items-center shrink-0">
                <button (click)="changeDate(-1)" class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>
                <span class="px-4 py-1 font-mono font-bold text-slate-900 dark:text-white min-w-[120px] md:min-w-[160px] text-center flex items-center justify-center border-x border-slate-200 dark:border-slate-800 mx-1 text-sm whitespace-nowrap">
                   @if (viewMode() === 'day') {
                      {{ currentDate() | date:'EEE dd MMM' }}
                   } @else if (viewMode() === 'week') {
                      {{ calendarDates()[0] | date:'dd MMM' }} - {{ calendarDates()[4] | date:'dd MMM' }}
                   } @else {
                      {{ currentDate() | date:'MMMM yyyy' | titlecase }}
                   }
                </span>
                <button (click)="changeDate(1)" class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                </button>
             </div>
          </div>
       </div>

       <div class="flex-1 flex gap-6 overflow-hidden relative">
          
          <!-- UNASSIGNED SIDEBAR (Hidden for Mechanics & on Mobile) -->
          @if (!dataService.isMechanicView()) {
             <div class="hidden lg:flex w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex-col overflow-hidden shrink-0 shadow-lg">
                <div class="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                   <h3 class="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      À Planifier
                      <span class="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">{{ unassignedRepairs().length }}</span>
                   </h3>
                   @if (dataService.canManagePlanning()) {
                      <p class="text-xs text-slate-500 mt-1">Glissez vers le planning pour assigner.</p>
                   }
                </div>
                
                <div class="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950/30" 
                     (dragover)="onDragOver($event)" 
                     (drop)="onDrop($event, null, null)"> <!-- Allow dropping back to unassign -->
                   
                   @for (repair of unassignedRepairs(); track repair.id) {
                      <div [draggable]="dataService.canManagePlanning()" (dragstart)="onDragStart($event, repair)" 
                           class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg hover:border-brand-500 hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing shadow-sm">
                         <div class="flex justify-between items-start mb-1">
                            <span class="font-bold text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{{ getVehiclePlate(repair.vehicleId) }}</span>
                            <span class="text-[10px] text-slate-500">{{ formatDateShort(repair.entryDate) }}</span>
                         </div>
                         <div class="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 truncate">{{ getVehicleName(repair.vehicleId) }}</div>
                         <div class="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 border-t border-slate-100 dark:border-slate-700/50 pt-1 mt-1">
                            {{ repair.description }}
                         </div>
                         <!-- Type Indicator -->
                         <div [class]="getInterventionColor(repair)" class="absolute left-0 top-3 bottom-3 w-1 rounded-r"></div>
                      </div>
                   }
                   
                   @if (unassignedRepairs().length === 0) {
                      <div class="text-center py-10 text-slate-500 italic text-xs">
                         Aucune réparation en attente d'attribution.
                      </div>
                   }
                </div>
             </div>
          }

          <!-- CALENDAR GRID -->
          <div class="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl min-w-0">
             
             <!-- LAYOUT: RESOURCE ROWS (Day & Week) -->
             @if (viewMode() !== 'month') {
                <div class="overflow-x-auto h-full flex flex-col">
                   <!-- Header Row (Dates) -->
                   <div class="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 min-w-[600px]"
                        [class.grid-cols-6]="viewMode() === 'week'"
                        [class.grid-cols-2]="viewMode() === 'day'"> <!-- grid-cols-2 for Day view (1 resource col + 1 content col) -->
                      
                      <div class="p-4 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                         <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Ressources</span>
                      </div>
                      @for (date of calendarDates(); track date) {
                         <div class="p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0" [class.bg-brand-50]="isToday(date)" [class.dark:bg-brand-900_10]="isToday(date)">
                            <div class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{{ date | date:'EEEE' }}</div>
                            <div class="text-lg font-bold text-slate-900 dark:text-white" [class.text-brand-600]="isToday(date)" [class.dark:text-brand-400]="isToday(date)">{{ date | date:'dd' }}</div>
                         </div>
                      }
                   </div>

                   <!-- Resources Rows -->
                   <div class="flex-1 overflow-y-auto bg-white dark:bg-slate-900/50 min-w-[600px]">
                      @for (mech of filteredMechanics(); track mech) {
                         <div class="grid border-b border-slate-200 dark:border-slate-800/50 min-h-[140px]"
                              [class.grid-cols-6]="viewMode() === 'week'"
                              [class.grid-cols-2]="viewMode() === 'day'">
                            
                            <!-- Resource Header -->
                            <div class="p-4 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center gap-2 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                               <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                                  {{ mech.charAt(0) }}
                               </div>
                               <span class="font-bold text-slate-700 dark:text-slate-200 text-sm truncate max-w-[80px] text-center">{{ mech }}</span>
                            </div>

                            <!-- Days Cells -->
                            @for (date of calendarDates(); track date) {
                               <div class="border-r border-slate-200 dark:border-slate-800/50 relative p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 group"
                                    [class.bg-brand-50_30]="isToday(date)"
                                    [class.dark:bg-brand-900_05]="isToday(date)"
                                    (dragover)="onDragOver($event)" 
                                    (drop)="onDrop($event, mech, date)">
                                  
                                  <!-- Drop Hint -->
                                  <div class="absolute inset-0 border-2 border-dashed border-brand-500/50 bg-brand-500/10 rounded m-1 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100" *ngIf="isDragging() && dataService.canManagePlanning()"></div>

                                  <!-- Appointments -->
                                  <div class="flex flex-col gap-2 relative z-10">
                                     @for (app of getAppointments(mech, date); track app.id) {
                                        <div [draggable]="dataService.canManagePlanning()" (dragstart)="onDragStart($event, app)"
                                             class="rounded p-2 border shadow-sm transition-transform select-none bg-white dark:bg-slate-800"
                                             [class.cursor-pointer]="dataService.canManagePlanning()"
                                             [class.hover:scale-[1.02]]="dataService.canManagePlanning()"
                                             [ngClass]="getInterventionStyle(app)">
                                           <div class="flex justify-between items-start">
                                              <span class="font-bold text-[10px] opacity-80">{{ app.id.substring(0,6) }}</span>
                                              <span class="text-[9px] font-mono bg-black/5 dark:bg-black/20 px-1 rounded">{{ getLaborDuration(app) }}h</span>
                                           </div>
                                           <div class="font-bold text-xs truncate my-0.5">{{ getVehicleName(app.vehicleId) }}</div>
                                           <div class="text-[10px] opacity-70 truncate">{{ app.description }}</div>
                                        </div>
                                     }
                                  </div>
                               </div>
                            }
                         </div>
                      }
                   </div>
                </div>
             } 
             
             <!-- LAYOUT: STANDARD MONTH GRID -->
             @else {
                <div class="overflow-x-auto h-full flex flex-col">
                   <!-- Month Header (Days of Week) -->
                   <div class="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 min-w-[700px]">
                      @for (dayName of ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']; track dayName) {
                         <div class="p-2 text-center text-xs font-bold text-slate-500 uppercase border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                            {{ dayName }}
                         </div>
                      }
                   </div>

                   <!-- Month Grid Cells -->
                   <div class="flex-1 overflow-y-auto bg-white dark:bg-slate-900/50 min-w-[700px]">
                      <div class="grid grid-cols-7 auto-rows-fr h-full min-h-[500px]">
                         @for (date of calendarDates(); track date) {
                            <div class="border-b border-r border-slate-200 dark:border-slate-800/50 p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800/20 group min-h-[100px]"
                                 [class.bg-slate-50]="!isSameMonth(date)"
                                 [class.dark:bg-slate-950]="!isSameMonth(date)"
                                 [class.opacity-50]="!isSameMonth(date)"
                                 [class.bg-brand-50]="isToday(date)"
                                 [class.dark:bg-brand-900_10]="isToday(date)"
                                 (dragover)="onDragOver($event)" 
                                 (drop)="onDrop($event, null, date)"> <!-- No mechanic in drop here, handle logic? -->
                               
                               <div class="text-right text-xs font-bold mb-2" [class.text-brand-600]="isToday(date)" [class.dark:text-brand-400]="isToday(date)" [class.text-slate-500]="!isToday(date)">
                                  {{ date | date:'dd' }}
                               </div>

                               <!-- Daily Appointments List (All mechanics or Filtered) -->
                               <div class="space-y-1">
                                  @for (app of getGlobalAppointments(date); track app.id) {
                                     <div [draggable]="dataService.canManagePlanning()" (dragstart)="onDragStart($event, app)"
                                          class="text-[10px] p-1 rounded border bg-white dark:bg-slate-800 flex items-center gap-1 truncate shadow-sm"
                                          [class.cursor-pointer]="dataService.canManagePlanning()"
                                          [class.hover:bg-slate-50]="dataService.canManagePlanning()"
                                          [class.dark:hover:bg-slate-700]="dataService.canManagePlanning()"
                                          [ngClass]="getInterventionStyle(app)">
                                        <div class="w-1.5 h-1.5 rounded-full shrink-0" [class]="getDotColor(app)"></div>
                                        <span class="font-bold shrink-0">{{ app.mechanic?.substring(0,1) || '?' }}</span>
                                        <span class="truncate opacity-80">{{ getVehicleName(app.vehicleId) }}</span>
                                     </div>
                                  }
                               </div>
                            </div>
                         }
                      </div>
                   </div>
                </div>
             }

          </div>
       </div>
    </div>

    <!-- Appointment Creation Modal -->
    @if (showAppointmentModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center">
                <span>Nouveau Rendez-vous</span>
                <button (click)="closeAppointmentModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
             </div>
             
             <form [formGroup]="appointmentForm" (ngSubmit)="submitAppointment()" class="p-6 space-y-4">
                
                <div>
                   <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Client</label>
                   <select formControlName="clientId" (change)="onClientChange()" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      <option value="">Sélectionner un client...</option>
                      @for (client of dataService.clients(); track client.id) {
                         <option [value]="client.id">{{ client.firstName }} {{ client.lastName }} {{ client.companyName ? '('+client.companyName+')' : '' }}</option>
                      }
                   </select>
                </div>

                <div>
                   <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Véhicule</label>
                   <select formControlName="vehicleId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white disabled:opacity-50" [attr.disabled]="!appointmentForm.get('clientId')?.value ? true : null">
                      <option value="">Sélectionner un véhicule...</option>
                      @for (vehicle of availableVehicles(); track vehicle.id) {
                         <option [value]="vehicle.id">{{ vehicle.brand }} {{ vehicle.model }} - {{ vehicle.plate }}</option>
                      }
                   </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Date & Heure</label>
                      <input type="datetime-local" formControlName="date" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Mécanicien (Optionnel)</label>
                      <select formControlName="mechanic" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         <option value="">-- À définir --</option>
                         @for (m of dataService.mechanics(); track m) {
                            <option [value]="m">{{ m }}</option>
                         }
                      </select>
                   </div>
                </div>

                <div>
                   <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Motif du rendez-vous</label>
                   <textarea formControlName="description" rows="2" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white" placeholder="Ex: Vidange, Bruit suspect..."></textarea>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closeAppointmentModal()" class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Annuler</button>
                   <button type="submit" [disabled]="appointmentForm.invalid" class="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-500 disabled:opacity-50">Confirmer RDV</button>
                </div>
             </form>
          </div>
       </div>
    }
  `
})
export class PlanningComponent {
  dataService: DataService = inject(DataService);
  toastService: ToastService = inject(ToastService);
  fb: FormBuilder = inject(FormBuilder);

  mechanicFilter = signal(''); // Empty means all
  
  viewMode = signal<'day' | 'week' | 'month'>('week');
  currentDate = signal(new Date());
  
  isDragging = signal(false);

  // Appointment Modal Logic
  showAppointmentModal = signal(false);
  appointmentForm: FormGroup;
  availableVehicles = signal<Vehicle[]>([]);

  constructor() {
     // Force Mechanic filter if Mechanic User
     effect(() => {
        if (this.dataService.isMechanicView()) {
           this.mechanicFilter.set(this.dataService.currentUser().firstName);
        }
     });

     this.appointmentForm = this.fb.group({
        clientId: ['', Validators.required],
        vehicleId: ['', Validators.required],
        date: ['', Validators.required],
        mechanic: [''],
        description: ['', Validators.required]
     });
  }

  // Computed Logic
  
  filteredMechanics = computed(() => {
     const filter = this.mechanicFilter();
     const allMechanics = this.dataService.mechanics();
     if (filter) {
        return allMechanics.filter(m => m === filter);
     }
     return allMechanics;
  });

  calendarDates = computed(() => {
     const curr = new Date(this.currentDate());
     const mode = this.viewMode();

     if (mode === 'day') {
        return [new Date(curr)];
     }

     if (mode === 'week') {
        // Mon-Fri (5 days)
        const day = curr.getDay(); // 0-6
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Mon
        const monday = new Date(curr);
        monday.setDate(diff);
        
        const week = [];
        for (let i = 0; i < 5; i++) {
           const d = new Date(monday);
           d.setDate(monday.getDate() + i);
           week.push(d);
        }
        return week;
     }

     if (mode === 'month') {
        // Full Month Grid (start on Mon, end on Sun, cover full month + padding)
        const year = curr.getFullYear();
        const month = curr.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const dayOfWeek = firstDayOfMonth.getDay(); // 0 Sun - 6 Sat
        
        // Calculate start date (Monday of the first week)
        const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(firstDayOfMonth.getDate() - startOffset);

        const days = [];
        // Generate 35 days (5 weeks) or 42 (6 weeks) to cover month
        // Usually 42 covers all scenarios
        for (let i = 0; i < 42; i++) {
           const d = new Date(startDate);
           d.setDate(startDate.getDate() + i);
           days.push(d);
        }
        return days;
     }

     return [];
  });

  unassignedRepairs = computed(() => {
     return this.dataService.repairs().filter(r => 
        r.status !== 'Clôturé' && (!r.mechanic || r.mechanic === '')
     );
  });

  assignedRepairs = computed(() => {
     return this.dataService.repairs().filter(r => 
        r.status !== 'Clôturé' && r.mechanic && r.mechanic !== ''
     );
  });

  // Helpers

  updateMechanicFilter(e: Event) {
     this.mechanicFilter.set((e.target as HTMLSelectElement).value);
  }

  changeDate(direction: number) {
     const newDate = new Date(this.currentDate());
     const mode = this.viewMode();

     if (mode === 'day') {
        newDate.setDate(newDate.getDate() + direction);
     } else if (mode === 'week') {
        newDate.setDate(newDate.getDate() + (direction * 7));
     } else if (mode === 'month') {
        newDate.setMonth(newDate.getMonth() + direction);
     }
     
     this.currentDate.set(newDate);
  }

  resetToToday() {
     this.currentDate.set(new Date());
  }

  isToday(date: Date): boolean {
     const today = new Date();
     return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
  }
  
  isSameMonth(date: Date): boolean {
     return date.getMonth() === this.currentDate().getMonth();
  }

  formatDateShort(isoDate: string) {
     return new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  getVehicleName(id: string) {
     const v = this.dataService.getVehicleById(id);
     return v ? `${v.brand} ${v.model}` : 'Inconnu';
  }
  
  getVehiclePlate(id: string) {
     const v = this.dataService.getVehicleById(id);
     return v ? v.plate : '---';
  }

  getLaborDuration(repair: RepairOrder): number {
     const hours = repair.items
        .filter(i => i.type === 'labor')
        .reduce((sum, i) => sum + i.quantity, 0);
     return hours > 0 ? hours : 1; 
  }

  // Visuals

  getInterventionColor(repair: RepairOrder): string {
     const hours = this.getLaborDuration(repair);
     const desc = repair.description.toLowerCase();
     
     if (desc.includes('diag') || desc.includes('panne') || desc.includes('moteur') || hours >= 4) {
        return 'bg-amber-500'; 
     }
     if (desc.includes('vidange') || desc.includes('entretien') || desc.includes('revision') || desc.includes('révision') || hours <= 1.5) {
        return 'bg-emerald-500'; 
     }
     return 'bg-blue-500'; 
  }
  
  getDotColor(repair: RepairOrder): string {
     const cls = this.getInterventionColor(repair);
     // Map bg class to simple color class if needed, or just reuse
     if (cls.includes('amber')) return 'bg-amber-400';
     if (cls.includes('emerald')) return 'bg-emerald-400';
     return 'bg-blue-400';
  }

  getInterventionStyle(repair: RepairOrder) {
     const colorClass = this.getInterventionColor(repair);
     if (colorClass === 'bg-amber-500') return 'border-amber-500/50 text-amber-700 dark:text-amber-100 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30';
     if (colorClass === 'bg-emerald-500') return 'border-emerald-500/50 text-emerald-700 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30';
     return 'border-blue-500/50 text-blue-700 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30';
  }

  // Used for Resource Rows (Day/Week)
  getAppointments(mechanic: string, date: Date) {
     return this.assignedRepairs().filter(r => {
        if (r.mechanic !== mechanic) return false;
        const rDate = new Date(r.entryDate);
        return rDate.getDate() === date.getDate() &&
               rDate.getMonth() === date.getMonth() &&
               rDate.getFullYear() === date.getFullYear();
     });
  }

  // Used for Month Grid (Global)
  getGlobalAppointments(date: Date) {
     const mechFilter = this.mechanicFilter();
     return this.assignedRepairs().filter(r => {
        if (mechFilter && r.mechanic !== mechFilter) return false;
        
        const rDate = new Date(r.entryDate);
        return rDate.getDate() === date.getDate() &&
               rDate.getMonth() === date.getMonth() &&
               rDate.getFullYear() === date.getFullYear();
     });
  }

  // Drag & Drop Logic

  onDragStart(event: DragEvent, repair: RepairOrder) {
     if (!this.dataService.canManagePlanning()) return;
     
     if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', repair.id);
        event.dataTransfer.effectAllowed = 'move';
        this.isDragging.set(true);
     }
  }

  onDragOver(event: DragEvent) {
     if (!this.dataService.canManagePlanning()) return;
     event.preventDefault(); 
     event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent, mechanic: string | null, date: Date | null) {
     if (!this.dataService.canManagePlanning()) return;
     
     event.preventDefault();
     this.isDragging.set(false);
     
     const repairId = event.dataTransfer?.getData('text/plain');
     if (!repairId) return;

     let targetMechanic = mechanic;
     const repair = this.dataService.repairs().find(r => r.id === repairId);
     
     if (!repair) return;

     if (!targetMechanic && this.viewMode() === 'month') {
        if (this.mechanicFilter()) {
           targetMechanic = this.mechanicFilter();
        } else if (repair.mechanic) {
           targetMechanic = repair.mechanic; 
        } else {
           this.toastService.show("Veuillez filtrer par mécanicien pour assigner dans la vue Mois", 'error');
           return;
        }
     }

     const newMechanic = targetMechanic || undefined; 
     let newDate = repair.entryDate;

     if (date) {
        const targetDate = new Date(date);
        targetDate.setHours(9, 0, 0, 0); 
        newDate = targetDate.toISOString();
     }

     this.dataService.scheduleRepair(repairId, newMechanic, newDate);

     if (targetMechanic) {
        this.toastService.show(`Planifié pour ${targetMechanic} le ${date?.toLocaleDateString('fr-FR')}`, 'success');
     } else if (!date) { // Dropped back to unassigned list
        this.toastService.show('Réparation retirée du planning', 'info');
     }
  }

  openAppointmentModal() {
     // Reset form with current date
     const now = new Date();
     // Adjust for local timezone offset to show correct time in input type="datetime-local"
     now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
     const dateStr = now.toISOString().slice(0, 16);

     this.appointmentForm.reset({
        clientId: '',
        vehicleId: '',
        date: dateStr,
        mechanic: '',
        description: ''
     });
     this.availableVehicles.set([]);
     this.showAppointmentModal.set(true);
  }

  closeAppointmentModal() {
     this.showAppointmentModal.set(false);
  }

  onClientChange() {
     const clientId = this.appointmentForm.get('clientId')?.value;
     if (clientId) {
        const vehicles = this.dataService.vehicles().filter(v => v.ownerId === clientId);
        this.availableVehicles.set(vehicles);
        this.appointmentForm.patchValue({ vehicleId: '' });
     } else {
        this.availableVehicles.set([]);
     }
  }

  submitAppointment() {
     if (this.appointmentForm.invalid) {
        this.toastService.show('Veuillez remplir tous les champs obligatoires', 'error');
        return;
     }

     const formVal = this.appointmentForm.value;
     const entryDate = new Date(formVal.date).toISOString();

     const newRepair: RepairOrder = {
        id: crypto.randomUUID(),
        vehicleId: formVal.vehicleId,
        clientId: formVal.clientId,
        status: 'En attente',
        entryDate: entryDate,
        description: formVal.description,
        mechanic: formVal.mechanic || undefined,
        items: [],
        checkIn: undefined,
        history: [{
           date: new Date().toISOString(),
           description: 'Rendez-vous planifié',
           user: this.dataService.currentUser().firstName
        }],
        downPayments: [],
        timeLogs: []
     };

     this.dataService.addRepair(newRepair);
     this.toastService.show('Rendez-vous créé avec succès', 'success');
     this.closeAppointmentModal();
  }
}
