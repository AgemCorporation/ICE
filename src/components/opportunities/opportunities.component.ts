
import { Component, inject, signal, computed, effect, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DataService, QuoteRequest, Client, Vehicle, Invoice, InvoiceItem, RepairOrder, RepairItem } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { Capacitor } from '@capacitor/core';

@Component({
   selector: 'app-opportunities',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, FormsModule],
   providers: [DecimalPipe],
   template: `
    <div class="flex flex-col h-full">
      <div class="mb-4 lg:mb-6 shrink-0">
        <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">Opportunités</h1>
        <p class="text-sm lg:text-base text-slate-500 dark:text-slate-400">Demandes de devis envoyées par la plateforme Pro Devis Auto.</p>
      </div>

      <div class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
         <!-- Left Column: Filters & Satisfaction Widget -->
         <div class="w-full lg:w-64 flex flex-col md:flex-row lg:flex-col gap-4 lg:gap-6 shrink-0">
            
            <!-- Filters -->
            <div class="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide snap-x flex-1 lg:flex-none min-w-0">
               <button (click)="filterStatus.set('ALL')" 
                       [class]="filterStatus() === 'ALL' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-slate-300 dark:ring-slate-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'"
                       class="px-4 py-2 lg:py-3 rounded-lg text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 snap-start">
                  Tous
               </button>
               
               <button (click)="filterStatus.set('DISPATCHED')" 
                       [class]="filterStatus() === 'DISPATCHED' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200 dark:ring-blue-900' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'"
                       class="px-4 py-2 lg:py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-3 whitespace-nowrap shrink-0 snap-start">
                  <span>Nouveau</span>
                  <span class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">{{ countByStatus('DISPATCHED') }}</span>
               </button>

               <button (click)="filterStatus.set('QUOTE_SUBMITTED')" 
                       [class]="filterStatus() === 'QUOTE_SUBMITTED' ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-200 dark:ring-amber-900' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'"
                       class="px-4 py-2 lg:py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-3 whitespace-nowrap shrink-0 snap-start">
                  <span>Devis Envoyé</span>
                  <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">{{ countByStatus('QUOTE_SUBMITTED') + countByStatus('COMPLETED') }}</span>
               </button>

               <button (click)="filterStatus.set('CONVERTED')" 
                       [class]="filterStatus() === 'CONVERTED' ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200 dark:ring-emerald-900' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'"
                       class="px-4 py-2 lg:py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-3 whitespace-nowrap shrink-0 snap-start">
                  <span>Gagné</span>
                  <span class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">{{ countByStatus('CONVERTED') }}</span>
               </button>

               <button (click)="filterStatus.set('REJECTED')" 
                       [class]="filterStatus() === 'REJECTED' ? 'bg-red-600 text-white shadow-md ring-2 ring-red-200 dark:ring-red-900' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'"
                       class="px-4 py-2 lg:py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-3 whitespace-nowrap shrink-0 snap-start">
                  <span>Perdu</span>
                  <span class="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px] font-bold">{{ countByStatus('REJECTED') }}</span>
               </button>
            </div>
            
            <div class="mt-2 flex flex-col gap-2">
               <!-- Search Input -->
               <div class="relative w-full">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input type="text" [ngModel]="opportunitiesSearchTerm()" (ngModelChange)="opportunitiesSearchTerm.set($event)" placeholder="Rechercher par Réf, Nom..." class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  @if(opportunitiesSearchTerm()) {
                     <button (click)="opportunitiesSearchTerm.set('')" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  }
               </div>

               <select [value]="sortOrder()" (change)="updateSort($event)" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-indigo-500">
                  <option value="desc">Plus récent</option>
                  <option value="asc">Plus ancien</option>
               </select>
            </div>

            <!-- Satisfaction Widget -->
            <div class="hidden sm:flex md:w-56 lg:w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex-col gap-3 shrink-0">
               <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  Note Moyenne
               </h3>
               @if (garageRating()) {
                  <div class="flex items-end gap-2 mb-2">
                     <span class="text-3xl font-bold text-slate-900 dark:text-white">{{ garageRating()!.rating.toFixed(1) }}</span>
                     <div class="flex flex-col mb-1">
                        <div class="flex text-amber-400 text-xs">
                           @for(i of [1,2,3,4,5]; track i) { <span [class.text-slate-300]="i > garageRating()!.rating">★</span> }
                        </div>
                        <span class="text-[10px] text-slate-400">{{ garageRating()!.count }} avis</span>
                     </div>
                  </div>
               }
            </div>
         </div>

         <!-- Right Column: Opportunity Cards -->
         <div class="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/50 p-1 lg:p-0">
            @if (filteredOpportunities().length > 0) {
               <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  @for (opp of filteredOpportunities(); track opp.id) {
                     <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col relative h-full transition-all hover:border-indigo-300 dark:hover:border-indigo-700 active:scale-[0.99] duration-100">
                        
                        <!-- Status Banner -->
                        @if (opp.localStatus === 'QUOTE_SUBMITTED') {
                           <div class="absolute top-0 right-0 left-0 bg-amber-500 text-white text-xs font-bold text-center py-1 z-10">
                              Devis Soumis (En validation)
                           </div>
                        }
                        @if (opp.localStatus === 'COMPLETED') {
                           <div class="absolute top-0 right-0 left-0 bg-amber-500 text-white text-xs font-bold text-center py-1 z-10">
                              Devis Envoyé au Client
                           </div>
                        }
                        @if (opp.localStatus === 'CONVERTED') {
                           <div class="absolute top-0 right-0 left-0 bg-emerald-600 text-white text-xs font-bold text-center py-1 z-10 flex items-center justify-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                              Gagné !
                           </div>
                        }
                        @if (opp.localStatus === 'REJECTED') {
                           <div class="absolute top-0 right-0 left-0 bg-red-600 text-white text-xs font-bold text-center py-1 z-10">
                              Perdu / Refusé
                           </div>
                        }

                        <!-- Header -->
                        <div class="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start relative" [class.mt-6]="opp.localStatus !== 'NEW' && opp.localStatus !== 'DISPATCHED'">
                           <!-- Notification Badges Area -->
                           @if ((opp.unreadMessageTenantIds && opp.unreadMessageTenantIds.includes(dataService.currentTenantId() || '')) || (opp.unlockedTenantIds && opp.unlockedTenantIds.includes(dataService.currentTenantId() || ''))) {
                              <div class="flex flex-wrap gap-2 w-full mb-3">
                                 @if (opp.unreadMessageTenantIds && opp.unreadMessageTenantIds.includes(dataService.currentTenantId() || '')) {
                                    <span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-red-500/30 flex items-center gap-1 animate-pulse">
                                       <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                                       Nouveau Message
                                    </span>
                                 }
                                 @if (opp.unlockedTenantIds && opp.unlockedTenantIds.includes(dataService.currentTenantId() || '')) {
                                    <span class="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-amber-500/30 flex items-center gap-1">
                                       <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                       Modif. Autorisée
                                    </span>
                                 }
                              </div>
                           }

                           <div class="flex justify-between items-start w-full gap-2">
                              <div>
                                 <div class="flex items-center gap-2 mb-1">
                                    <div class="font-bold text-base lg:text-lg text-slate-900 dark:text-white leading-none">{{ opp.vehicleBrand }} {{ opp.vehicleModel }}</div>
                                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">N˚UR: {{ getRef(opp.id) }}</span>
                                 </div>
                                 <div class="flex items-center gap-2">
                                    <div class="text-slate-500 text-xs flex items-center gap-1">
                                       <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                       {{ opp.date | date:'dd MMM yyyy' }}
                                    </div>
                                 </div>
                              </div>
                              @if (opp.localStatus === 'DISPATCHED') {
                                 <span class="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse shrink-0">Nouveau</span>
                              }
                           </div>
                        </div>

                           <!-- Card Body -->
                           <div class="p-4 flex flex-col flex-1 gap-3 relative">
                              <!-- Description Snippet -->
                              <div class="text-sm text-slate-600 dark:text-slate-400 italic line-clamp-2 mt-1">
                              "{{ opp.adminDescription || opp.description }}"
                           </div>

                           <!-- Preferences Badges -->
                           <div class="flex flex-wrap gap-2">
                              @if(opp.preferredPeriod === 'Urgent') {
                                 <span class="px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase border border-red-200 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Urgent</span>
                              }
                              @if(opp.interventionDate) {
                                 <span class="px-2 py-1 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-1" title="Date souhaitée">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {{ opp.interventionDate | date:'dd/MM/yyyy' }}
                                 </span>
                              }
                              @if(opp.interventionLocation) {
                                 <span class="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1" title="Lieu d'intervention">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" /></svg> {{ getLocationLabel(opp.interventionLocation) }}
                                 </span>
                              }
                           </div>

                           <!-- Call to Action -->
                           <div class="mt-auto pt-4">
                              <button (click)="openDetailModal(opp)" class="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
                                 Ouvrir le dossier
                                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                              </button>
                           </div>
                        </div>
                     </div>
                  }
               </div>
            } @else {
               <div class="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucune opportunité dans cette catégorie</h3>
                  <p class="text-slate-500 dark:text-slate-400 max-w-sm">
                     Changez de filtre pour voir d'autres dossiers.
                  </p>
               </div>
            }
         </div>
      </div>
    </div>

    <!-- DETAIL MODAL FOR CARDS -->
    @if (showDetailModal() && selectedOppDetail(); as opp) {
       <div class="fixed inset-0 z-[60] flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeDetailModal()">
          <div class="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl flex flex-col animate-slide-in-right relative" (click)="$event.stopPropagation()">
             <!-- Header -->
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900 shrink-0">
                <div>
                  <div class="flex gap-2 items-center mb-1">
                     <span class="px-2 py-0.5 rounded text-[12px] font-bold font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 leading-none">N˚UR: {{ getRef(opp.id) }}</span>
                     @if (opp.localStatus === 'QUOTE_SUBMITTED') { <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">En Revue Admin</span> }
                     @if (opp.localStatus === 'COMPLETED') { <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Envoyé Client</span> }
                     @if (opp.localStatus === 'CONVERTED') { <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Gagné</span> }
                     @if (opp.localStatus === 'REJECTED') { <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Perdu</span> }
                  </div>
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ opp.vehicleBrand }} {{ opp.vehicleModel }}</h2>
                  <div class="text-sm text-slate-500 mt-0.5">{{ opp.motoristName }} • {{ opp.locationCity }}</div>
                </div>
                <button (click)="closeDetailModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">✕</button>
             </div>

             <!-- Body -->
             <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/30">
                
                <!-- COMPLETE Vehicle Details -->
                <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Détails du Véhicule</h4>
                   <div class="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div class="flex flex-col">
                         <span class="text-[10px] text-slate-500">Année</span>
                         <span class="font-medium text-slate-900 dark:text-white">{{ opp.vehicleYear }}</span>
                      </div>
                      <div class="flex flex-col">
                         <span class="text-[10px] text-slate-500">Carburant</span>
                         <span class="font-medium text-slate-900 dark:text-white">{{ opp.fuel || 'N/A' }}</span>
                      </div>
                      <div class="flex flex-col">
                         <span class="text-[10px] text-slate-500">Kilométrage</span>
                         <span class="font-medium text-slate-900 dark:text-white">{{ opp.mileage ? (opp.mileage | number) + ' km' : 'N/A' }}</span>
                      </div>
                      <div class="flex flex-col">
                         <span class="text-[10px] text-slate-500">N° Série (VIN)</span>
                         <span class="font-mono font-medium text-slate-900 dark:text-white break-all">{{ opp.vehicleVin || 'Non renseigné' }}</span>
                      </div>
                   </div>

                   <!-- Photos -->
                   @if (opp.photos && opp.photos.length > 0) {
                      <div class="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                         <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Photos ({{ opp.photos.length }})</span>
                         <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            @for (photo of opp.photos; track $index) {
                               <div class="relative group cursor-zoom-in flex-shrink-0" (click)="openImageModal(photo)">
                                  <img [src]="photo" class="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700">
                                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg"></div>
                               </div>
                            }
                         </div>
                      </div>
                   }
                </div>

                <!-- Description -->
                <div class="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                  <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     Description du problème
                  </h4>
                  <p class="text-sm text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap">"{{ opp.adminDescription || opp.description }}"</p>
                </div>
                
                <!-- Diagnostic History -->
                @if (opp.diagnosticHistory && opp.diagnosticHistory.length > 0) {
                   <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <div class="bg-slate-50 dark:bg-slate-950/50 px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                         Diagnostic Détaillé
                      </div>
                      <div class="divide-y divide-slate-100 dark:divide-slate-800 p-2">
                         @for (step of opp.diagnosticHistory; track $index) {
                            <div class="p-2 text-sm">
                               <div class="text-slate-500 dark:text-slate-400 mb-1 text-xs">{{ step.question }}</div>
                               <div class="text-slate-900 dark:text-white font-medium">{{ step.answer }}</div>
                            </div>
                         }
                      </div>
                   </div>
                }
                
                <!-- Client Review -->
                @if (opp.clientRating) {
                   <div class="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30">
                      <h4 class="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                         <span class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Avis Client
                         </span>
                         <div class="flex text-amber-400">
                            @for(i of [1,2,3,4,5]; track i) { <span [class.text-amber-500]="i <= opp.clientRating" [class.text-slate-300]="i > opp.clientRating">★</span> }
                         </div>
                      </h4>
                      @if (opp.clientReview) {
                          <p class="text-sm text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap mt-2">"{{ opp.clientReview }}"</p>
                      } @else {
                          <p class="text-xs text-slate-500 dark:text-slate-400 italic mt-2">Aucun commentaire laissé.</p>
                      }
                   </div>
                }
                
                <!-- Rejection Reason -->
                @if (opp.localStatus === 'REJECTED' && opp.rejectionReason) {
                   <div class="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30">
                      <h4 class="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         Motif du refus
                      </h4>
                      <p class="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">"{{ opp.rejectionReason }}"</p>
                   </div>
                }

                <!-- Discussion & Chat -->
                @if (opp.localStatus === 'QUOTE_SUBMITTED' || opp.localStatus === 'COMPLETED' || opp.localStatus === 'REJECTED') {
                   <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                      <div class="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                         <span class="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">Discussion Admin</span>
                      </div>
                      
                      <div class="p-4 max-h-64 overflow-y-auto flex flex-col gap-3">
                         @let myMessages = getMessages(opp);
                         @if (!myMessages || myMessages.length === 0) {
                            <div class="text-center text-slate-400 text-xs py-4 italic">Aucun message pour le moment.</div>
                         } @else {
                            @for (msg of myMessages; track msg.id) {
                               <div class="flex flex-col max-w-[85%]" [ngClass]="msg.senderId !== 'SUPERADMIN' ? 'self-end items-end' : 'self-start items-start'">
                                  <span class="text-[10px] text-slate-500 mb-0.5 mx-1">{{ msg.senderName }} • {{ msg.date | date:'dd/MM HH:mm' }}</span>
                                  <div class="px-3 py-2 rounded-lg text-sm shadow-sm" [ngClass]="msg.senderId !== 'SUPERADMIN' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-none'">
                                     {{ msg.message }}
                                  </div>
                               </div>
                            }
                         }
                      </div>

                      <div class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-2">
                         @if (opp.localStatus === 'REJECTED') {
                            <div class="w-full text-center text-xs font-medium text-slate-500 italic py-2">
                               Cette discussion est fermée car le devis a été refusé.
                            </div>
                         } @else {
                            <input #msgInput type="text" (input)="null" (keyup.enter)="sendQuoteMessage(opp.id, msgInput.value); msgInput.value=''" placeholder="Votre message pour ICE by Mecatech..." class="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 shadow-inner">
                            <button (click)="sendQuoteMessage(opp.id, msgInput.value); msgInput.value=''" [disabled]="!msgInput.value.trim()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                               Envoyer
                            </button>
                         }
                      </div>
                   </div>
                }
             </div>

             <!-- CTA Footer -->
             <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0">
               @if (opp.localStatus === 'DISPATCHED') {
                  @if (dataService.hasPermission('manage_opportunities')) {
                     <button (click)="dataService.rejectQuoteRequest(opp.id); closeDetailModal()" class="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm">
                        Refuser le dossier
                     </button>
                     <button (click)="openQuoteModal(opp)" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-bold text-sm shadow-lg shadow-indigo-500/30">
                        Créer un Devis
                     </button>
                  } @else {
                     <span class="text-xs text-slate-500 italic p-2">Permissions insuffisantes pour interagir.</span>
                  }
               }
               @else if (opp.localStatus === 'QUOTE_SUBMITTED') {
                  <div class="flex w-full gap-3">
                     <button (click)="openQuotePreview(opp)" class="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Revoir le devis
                     </button>
                     @if (opp.unlockedTenantIds && opp.unlockedTenantIds.includes(dataService.currentTenantId() || '')) {
                        <button (click)="openQuoteModal(opp)" class="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                           Modifier le devis
                        </button>
                     } @else {
                        <button disabled class="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 cursor-wait">
                           <span class="animate-pulse">⏳</span> En attente validation SuperAdmin
                        </button>
                     }
                  </div>
               }
               @else if (opp.localStatus === 'COMPLETED' || opp.localStatus === 'CONVERTED') {
                  <div class="flex flex-col md:flex-row w-full gap-3">
                     <button (click)="openQuotePreview(opp)" class="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                        Revoir le devis
                     </button>
                     @if (!opp.repairOrderId) {
                        <button (click)="sendToWorkshop(opp)" [disabled]="!opp.acceptedQuoteId" class="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                           {{ opp.acceptedQuoteId ? "Transmettre à l'atelier" : "En attente accord client" }}
                        </button>
                     } @else {
                        <button (click)="goToRepair(opp)" class="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                           Accéder à l'Ordre de Réparation
                        </button>
                     }
                  </div>
               }
             </div>
          </div>
       </div>
    }

    <!-- QUOTE PREVIEW MODAL -->
    @if (showQuotePreviewModal() && selectedOppPreview(); as opp) {
       @let quote = dataService.getInvoiceById(opp.myQuoteId || opp.garageQuoteId || '');
       <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <span>Proposition N° {{ quote?.number || 'Inconnue' }}</span>
                <button (click)="closeQuotePreview()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <div class="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
                @if (quote) {
                   <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div class="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                         <div>
                            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pour</div>
                            <h3 class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ opp.motoristName }}</h3>
                            <div class="text-sm text-slate-500">{{ opp.vehicleBrand }} {{ opp.vehicleModel }}</div>
                         </div>
                         <div class="text-right flex flex-col items-end gap-2">
                            <div>
                               <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date d'émission</div>
                               <div class="text-sm text-slate-900 dark:text-white font-medium">{{ quote.date | date:'dd/MM/yyyy' }}</div>
                            </div>
                            @if (quote.restitutionDate) {
                               <div class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded px-2 py-1 text-right mt-1">
                                  <div class="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-0.5">Restitution prévue</div>
                                  <div class="text-xs font-medium text-amber-700 dark:text-amber-400">{{ quote.restitutionDate | date:'dd/MM/yyyy' }}</div>
                               </div>
                            }
                         </div>
                      </div>

                      <table class="w-full text-sm text-left mb-6">
                         <thead class="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
                            <tr>
                               <th class="px-4 py-2">Description</th>
                               <th class="px-4 py-2 text-right">Qté</th>
                               <th class="px-4 py-2 text-right">P.U. HT</th>
                               <th class="px-4 py-2 text-right">Total HT</th>
                            </tr>
                         </thead>
                         <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            @for (item of quote.items; track $index) {
                               <tr>
                                  <td class="px-4 py-2 text-slate-700 dark:text-slate-300">{{ item.description }}</td>
                                  <td class="px-4 py-2 text-right text-slate-600 dark:text-slate-400">{{ item.quantity }}</td>
                                  <td class="px-4 py-2 text-right text-slate-600 dark:text-slate-400">{{ formatMoney(item.unitPrice) }}</td>
                                  <td class="px-4 py-2 text-right font-medium text-slate-900 dark:text-white">{{ formatMoney(item.totalHT) }}</td>
                               </tr>
                            }
                         </tbody>
                      </table>

                      <div class="flex justify-end">
                         <div class="w-1/2 md:w-1/3 space-y-2">
                            <div class="flex justify-between text-sm text-slate-500">
                               <span>Total HT</span>
                               <span>{{ formatMoney(quote.totalHT) }}</span>
                            </div>
                            <div class="flex justify-between text-sm text-slate-500">
                               <span>TVA (18%)</span>
                               <span>{{ formatMoney(quote.totalVAT) }}</span>
                            </div>
                            <div class="flex justify-between text-lg font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                               <span>Total TTC</span>
                               <span class="text-indigo-600 dark:text-indigo-400">{{ formatMoney(quote.totalTTC) }}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                } @else {
                   <div class="flex flex-col items-center justify-center h-64 text-slate-400">
                      <p>Erreur: Détails du devis introuvables.</p>
                   </div>
                }
             </div>
             <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end shrink-0">
                <button (click)="closeQuotePreview()" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold">Fermer</button>
             </div>
          </div>
       </div>
    }

    <!-- IMAGE ZOOM MODAL -->
    @if (showImageModal() && selectedImageUrl()) {
       <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" (click)="closeImageModal()">
          <button (click)="closeImageModal()" class="absolute top-4 right-4 text-white/70 hover:text-white p-2">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img [src]="selectedImageUrl()" class="max-w-full max-h-full rounded shadow-2xl object-contain" (click)="$event.stopPropagation()">
       </div>
    }

    <!-- QUOTE MODAL (Same as before) -->
    @if (showQuoteModal() && selectedOpp()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
             
             <!-- Modal Header -->
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center bg-white dark:bg-slate-900 shrink-0 rounded-t-xl">
                <div>
                   <span>Proposition de Devis</span>
                   <div class="text-xs text-slate-500 font-normal">Pour {{ selectedOpp()?.motoristName }} - {{ selectedOpp()?.vehicleBrand }} {{ selectedOpp()?.vehicleModel }}</div>
                </div>
                <button (click)="closeQuoteModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
             </div>

             <!-- Modal Body -->
             <form [formGroup]="quoteForm" (ngSubmit)="submitQuote()" class="flex-1 flex flex-col min-h-0">
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                   
                   <!-- Delivery/Restitution Date -->
                   <div class="mb-4">
                      <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Date de restitution prévue du véhicule</label>
                      <input type="date" formControlName="restitutionDate" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-brand-500">
                   </div>

                   <!-- Items List -->
                   <div>
                      <div class="flex justify-between items-center mb-2">
                         <label class="text-sm font-bold text-slate-700 dark:text-slate-300">Lignes du Devis</label>
                         <button type="button" (click)="addItem()" class="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">+ Ajouter ligne</button>
                      </div>
                      
                      <div formArrayName="items" class="space-y-4">
                         @for (item of items.controls; track $index) {
                            <div [formGroupName]="$index" class="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-2 relative group">
                               <!-- Type Switcher -->
                               <div class="flex gap-4 text-xs font-bold uppercase text-slate-500 mb-1">
                                  <label class="flex items-center gap-1 cursor-pointer">
                                     <input type="radio" formControlName="type" value="part" (change)="onTypeChange($index, 'part')"> Pièce
                                  </label>
                                  <label class="flex items-center gap-1 cursor-pointer">
                                     <input type="radio" formControlName="type" value="labor" (change)="onTypeChange($index, 'labor')"> Main d'œuvre
                                  </label>
                                  <button type="button" (click)="removeItem($index)" class="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                  </button>
                               </div>

                               <div class="flex gap-2 items-start">
                                  <div class="flex-1">
                                     @if (item.get('type')?.value === 'part') {
                                        <select (change)="onPartSelect($event, $index)" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white">
                                           <option value="">-- Sélectionner Pièce --</option>
                                           @for (part of parts(); track part.id) {
                                              <option [value]="part.id">{{ part.reference }} - {{ part.name }} ({{ formatMoney(part.sellPrice) }})</option>
                                           }
                                        </select>
                                     } @else {
                                        <select (change)="onLaborSelect($event, $index)" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white">
                                           <option value="">-- Taux Horaire --</option>
                                           @for (rate of rates(); track rate.id) {
                                              <option [value]="rate.id">{{ rate.name }} ({{ formatMoney(rate.hourlyRate) }}/h)</option>
                                           }
                                        </select>
                                     }
                                     <input formControlName="description" placeholder="Description personnalisée" class="w-full mt-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white">
                                  </div>
                                  <div class="w-20">
                                     <label class="block text-[10px] text-slate-500 mb-1">Qté/H</label>
                                     <input type="number" formControlName="quantity" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white text-right">
                                  </div>
                                  <div class="w-24">
                                     <label class="block text-[10px] text-slate-500 mb-1">P.U. HT</label>
                                     <input type="number" formControlName="unitPrice" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white text-right">
                                  </div>
                               </div>
                            </div>
                         }
                      </div>
                   </div>

                   <!-- Total -->
                   <div class="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg flex justify-end items-center gap-4">
                      <span class="text-sm text-slate-500 font-medium uppercase">Total Estimé (HT)</span>
                      <span class="text-xl font-bold text-slate-900 dark:text-white">{{ formatMoney(quoteTotal) }}</span>
                   </div>
                </div>

                <!-- Footer -->
                <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                   <button type="button" (click)="closeQuoteModal()" class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white">Annuler</button>
                   <button type="submit" [disabled]="quoteForm.invalid || items.length === 0" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg disabled:opacity-50 disabled:shadow-none">
                      Soumettre au Super-Admin
                   </button>
                </div>
             </form>
          </div>
       </div>
    }
  `
})
export class OpportunitiesComponent {
   dataService = inject(DataService);
   toastService = inject(ToastService);
   fb = inject(FormBuilder);
   router = inject(Router);
   route = inject(ActivatedRoute);
   cdr = inject(ChangeDetectorRef);

