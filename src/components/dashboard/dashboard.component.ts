import { Component, inject, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, RepairOrder } from '../../services/data.service';
import { RouterLink, Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Tableau de bord</h1>
      <p class="text-slate-500 dark:text-slate-400">
         @if(dataService.isMechanicView()) {
            Bonjour {{ dataService.currentUser().firstName }}, voici vos interventions assignées.
         } @else {
            Vue d'ensemble de l'activité du garage.
         }
      </p>
    </header>

    <!-- ADMIN / SECRETARY DASHBOARD -->
    @if (!dataService.isMechanicView()) {
       <!-- Stats Grid -->
       <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         
         <!-- CA (Permission: view_dashboard_revenue) -->
         @if (dataService.hasPermission('view_dashboard_revenue')) {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-brand-500/50 transition-all shadow-sm">
              <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-24 text-brand-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Chiffre d'Affaires</h3>
              <div class="text-3xl font-bold text-slate-900 dark:text-white mb-2">{{ formatMoney(dataService.monthlyRevenue()) }}</div>
              <div class="flex items-center text-emerald-600 dark:text-emerald-500 text-sm gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd" />
                </svg>
                <span>+12% vs mois dernier</span>
              </div>
            </div>
         }

         <!-- Active Repairs (Permission: view_dashboard_repairs_stats) -->
         @if (dataService.hasPermission('view_dashboard_repairs_stats')) {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-sm">
               <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-24 text-blue-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.794-.47l-2.69-2.689a1.5 1.5 0 010-2.12l.137-.138a5.292 5.292 0 017.5 7.483L10.749 10.8z" />
                </svg>
              </div>
              <h3 class="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Véhicules à l'atelier</h3>
              <div class="text-3xl font-bold text-slate-900 dark:text-white mb-2">{{ dataService.activeRepairsCount() }}</div>
              <div class="flex items-center text-slate-500 text-sm gap-1">
                <a routerLink="/repairs" class="hover:text-blue-500 underline decoration-dotted">Voir le planning</a>
              </div>
            </div>
         }

         <!-- Stock Alerts (Permission: view_dashboard_stock_alerts) -->
         @if (dataService.hasPermission('view_dashboard_stock_alerts')) {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-red-500/50 transition-all shadow-sm">
               <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-24 text-red-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 class="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Alertes Stock</h3>
              <div class="text-3xl font-bold text-slate-900 dark:text-white mb-2">{{ dataService.lowStockParts().length }}</div>
              <div class="flex items-center text-red-500 dark:text-red-400 text-sm gap-1">
                <span>Références critiques</span>
              </div>
            </div>
         }

         <!-- Clients (Permission: view_dashboard_client_stats) -->
         @if (dataService.hasPermission('view_dashboard_client_stats')) {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-sm">
               <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-24 text-purple-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 class="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Base Clients</h3>
              <div class="text-3xl font-bold text-slate-900 dark:text-white mb-2">{{ dataService.clients().length }}</div>
              <div class="flex items-center text-slate-500 text-sm gap-1">
                <span>Actifs</span>
              </div>
            </div>
         }
       </div>

       <!-- OPERATIONAL WIDGETS -->
       <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <!-- Planning Widget -->
          @if (dataService.hasPermission('view_dashboard_planning')) {
             <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-full">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                   <div class="flex items-center gap-2">
                      <span class="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                      Rendez-vous du Jour
                   </div>
                   <span class="text-xs font-normal text-slate-500">{{ today | date:'dd MMMM' }}</span>
                </h3>
                
                <div class="flex-1 overflow-y-auto space-y-3 max-h-64">
                   @for (appt of dataService.todaysAppointments(); track appt.id) {
                      <div class="flex gap-3 items-start p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-l-2" [class.border-l-indigo-500]="appt.status === 'En attente'" [class.border-l-emerald-500]="appt.status === 'Terminé' || appt.status === 'Clôturé'" [class.border-l-amber-500]="appt.status === 'En cours'">
                         <div class="text-center min-w-[3rem]">
                            <div class="font-bold text-slate-900 dark:text-white">{{ appt.entryDate | date:'HH:mm' }}</div>
                            <span class="text-[10px] text-slate-500 uppercase">{{ appt.status }}</span>
                         </div>
                         <div class="flex-1 min-w-0">
                            <div class="font-bold text-slate-800 dark:text-slate-200 truncate">{{ getVehicleName(appt.vehicleId) }}</div>
                            <div class="text-xs text-slate-500 truncate">{{ appt.description }}</div>
                         </div>
                      </div>
                   }
                   @if (dataService.todaysAppointments().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-sm">Aucun rendez-vous prévu aujourd'hui.</div>
                   }
                </div>
                
                @if (dataService.repairsToInvoice().length > 0) {
                   <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div class="text-xs font-bold text-slate-500 uppercase mb-2">Restitutions en attente (Terminés)</div>
                      <div class="flex flex-wrap gap-2">
                         @for (rep of dataService.repairsToInvoice(); track rep.id) {
                            <span class="inline-flex items-center px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                               {{ getVehiclePlate(rep.vehicleId) }}
                            </span>
                         }
                      </div>
                   </div>
                }
             </div>
          }

          <!-- Billing Widget -->
          @if (dataService.hasPermission('view_dashboard_billing')) {
             <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-full border-t-4 border-t-purple-500">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   Dossiers À Facturer
                </h3>
                
                <div class="flex-1 overflow-y-auto space-y-2 max-h-64">
                   @for (rep of dataService.repairsToInvoice(); track rep.id) {
                      <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800">
                         <div>
                            <div class="font-bold text-sm text-slate-900 dark:text-white">{{ getClientName(rep.clientId) }}</div>
                            <div class="text-xs text-slate-500">{{ getVehicleName(rep.vehicleId) }}</div>
                         </div>
                         <button (click)="goToRepair(rep.id)" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded shadow-sm transition-colors">
                            Facturer
                         </button>
                      </div>
                   }
                   @if (dataService.repairsToInvoice().length === 0) {
                      <div class="text-center py-8 text-slate-400 text-sm">Tout est à jour ! Aucune facture en attente.</div>
                   }
                </div>
             </div>
          }

          <!-- Leads & Reputation Widget (Combined or Separate) -->
          @if (dataService.hasPermission('view_dashboard_leads')) {
             <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-full border-t-4 border-t-amber-500 relative overflow-hidden">
                <!-- Background Decoration -->
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>

                <div class="flex justify-between items-center mb-4 relative z-10">
                   <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Pro Devis
                   </h3>
                   <button (click)="goToOpportunities()" class="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline">Voir tout</button>
                </div>
                
                <!-- New Leads -->
                <div class="flex-1 overflow-y-auto space-y-3 max-h-40 relative z-10 mb-4">
                   @for (lead of dataService.newLeads(); track lead.id) {
                      <div class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:border-amber-400 transition-colors group">
                         <div class="flex justify-between items-start mb-1">
                            <span class="font-bold text-sm text-slate-900 dark:text-white">{{ lead.vehicleBrand }} {{ lead.vehicleModel }}</span>
                            <span class="text-[10px] text-slate-400">{{ lead.assignedDate | date:'dd/MM' }}</span>
                         </div>
                         <p class="text-xs text-slate-500 line-clamp-1 italic">"{{ lead.description }}"</p>
                      </div>
                   }
                   @if (dataService.newLeads().length === 0) {
                      <div class="text-center py-4 text-slate-400 text-xs">Aucune nouvelle demande de devis.</div>
                   }
                </div>

                <!-- Rating / Reviews Section (Visible for Admin/Manager) -->
                <div class="pt-3 border-t border-slate-100 dark:border-slate-800 relative z-10">
                   <div class="flex justify-between items-center mb-2">
                      <span class="text-xs font-bold text-slate-500 uppercase">Satisfaction Client</span>
                      @if (garageRating()) {
                         <div class="flex text-amber-400 text-xs">
                            @for(i of [1,2,3,4,5]; track i) { <span [class.text-slate-300]="i > garageRating()!.rating">★</span> }
                            <span class="text-slate-400 ml-1">({{ garageRating()!.count }})</span>
                         </div>
                      }
                   </div>
                   
                   @if (dataService.garageReviews().length > 0) {
                      <div class="space-y-2 max-h-32 overflow-y-auto">
                         @for (review of dataService.garageReviews().slice(0, 3); track review.id) {
                            <div class="text-xs p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-100 dark:border-slate-800">
                               <div class="flex justify-between mb-1">
                                  <span class="font-bold text-slate-700 dark:text-slate-300">{{ review.motoristName }}</span>
                                  <div class="flex text-amber-400 text-[10px]">
                                     @for(i of [1,2,3,4,5]; track i) { <span [class.text-slate-200]="i > review.clientRating!">★</span> }
                                  </div>
                               </div>
                               <p class="italic text-slate-500">"{{ review.clientReview }}"</p>
                            </div>
                         }
                      </div>
                   } @else {
                      <p class="text-[10px] text-slate-400 italic">Aucun avis reçu pour le moment.</p>
                   }
                </div>
             </div>
          }
       </div>

       <!-- ... EXISTING BOTTOM SECTION ... -->
       <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <!-- Low Stock List (Permission: view_dashboard_stock_alerts) -->
         @if (dataService.hasPermission('view_dashboard_stock_alerts')) {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-red-500"></span>
                 Alertes de rupture
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                  <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th class="px-4 py-3 rounded-l-lg">Réf</th>
                      <th class="px-4 py-3">Pièce</th>
                      <th class="px-4 py-3 text-right">Stock</th>
                      <th class="px-4 py-3 rounded-r-lg text-right">Seuil</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    @for (part of dataService.lowStockParts(); track part.id) {
                      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td class="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{{ part.reference }}</td>
                        <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ part.name }}</td>
                        <td class="px-4 py-3 text-right text-red-500 dark:text-red-400 font-bold">{{ part.stock }}</td>
                        <td class="px-4 py-3 text-right text-slate-500">{{ part.minStock }}</td>
                      </tr>
                    }
                    @if (dataService.lowStockParts().length === 0) {
                      <tr>
                        <td colspan="4" class="px-4 py-8 text-center text-slate-500">Aucune alerte de stock. Tout va bien.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <div class="mt-4 text-right">
                 <a routerLink="/inventory" class="text-sm text-brand-600 dark:text-brand-500 hover:text-brand-500 font-medium">Voir tout le stock &rarr;</a>
              </div>
            </div>
         }

         <!-- Recent Repairs (Permission: view_dashboard_repairs_stats) -->
         @if (dataService.hasPermission('view_dashboard_repairs_stats')) {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                 Derniers Ordres de Réparation
              </h3>
              <div class="space-y-3">
                @for (or of dataService.repairs().slice(0, 4); track or.id) {
                   <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                      <div>
                         <div class="flex items-center gap-2">
                            <span class="font-bold text-slate-900 dark:text-white">{{ getVehicleName(or.vehicleId) }}</span>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{{ getVehiclePlate(or.vehicleId) }}</span>
                         </div>
                         <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{{ or.description }}</p>
                      </div>
                      <div class="text-right">
                         <span [class]="getStatusClass(or.status)" class="text-xs px-2 py-1 rounded-full font-medium border">
                            {{ or.status }}
                         </span>
                      </div>
                   </div>
                }
                @if (dataService.repairs().length === 0) {
                  <div class="text-center py-8 text-slate-500">Aucun ordre de réparation.</div>
                }
              </div>
              <div class="mt-4 text-right">
                 <a routerLink="/repairs" class="text-sm text-brand-600 dark:text-brand-500 hover:text-brand-500 font-medium">Voir tout l'atelier &rarr;</a>
              </div>
            </div>
         }
       </div>
    } @else {
       
       <!-- MECHANIC VIEW (Detailed Task Board) -->
       <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          @for (task of dataService.myAssignedTasks(); track task.id) {
             @let activeTimer = dataService.getActiveTimer(task.id);
             
             <div class="bg-white dark:bg-slate-900 border rounded-xl shadow-lg flex flex-col h-full relative overflow-hidden transition-all group hover:border-brand-500/50"
                  [class.border-slate-200]="task.status === 'En attente' || task.status === 'Terminé'"
                  [class.dark:border-slate-800]="task.status === 'En attente' || task.status === 'Terminé'"
                  [class.border-amber-200]="task.status === 'En cours'"
                  [class.dark:border-amber-900]="task.status === 'En cours'"
                  [class.ring-2]="task.status === 'En cours' && activeTimer?.type === 'WORK'"
                  [class.ring-amber-500_20]="task.status === 'En cours' && activeTimer?.type === 'WORK'"
                  [class.ring-blue-500_20]="activeTimer?.type === 'PAUSE'">
                
                <!-- Status Strip -->
                <div class="h-1.5 w-full"
                     [class.bg-slate-400]="task.status === 'En attente'"
                     [class.bg-amber-500]="task.status === 'En cours' && activeTimer?.type !== 'PAUSE'"
                     [class.bg-blue-500]="activeTimer?.type === 'PAUSE'"
                     [class.bg-emerald-500]="task.status === 'Terminé'">
                </div>

                <div class="p-5 flex flex-col h-full">
                   <!-- Header -->
                   <div class="flex justify-between items-start mb-3">
                      <div>
                         <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-lg text-slate-900 dark:text-white">{{ getVehiclePlate(task.vehicleId) }}</span>
                            @if(task.status === 'En cours' && activeTimer?.type === 'WORK') {
                               <span class="animate-pulse flex h-2 w-2 rounded-full bg-amber-500"></span>
                            }
                            @if(activeTimer?.type === 'PAUSE') {
                               <span class="animate-pulse flex h-2 w-2 rounded-full bg-blue-500"></span>
                            }
                         </div>
                         <div class="text-sm text-slate-600 dark:text-slate-300 font-medium">{{ getVehicleName(task.vehicleId) }}</div>
                      </div>
                      <span class="px-2 py-1 rounded text-xs font-bold border uppercase tracking-wide" [class]="getStatusClass(task.status)">
                         {{ task.status }}
                      </span>
                   </div>

                   <!-- Description -->
                   <div class="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 mb-4 flex-1">
                      <p class="font-semibold mb-1 text-xs uppercase text-slate-400">Travaux :</p>
                      <p>{{ task.description }}</p>
                      
                      <!-- Items Summary -->
                      @if (task.items.length > 0) {
                         <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                            @for (item of task.items; track $index) {
                               <div class="flex justify-between text-xs">
                                  <span class="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                     {{ item.type === 'part' ? '🔩' : '🔧' }} {{ item.description }}
                                  </span>
                                  <span class="font-bold text-slate-900 dark:text-white">x{{ item.quantity }}</span>
                               </div>
                            }
                         </div>
                      }
                   </div>

                   <!-- Time Tracking -->
                   @if (activeTimer) {
                      <div class="rounded p-2 mb-4 text-center border"
                           [class.bg-amber-50]="activeTimer.type === 'WORK'"
                           [class.dark:bg-amber-900_10]="activeTimer.type === 'WORK'"
                           [class.border-amber-100]="activeTimer.type === 'WORK'"
                           [class.dark:border-amber-800]="activeTimer.type === 'WORK'"
                           [class.bg-blue-50]="activeTimer.type === 'PAUSE'"
                           [class.dark:bg-blue-900_10]="activeTimer.type === 'PAUSE'"
                           [class.border-blue-100]="activeTimer.type === 'PAUSE'"
                           [class.dark:border-blue-800]="activeTimer.type === 'PAUSE'">
                         
                         <div class="text-xs font-bold uppercase mb-1" 
                              [class.text-amber-600]="activeTimer.type === 'WORK'"
                              [class.dark:text-amber-400]="activeTimer.type === 'WORK'"
                              [class.text-blue-600]="activeTimer.type === 'PAUSE'"
                              [class.dark:text-blue-400]="activeTimer.type === 'PAUSE'">
                            {{ activeTimer.type === 'WORK' ? "En cours d'intervention" : "En Pause (" + (activeTimer.pauseReason || 'Autre') + ")" }}
                         </div>
                         <div class="text-xl font-mono font-bold"
                              [class.text-amber-700]="activeTimer.type === 'WORK'"
                              [class.dark:text-amber-500]="activeTimer.type === 'WORK'"
                              [class.text-blue-700]="activeTimer.type === 'PAUSE'"
                              [class.dark:text-blue-500]="activeTimer.type === 'PAUSE'">
                            {{ formatElapsedTime(activeTimer.startTime) }}
                         </div>
                      </div>
                   }

                   <!-- Meta -->
                   <div class="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <div class="flex items-center gap-1">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         {{ task.entryDate | date:'dd/MM HH:mm' }}
                      </div>
                      <div>OR #{{ task.id.substring(0,6) }}</div>
                   </div>

                   <!-- Actions -->
                   <div class="grid grid-cols-2 gap-3 mt-auto">
                      @if (task.status === 'En attente' || task.status === 'Diagnostic' || (task.status === 'En cours' && !activeTimer)) {
                         <button (click)="startTask(task.id)" class="col-span-2 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
                            {{ task.status === 'En cours' ? 'Reprendre' : 'Démarrer' }}
                         </button>
                      } @else if (activeTimer?.type === 'PAUSE') {
                         <button (click)="startTask(task.id)" class="col-span-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
                            Reprendre le travail
                         </button>
                      } @else if (task.status === 'En cours' && activeTimer?.type === 'WORK') {
                         <!-- PAUSE BUTTON WITH MODAL -->
                         <button (click)="initiatePause(task.id)" class="py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-lg font-bold text-sm border border-amber-200 dark:border-amber-800 transition-colors flex items-center justify-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                            Pause
                         </button>
                         <button (click)="finishTask(task.id)" class="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                            Terminer
                         </button>
                      } @else {
                         <div class="col-span-2 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-center rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
                            Terminé
                         </div>
                      }
                   </div>
                </div>
             </div>
          }
          
          @if (dataService.myAssignedTasks().length === 0) {
             <div class="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucune tâche en cours</h3>
                <p class="text-slate-500">Vous n'avez pas d'intervention assignée pour le moment.</p>
                <a routerLink="/planning" class="mt-6 px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors">
                   Voir le planning complet
                </a>
             </div>
          }
       </div>
    }

    <!-- PAUSE REASON MODAL -->
    @if (showPauseModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
             <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                   <h3 class="text-lg font-bold text-slate-900 dark:text-white">Motif de la pause</h3>
                   <button (click)="cancelPause()" class="text-slate-400 hover:text-white">✕</button>
                </div>
                
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Pourquoi arrêtez-vous le chronomètre ?</p>
                
                <!-- Quick Reasons -->
                <div class="flex flex-wrap gap-2 mb-4">
                   @for (reason of predefinedPauseReasons; track reason) {
                      <button (click)="setPauseReason(reason)" 
                              class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                              [class.bg-brand-600]="pauseReason() === reason"
                              [class.text-white]="pauseReason() === reason"
                              [class.border-brand-600]="pauseReason() === reason"
                              [class.bg-slate-100]="pauseReason() !== reason"
                              [class.dark:bg-slate-800]="pauseReason() !== reason"
                              [class.text-slate-600]="pauseReason() !== reason"
                              [class.dark:text-slate-400]="pauseReason() !== reason"
                              [class.border-slate-200]="pauseReason() !== reason"
                              [class.dark:border-slate-700]="pauseReason() !== reason">
                         {{ reason }}
                      </button>
                   }
                </div>

                <input type="text" 
                       [ngModel]="pauseReason()" 
                       (ngModelChange)="pauseReason.set($event)"
                       placeholder="Autre motif..." 
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 mb-6">

                <div class="flex gap-3 justify-end">
                   <button (click)="cancelPause()" class="px-4 py-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">Annuler</button>
                   <button (click)="confirmPause()" class="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg">Lancer Pause</button>
                </div>
             </div>
          </div>
       </div>
    }

    <!-- FINISH CONFIRMATION MODAL -->
    @if (showFinishConfirmation()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
             <div class="p-6 text-center">
                <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Terminer l'intervention ?</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Cela arrêtera le chronomètre et marquera la tâche comme terminée.</p>
                <div class="flex gap-3 justify-center">
                   <button (click)="cancelFinishTask()" class="px-4 py-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Annuler</button>
                   <button (click)="confirmFinishTask()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium shadow-lg shadow-emerald-600/20">Confirmer</button>
                </div>
             </div>
          </div>
       </div>
    }
  `
})
export class DashboardComponent implements OnDestroy {
  dataService = inject(DataService);
  toastService = inject(ToastService);
  router: Router = inject(Router);
  today = new Date();
  
  // Timer visual update logic
  currentTime = signal(Date.now());
  intervalId: any;

  // Finish Modal State
  showFinishConfirmation = signal(false);
  taskToFinishId = signal<string | null>(null);

  // Pause Modal State
  showPauseModal = signal(false);
  taskToPauseId = signal<string | null>(null);
  pauseReason = signal('');
  predefinedPauseReasons = ['Pause déjeuner', 'Attente pièces', 'Fin de journée', 'Autre intervention', 'Pause café'];

  // Computed Rating for Garage Dashboard (Mocked for current tenant T1)
  garageRating = computed(() => {
     // Find t1 (our mock) or current user tenant
     const tenant = this.dataService.tenants().find(t => t.id === 't1'); 
     if (tenant) {
        return { rating: tenant.rating || 0, count: tenant.reviewCount || 0 };
     }
     return null;
  });

  constructor() {
     // Update current time every second to refresh computed timer displays
     this.intervalId = setInterval(() => {
        this.currentTime.set(Date.now());
     }, 1000);
  }

  ngOnDestroy() {
     if (this.intervalId) clearInterval(this.intervalId);
  }

  formatMoney(val: number) {
    const currency = this.dataService.currentSettings().currency || 'XOF';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(val);
  }

  getVehicleName(id: string): string {
    const v = this.dataService.getVehicleById(id);
    return v ? `${v.brand} ${v.model}` : 'Inconnu';
  }

  getVehiclePlate(id: string): string {
    return this.dataService.getVehicleById(id)?.plate || '---';
  }
  
  getClientName(clientId: string): string {
     const c = this.dataService.getClientById(clientId);
     return c ? (c.type === 'Entreprise' ? c.companyName || '' : `${c.firstName} ${c.lastName}`) : 'Client';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'En attente': return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600';
      case 'Diagnostic': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'En cours': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Terminé': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Clôturé': return 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 decoration-line-through';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  formatElapsedTime(startTimeStr: string): string {
     const start = new Date(startTimeStr).getTime();
     const now = this.currentTime();
     const diff = Math.max(0, now - start);
     
     const hrs = Math.floor(diff / 3600000);
     const mins = Math.floor((diff % 3600000) / 60000);
     const secs = Math.floor((diff % 60000) / 1000);
     
     return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Quick Navigation Helpers
  goToRepair(id: string) {
     this.router.navigate(['/repairs']); 
  }

  goToOpportunities() {
     this.router.navigate(['/opportunities']);
  }

  // Mechanic Actions
  startTask(id: string) {
     this.dataService.startTimer(id);
     this.toastService.show('Chronomètre démarré', 'success');
  }

  // PAUSE LOGIC
  initiatePause(id: string) {
     this.taskToPauseId.set(id);
     this.pauseReason.set('Pause déjeuner'); // Default
     this.showPauseModal.set(true);
  }

  setPauseReason(reason: string) {
     this.pauseReason.set(reason);
  }

  confirmPause() {
     const id = this.taskToPauseId();
     const reason = this.pauseReason() || 'Pause';
     if (id) {
        this.dataService.startPause(id, reason);
        this.toastService.show(`Chronomètre de pause lancé`, 'info');
     }
     this.cancelPause();
  }

  cancelPause() {
     this.showPauseModal.set(false);
     this.taskToPauseId.set(null);
     this.pauseReason.set('');
  }

  // FINISH LOGIC
  finishTask(id: string) {
     this.taskToFinishId.set(id);
     this.showFinishConfirmation.set(true);
  }

  confirmFinishTask() {
     const id = this.taskToFinishId();
     if (id) {
        this.dataService.finishMechanicTask(id);
        this.toastService.show('Intervention terminée. Bravo !', 'success');
     }
     this.cancelFinishTask();
  }

  cancelFinishTask() {
     this.showFinishConfirmation.set(false);
     this.taskToFinishId.set(null);
  }
}