   @HostListener('click') onHostClick() { this.cdr.markForCheck(); }
   @HostListener('touchend') onHostTouch() { this.cdr.markForCheck(); }

   showQuoteModal = signal(false);
   showQuotePreviewModal = signal(false);
   selectedOppPreview = signal<QuoteRequest | null>(null);

   selectedOpp = signal<QuoteRequest | null>(null);

   // Detail Modal (Compact View Refactor)
   showDetailModal = signal(false);
   selectedOppDetailId = signal<string | null>(null);

   // Enrich opportunities with tenant-specific context for the UI
   opportunities = computed(() => {
      const tenantId = this.dataService.currentTenantId();
      const allQuotes = this.dataService.invoices();

      return this.dataService.quoteRequests()
         .filter(q => q.assignedTenantIds?.includes(tenantId || 't1'))
         .map(opp => {
            // Find if this tenant has submitted a quote for this req
            const myQuoteId = opp.proposedQuotes?.find(qid => {
               const inv = allQuotes.find(i => i.id === qid);
               return inv && inv.tenantId === tenantId;
            });

            // "Local" perceived status
            let localStatus = opp.status;
            if (opp.status === 'QUOTE_SUBMITTED' || opp.status === 'COMPLETED') {
               // If it's globally submitted, but not by me, it's still "DISPATCHED" for me
               if (!myQuoteId) {
                  localStatus = 'DISPATCHED';
               } else if (myQuoteId && opp.status === 'QUOTE_SUBMITTED') {
                  localStatus = 'QUOTE_SUBMITTED';
               }
            }

            // If it's converted, check if I won
            if (opp.status === 'CONVERTED') {
               if (myQuoteId && opp.acceptedQuoteId === myQuoteId) {
                  localStatus = 'CONVERTED'; // Gagné
               } else {
                  localStatus = 'REJECTED'; // Perdu (Un autre garage l'a eu)
               }
            }

            // If the whole request was rejected by admin
            if (opp.status === 'REJECTED') {
               localStatus = 'REJECTED';
            }

            // If my specific quote was refused by Super Admin
            if (myQuoteId) {
               const myInv = allQuotes.find(i => i.id === myQuoteId);
               if (myInv && myInv.status === 'REFUSE') {
                  localStatus = 'REJECTED';
               }
            }

            return {
               ...opp,
               localStatus, // Use this for UI instead of raw status
               myQuoteId
            };
         });
   });

   selectedOppDetail = computed(() => {
      const id = this.selectedOppDetailId();
      if (!id) return null;
      return this.opportunities().find(o => o.id === id) || null;
   });

   // Image Viewer
   showImageModal = signal(false);
   selectedImageUrl = signal<string | null>(null);

   // Expose signals for template
   parts = computed(() => this.dataService.parts());
   rates = computed(() => this.dataService.labourRates());

   // Computed Rating for Garage based on QuoteRequest history
   garageRating = computed(() => {
      const tenantId = this.dataService.currentTenantId();
      if (!tenantId) return null;

      const allQuotes = this.dataService.invoices();
      const allReqs = this.dataService.quoteRequests();

      let totalScore = 0;
      let reviewCount = 0;

      for (const req of allReqs) {
         if (req.status === 'CONVERTED' || req.status === 'COMPLETED') {
            if (req.clientRating && req.acceptedQuoteId) {
               const winningQuote = allQuotes.find(q => q.id === req.acceptedQuoteId);
               if (winningQuote && winningQuote.tenantId === tenantId) {
                  totalScore += req.clientRating;
                  reviewCount++;
               }
            }
         }
      }

      if (reviewCount === 0) return { rating: 0, count: 0 };

      return {
         rating: totalScore / reviewCount,
         count: reviewCount
      };
   });

   // Filter logic
   filterStatus = signal<'ALL' | 'DISPATCHED' | 'QUOTE_SUBMITTED' | 'CONVERTED' | 'REJECTED'>('ALL');
   sortOrder = signal<'asc' | 'desc'>('desc');
   opportunitiesSearchTerm = signal<string>('');

   updateSort(e: Event) {
      this.sortOrder.set((e.target as HTMLSelectElement).value as 'asc' | 'desc');
   }

   filteredOpportunities = computed(() => {
      let result = this.opportunities();
      
      const search = this.opportunitiesSearchTerm().toLowerCase().trim();
      if (search) {
         result = result.filter(o => 
            this.getRef(o.id).toLowerCase().includes(search) || 
            o.motoristName?.toLowerCase().includes(search) ||
            o.motoristPhone?.toLowerCase().includes(search)
         );
      }

      const status = this.filterStatus();

      if (status === 'QUOTE_SUBMITTED') {
         result = result.filter(o => o.localStatus === 'COMPLETED' || o.localStatus === 'QUOTE_SUBMITTED');
      } else if (status !== 'ALL') {
         result = result.filter(o => o.localStatus === status);
      }

      // Sort
      const order = this.sortOrder();
      result = result.sort((a, b) => {
         const dateA = new Date(a.assignedDate || a.date).getTime();
         const dateB = new Date(b.assignedDate || b.date).getTime();
         return order === 'desc' ? dateB - dateA : dateA - dateB;
      });

      return result;
   });

   countByStatus(status: string) {
      return this.opportunities().filter(o => o.localStatus === status).length;
   }

   quoteForm: FormGroup;

   constructor() {
      this.quoteForm = this.fb.group({
         restitutionDate: [null, Validators.required],
         items: this.fb.array([])
      });

      // Remove manual static filtering effect, now handled by computed() directly

      // Handle auto-opening opportunities from QR Scanner
      this.route.queryParams.subscribe(params => {
         if (params['openId']) {
            const oppId = params['openId'];
            setTimeout(() => {
               const req = this.opportunities().find(r => r.id === oppId);
               if (req) {
                  if (params['action'] === 'review') {
                     this.openQuotePreview(req);
                  } else {
                     this.openDetailModal(req);
                  }
               }
               // Clean up URL to prevent re-opening on manual refresh
               this.router.navigate([], { queryParams: { openId: null, action: null }, queryParamsHandling: 'merge', replaceUrl: true });
            }, 100);
         }
      });
   }

   private generateUUID(): string {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
         return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
         const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
         return v.toString(16);
      });
   }

   get items() { return this.quoteForm.get('items') as FormArray; }

   get quoteTotal() {
      return this.items.controls.reduce((acc, ctrl) => {
         const val = ctrl.value;
         return acc + (val.quantity * val.unitPrice);
      }, 0);
   }

   translateStatus(status?: string): string {
      if(!status) return 'Inconnu';
      switch(status) {
         case 'NEW': return 'En attente';
         case 'QUOTE_SUBMITTED': return 'Devis émis';
         case 'CONVERTED': return 'Converti / A Planifier';
         case 'COMPLETED': return 'Devis Envoyé';
         case 'REJECTED': return 'Non retenu';
         case 'DISPATCHED': return 'Dispatcher';
         default: return status;
      }
   }

   getRef(id?: string): string { return id ? id.substring(0,8).toUpperCase() : ''; }

   getRepairStatus(id?: string): string {
      if (!id) return '';
      const repair = this.dataService.repairs().find(r => r.id === id);
      return repair ? repair.status : '';
   }

   getRepair(id?: string) {
      if (!id) return undefined;
      return this.dataService.repairs().find(r => r.id === id);
   }

   openQuoteModal(opp: any) {
      this.closeDetailModal(); // Ensures we don't have overlapping complex modals
      this.selectedOpp.set(opp);
      this.quoteForm.reset();
      this.items.clear();

      if (opp.myQuoteId) {
         // It's a re-edit: let's pre-fill the form with the existing quote!
         const existingInvoice = this.dataService.getInvoiceById(opp.myQuoteId);
         if (existingInvoice) {
            this.quoteForm.patchValue({
               restitutionDate: existingInvoice.restitutionDate || null
            });
         }

         if (existingInvoice && existingInvoice.items) {
            existingInvoice.items.forEach(item => {
               const itemGroup = this.fb.group({
                  type: [item.partId ? 'part' : 'labor'],
                  description: [item.description, Validators.required],
                  quantity: [item.quantity, [Validators.required, Validators.min(0.1)]],
                  unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
                  partId: [item.partId || null]
               });
               this.items.push(itemGroup);
            });
         } else {
            this.addItem();
         }
      } else {
         this.addItem();
      }
      this.showQuoteModal.set(true);
   }
   closeQuoteModal() {
      this.showQuoteModal.set(false);
      this.selectedOpp.set(null);
   }

   openQuotePreview(opp: any) {
      if (!opp.myQuoteId && !opp.garageQuoteId && !opp.acceptedQuoteId) return;
      this.selectedOppPreview.set(opp);
      this.showQuotePreviewModal.set(true);
   }

   closeQuotePreview() {
      this.showQuotePreviewModal.set(false);
      this.selectedOppPreview.set(null);
   }

   // --- DETAIL MODAL ---
   openDetailModal(opp: any) {
      this.dataService.markMessagesAsRead(opp.id, 'GARAGE', this.dataService.currentTenantId() || undefined);
      this.selectedOppDetailId.set(opp.id);
      this.showDetailModal.set(true);
   }

   closeDetailModal() {
      this.showDetailModal.set(false);
      this.selectedOppDetailId.set(null);
   }

   // --- IMAGE MODAL ---
   openImageModal(url: string) {
      this.selectedImageUrl.set(url);
      this.showImageModal.set(true);
   }

   closeImageModal() {
      this.showImageModal.set(false);
      this.selectedImageUrl.set(null);
   }

   addItem() {
      const itemGroup = this.fb.group({
         type: ['part'], // part or labor
         description: ['', Validators.required],
         quantity: [1, [Validators.required, Validators.min(0.1)]],
         unitPrice: [0, [Validators.required, Validators.min(0)]],
         partId: [null] // Store ref if part
      });
      this.items.push(itemGroup);
   }

   removeItem(index: number) {
      this.items.removeAt(index);
   }

   onTypeChange(index: number, type: 'part' | 'labor') {
      const group = this.items.at(index) as FormGroup;
      group.patchValue({ description: '', unitPrice: 0, partId: null });
   }

   onPartSelect(e: Event, index: number) {
      const partId = (e.target as HTMLSelectElement).value;
      const part = this.parts().find(p => p.id === partId);
      const group = this.items.at(index) as FormGroup;

      if (part) {
         group.patchValue({
            description: `${part.reference} - ${part.name}`,
            unitPrice: part.sellPrice,
            partId: part.id
         });
      }
   }

   onLaborSelect(e: Event, index: number) {
      const rateId = (e.target as HTMLSelectElement).value;
      const rate = this.rates().find(r => r.id === rateId);
      const group = this.items.at(index) as FormGroup;

      if (rate) {
         group.patchValue({
            description: rate.name,
            unitPrice: rate.hourlyRate
         });
      }
   }

   formatMoney(val: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(val); }

   submitQuote() {
      if (this.quoteForm.invalid) return;
      const opp = this.selectedOpp();
      if (!opp) return;

      // IF RE-EDITING ALREADY EXISTENT QUOTE
      const existingQuoteId = opp.myQuoteId;

      // Calculate Items & Totals
      const items: InvoiceItem[] = this.items.value.map((i: any) => ({
         description: i.description,
         quantity: i.quantity,
         unitPrice: i.unitPrice,
         totalHT: i.quantity * i.unitPrice,
         partId: i.partId
      }));

      const totalHT = items.reduce((sum, i) => sum + i.totalHT, 0);
      const totalVAT = totalHT * 0.18;

      if (!existingQuoteId) {
         // --- NEW QUOTE: Ensure Client & Vehicle exist in DB first, then Invoice ---
         let client: any = this.dataService.clients().find(c => c.phone === opp.motoristPhone || (c.email && c.email === opp.motoristEmail));

         if (!client) {
            client = {
               id: this.generateUUID(),
               type: 'Particulier',
               firstName: opp.motoristName.split(' ')[0] || 'Client',
               lastName: opp.motoristName.split(' ').slice(1).join(' ') || 'Lead',
               email: opp.motoristEmail || '',
               phone: opp.motoristPhone,
               address: { street: 'Via Pro Devis Auto', city: opp.locationCity, zip: '' },
               financial: { paymentMethod: 'Espèces', paymentTerms: 'Comptant', discountPercent: 0, balance: 0 },
               vehicleIds: [],
               notes: `Lead Pro Devis #${opp.id}`,
               history: [{ date: new Date().toISOString(), action: 'Création auto (Devis Lead)', user: 'Système' }]
            };
         }
         // Always POST (backend uses upsert — safe if already exists)
         const clientObs = this.dataService.addClientAsync(client);

         const clientId = client.id;
         const clientName = `${client.firstName} ${client.lastName}`;

         let vehicle: any = this.dataService.vehicles().find(v => v.ownerId === clientId &&
            ((v.vin && v.vin === opp.vehicleVin) ||
               (v.plate && v.plate === opp.vehiclePlate) ||
               (v.brand === opp.vehicleBrand && v.model === opp.vehicleModel)));

         if (!vehicle) {
            vehicle = {
               id: this.generateUUID(),
               ownerId: clientId,
               plate: opp.vehiclePlate || '',
               vin: opp.vehicleVin || '',
               brand: opp.vehicleBrand,
               model: opp.vehicleModel,
               firstRegistrationDate: opp.vehicleYear ? `${opp.vehicleYear}-01-01` : new Date().toISOString(),
               fiscalPower: 0,
               fuel: opp.fuel || 'Essence',
               gearbox: 'Manuelle',
               mileage: opp.mileage || 0,
               history: [{ date: new Date().toISOString(), action: 'Création auto (Devis Lead)', user: 'Système' }]
            };
         }
         // Always POST (backend uses upsert — safe if already exists)
         const vehicleObs = this.dataService.addVehicleAsync(vehicle);

         const vehicleId = vehicle.id;
         const vehicleDesc = `${vehicle.brand} ${vehicle.model}`;

         // Wait for Client AND Vehicle to be saved in DB, THEN create Invoice using their true IDs
         forkJoin([clientObs, vehicleObs]).subscribe({
            next: ([savedClient, savedVehicle]) => {
               const invoice: Invoice = {
                  id: this.generateUUID(),
                  number: `PDA-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
                  type: 'DEVIS',
                  status: 'EN_REVISION',
                  date: new Date().toISOString(),
                  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  clientId: savedClient.id || clientId,
                  clientName: clientName,
                  vehicleId: savedVehicle.id || vehicleId,
                  vehicleDescription: vehicleDesc,
                  items,
                  totalHT,
                  totalVAT,
                  totalTTC: totalHT + totalVAT,
                  paidAmount: 0,
                  remainingAmount: totalHT + totalVAT,
                  tenantId: this.dataService.currentTenantId() || opp.assignedTenantIds?.[0] || 't1',
                  restitutionDate: this.quoteForm.value.restitutionDate
               };

               this.dataService.submitQuoteForReview(opp.id, invoice);
               this.toastService.show('Devis soumis au Super-Admin pour validation.', 'success');
            },
            error: (err) => {
               console.error('Error creating client/vehicle before invoice', err);
               this.toastService.show('Erreur lors de la création du client/véhicule.', 'error');
            }
         });
      } else {
         // --- RE-EDIT existing quote ---
         const oldInvoice = this.dataService.getInvoiceById(existingQuoteId)!;
         const invoice: Invoice = {
            ...oldInvoice,
            restitutionDate: this.quoteForm.value.restitutionDate,
            items: items,
            totalHT: totalHT,
            totalVAT: totalVAT,
            totalTTC: totalHT + totalVAT,
            remainingAmount: totalHT + totalVAT
         };
         this.dataService.submitQuoteForReview(opp.id, invoice);
         this.toastService.show('Devis modifié et repassé en validation.', 'success');
      }

      this.closeQuoteModal();
   }

   sendToWorkshop(opp: QuoteRequest) {
      if (opp.status !== 'COMPLETED' && opp.status !== 'CONVERTED') return;
      if (!opp.acceptedQuoteId) {
         this.toastService.show('Le client doit d\'abord accepter le devis.', 'error');
         return;
      }

      let repairItems: RepairItem[] = [];
      let clientId: string | undefined = undefined;
      let vehicleId = 'unknown';
      let isLocked = false;

      const targetQuoteId = opp.acceptedQuoteId || opp.garageQuoteId;
      if (targetQuoteId) {
         const invoice = this.dataService.getInvoiceById(targetQuoteId);
         if (invoice) {
            clientId = invoice.clientId;
            vehicleId = invoice.vehicleId || 'unknown';
            isLocked = true;
            repairItems = invoice.items.map(i => {
               const isPart = !!i.partId;
               return {
                  type: isPart ? 'part' : 'labor',
                  partId: i.partId,
                  description: i.description,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  fulfillmentStatus: isPart ? 'REQUESTED' : 'PENDING'
               };
            });
         }
      }

      let clientObs = clientId ? of({ id: clientId }) : null;
      let vehicleObs = vehicleId !== 'unknown' ? of({ id: vehicleId }) : null;

      if (!clientObs) {
         let client = this.dataService.clients().find(c => c.phone === opp.motoristPhone || (c.email && c.email === opp.motoristEmail));
         if (!client) {
            client = {
               id: this.generateUUID(),
               type: 'Particulier',
               firstName: opp.motoristName.split(' ')[0] || 'Client',
               lastName: opp.motoristName.split(' ').slice(1).join(' ') || 'Lead',
               email: opp.motoristEmail || '',
               phone: opp.motoristPhone,
               address: { street: 'Via Pro Devis Auto', city: opp.locationCity || '', zip: '' },
               financial: { paymentMethod: 'Espèces', paymentTerms: 'Comptant', discountPercent: 0, balance: 0 },
               vehicleIds: [],
               notes: `Lead Pro Devis #${opp.id}`,
               history: [{ date: new Date().toISOString(), action: 'Création auto', user: 'Système' }]
            };
         }
         clientObs = this.dataService.addClientAsync(client);
         clientId = client.id; // temporary ID
      }

      if (!vehicleObs) {
         let vehicle = this.dataService.vehicles().find(v => v.ownerId === clientId &&
            ((v.vin && v.vin === opp.vehicleVin) ||
               (v.plate && v.plate === opp.vehiclePlate) ||
               (v.brand === opp.vehicleBrand && v.model === opp.vehicleModel)));

         if (!vehicle) {
            vehicle = {
               id: this.generateUUID(),
               ownerId: clientId,
               plate: opp.vehiclePlate || '',
               vin: opp.vehicleVin || '',
               brand: opp.vehicleBrand,
               model: opp.vehicleModel,
               firstRegistrationDate: opp.vehicleYear ? `${opp.vehicleYear}-01-01` : new Date().toISOString(),
               fiscalPower: 0,
               fuel: opp.fuel || 'Essence',
               gearbox: 'Manuelle',
               mileage: opp.mileage || 0,
               history: [{ date: new Date().toISOString(), action: 'Création auto', user: 'Système' }]
            };
         }
         vehicleObs = this.dataService.addVehicleAsync(vehicle);
      }

      forkJoin([clientObs, vehicleObs]).subscribe({
         next: ([savedClient, savedVehicle]) => {
            const newRepair: RepairOrder = {
               id: this.generateUUID(),
               vehicleId: savedVehicle.id || vehicleId,
               clientId: savedClient.id || clientId,
               status: 'En attente',
               entryDate: new Date().toISOString(),
               description: opp.description || `INTERVENTION VALIDÉE (Pro Devis Auto # ${opp.id.substring(0, 4)})`,
               items: repairItems,
               history: [{
                  date: new Date().toISOString(),
                  description: 'Création automatique (Pro Devis Auto)',
                  user: this.dataService.currentUser().firstName
               }],
               downPayments: [],
               timeLogs: [],
               isLocked
            };

            this.dataService.addRepair(newRepair);
            this.dataService.markOpportunityAsConverted(opp.id, newRepair.id);

            this.toastService.show('Dossier transféré à l\'Atelier avec succès.', 'success');
            this.router.navigate(['/repairs'], { queryParams: { openId: newRepair.id } });
         },
         error: (err) => {
            console.error('Error creating client/vehicle before repair', err);
            this.toastService.show('Erreur lors de la création du dossier.', 'error');
         }
      });
   }

   goToRepair(opp?: QuoteRequest) {
      if (opp && opp.repairOrderId) {
         this.router.navigate(['/repairs'], { queryParams: { openId: opp.repairOrderId } });
      } else {
         this.router.navigate(['/repairs']);
      }
   }

   // --- Helpers for Display ---
   getPeriodLabel(val?: string): string {
      switch (val) {
         case 'Urgent': return 'Au plus vite';
         case 'Week': return 'Cette semaine';
         case 'NextWeek': return 'Semaine prochaine';
         case 'Month': return 'Dans le mois';
         default: return 'Indifférent';
      }
   }

   getInterventionLabel(val: string): string {
      const map: Record<string, string> = {
         'diagnostic': 'Diagnostic recherché',
         'maintenance': 'Entretien & Révision',
         'repair': 'Réparation mécanique',
         'bodywork': 'Carrosserie / Peinture',
         'tires': 'Pneumatiques'
      };
      return map[val] || val;
   }

   getLocationLabel(location?: string): string {
      switch (location) {
         case 'GARAGE': return 'Au garage';
         case 'TOWING': return 'Besoin de remorquage';
         case 'WORK': return 'Au travail';
         case 'HOME': return 'A domicile';
         case 'OTHER': return 'Autre';
         default: return 'Non précisé';
      }
   }

   sendQuoteMessage(reqId: string, msgText: string) {
      const msg = msgText.trim();
      if (!msg) return;

      const tenantId = this.dataService.currentTenantId() || 't1';
      const tenant = this.dataService.tenants().find(t => t.id === tenantId);

      this.dataService.addMessageToQuoteRequest(reqId, {
         senderId: tenant?.id || 't1',
         senderName: tenant?.name || 'Garage Partenaire',
         tenantId: tenant?.id || 't1', // Provide tenant context
         message: msg
      });
      this.toastService.show('Message envoyé', 'success');
   }

   getMessages(req: any) {
      if (!req || !req.messages) return [];
      const tId = this.dataService.currentTenantId();
      return req.messages.filter((m: any) => m.tenantId === tId);
   }
}
