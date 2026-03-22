
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, RepairOrder, RepairStatus, RepairItem, RepairCheckIn, DownPayment, FulfillmentStatus, Invoice, InvoiceItem } from '../../services/data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl, FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
   selector: 'app-repairs',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, FormsModule],
   host: { class: 'block h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]' },
   template: `
    <div class="h-full flex flex-col">
      <!-- Header & Left Pane -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 shrink-0 gap-4">
        <div>
           <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-1">Atelier & Réparations</h1>
           <p class="text-slate-500 dark:text-slate-400">Suivi des ordres de réparation (OR).</p>
        </div>
        <div class="flex gap-3 w-full md:w-auto">
           <button (click)="goToDocuments()" class="flex-1 md:flex-none justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 px-4 py-2 rounded-lg font-medium transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span class="hidden sm:inline">Historique</span> Docs
           </button>
           <button (click)="openNewRepairModal()" class="flex-1 md:flex-none justify-center bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-brand-600/20">
              + Créer OR
           </button>
        </div>
      </div>

      <div class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden relative min-h-0">
         
         <!-- List Side -->
         <div class="w-full lg:w-[350px] xl:w-1/3 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shrink-0 shadow-lg min-h-0"
              [ngClass]="{
                'hidden lg:flex': selectedRepairId() !== null,
                'flex': selectedRepairId() === null
              }">
            <div class="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2 shrink-0">
               <div class="flex gap-2">
                  <input type="text" [value]="searchTerm()" (input)="updateSearch($event)" placeholder="Rechercher..." class="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-brand-500 focus:border-brand-500">
                  <select [value]="statusFilter()" (change)="updateStatusFilter($event)" class="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-brand-500 focus:border-brand-500 max-w-[110px]">
                     <option value="">Status...</option>
                     <option value="En attente">Attente</option>
                     <option value="Diagnostic">Diag</option>
                     <option value="Devis">Devis</option>
                     <option value="En cours">En cours</option>
                     <option value="Terminé">Terminé</option>
                     <option value="Clôturé">Clôturé</option>
                  </select>
               </div>
               <select [value]="clientFilter()" (change)="updateClientFilter($event)" class="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-brand-500 focus:border-brand-500">
                  <option value="">Tous les clients</option>
                  @for (client of dataService.clients(); track client.id) { <option [value]="client.id">{{ client.firstName }} {{ client.lastName }}</option> }
               </select>
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
               @for (repair of filteredRepairs(); track repair.id) {
                  <div (click)="selectRepair(repair)" class="p-4 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                       [class.border-brand-500]="selectedRepairId() === repair.id" [class.bg-brand-50]="selectedRepairId() === repair.id" [class.dark:bg-slate-800]="selectedRepairId() === repair.id" [class.border-slate-200]="selectedRepairId() !== repair.id" [class.dark:border-slate-800]="selectedRepairId() !== repair.id" [class.bg-white]="selectedRepairId() !== repair.id" [class.dark:bg-slate-900]="selectedRepairId() !== repair.id">
                     <div class="flex justify-between items-start mb-1">
                        <span class="font-bold text-slate-900 dark:text-white">{{ getVehiclePlate(repair.vehicleId) }}</span>
                        <span [class]="getStatusColor(repair.status)" class="text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide">{{ repair.status }}</span>
                     </div>
                     <div class="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">{{ getClientName(repair.clientId) }} <span class="text-slate-400 text-xs">•</span> {{ getVehicleName(repair.vehicleId) }}</div>
                     <div class="text-xs text-slate-500 mt-1 line-clamp-2">{{ repair.description }}</div>
                     <div class="mt-2 text-xs text-slate-600 dark:text-slate-400 flex justify-between items-center">
                        <span>{{ formatDate(repair.entryDate) }}</span>
                        @if (repair.mechanic) { <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {{ repair.mechanic }}</span> }
                     </div>
                  </div>
               }
               @if (filteredRepairs().length === 0) { <div class="text-center p-4 text-slate-500 text-sm italic">Aucun ordre de réparation trouvé.</div> }
            </div>
         </div>

         <!-- Detail Side -->
         <div class="w-full lg:flex-1 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg min-h-0" [ngClass]="{'hidden lg:flex': selectedRepairId() === null, 'flex': selectedRepairId() !== null}">
            
            @if (selectedRepair(); as repair) {
               <div class="lg:hidden bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center shrink-0 z-20">
                  <button (click)="deselectRepair()" class="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 font-bold">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Retour
                  </button>
               </div>

               <div class="flex-1 overflow-y-auto min-h-0 flex flex-col">
                  
                  <!-- Info Header -->
                  <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start bg-slate-50 dark:bg-slate-800/30 gap-4 shrink-0">
                     <div class="flex-1 mr-4 w-full">
                        <div class="flex items-center justify-between md:justify-start gap-3 flex-wrap">
                           <h2 class="text-2xl font-bold text-slate-900 dark:text-white">OR #{{ repair.id.substring(0,6) }}</h2>
                           <span [class]="getStatusColor(repair.status)" class="text-sm px-3 py-1 rounded-full border font-normal">{{ repair.status }}</span>
                           @if (repair.isLocked) {
                              <span class="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded border border-amber-200 font-bold flex items-center gap-1">
                                 <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" /></svg>
                                 PRO DEVIS (Verrouillé)
                              </span>
                           }
                        </div>
                        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                           <span class="text-brand-600 dark:text-brand-400 font-medium">{{ getClientName(repair.clientId) }}</span> <span class="mx-2 text-slate-400">|</span> {{ getVehicleName(repair.vehicleId) }} <span class="text-slate-600 dark:text-slate-300 font-mono text-sm ml-1">({{ getVehiclePlate(repair.vehicleId) }})</span>
                        </p>
                        <div class="mt-4 flex items-center gap-2">
                           <label class="text-xs text-slate-500 uppercase font-semibold">Mécanicien :</label>
                           <select [ngModel]="repair.mechanic || ''" (ngModelChange)="assignMechanicValue($event, repair.id)" class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded px-2 py-1 focus:ring-brand-500">
                              <option value="">-- Non assigné --</option>
                              @if (repair.mechanic && !dataService.mechanics().includes(repair.mechanic)) {
                                 <option [value]="repair.mechanic">{{ repair.mechanic }} (Ancien/Inactif)</option>
                              }
                              @for (mech of dataService.mechanics(); track mech) { <option [value]="mech">{{ mech }}</option> }
                           </select>
                        </div>
                     </div>
                     <div class="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 border-slate-200 dark:border-slate-800 pt-4 md:pt-0 mt-2 md:mt-0">
                        <select [value]="repair.status" (change)="updateStatus($event, repair.id)" class="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-3 py-1.5 text-sm focus:ring-brand-500">
                           <option value="En attente">En attente</option>
                           @if (!repair.isLocked) {
                              <option value="Diagnostic">Diagnostic</option>
                              <option value="Devis">Devis</option>
                           }
                           <option value="En cours" [disabled]="!repair.mechanic">En cours {{ !repair.mechanic ? '(Assigner Mécanicien)' : '' }}</option>
                           <option value="Terminé" [disabled]="!repair.mechanic">Terminé {{ !repair.mechanic ? '(Assigner Mécanicien)' : '' }}</option>
                           <option value="Clôturé" [disabled]="!repair.mechanic">Clôturé {{ !repair.mechanic ? '(Assigner Mécanicien)' : '' }}</option>
                        </select>
                     </div>
                  </div>

                  <!-- Check-in Info -->
                  @if (repair.checkIn) {
                    <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                       <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Réception Véhicule</h3>
                       <div class="flex flex-col md:flex-row gap-6 items-start">
                          <!-- Fuel Gauge -->
                          <div class="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner flex items-center gap-3 w-full md:w-auto justify-between md:justify-start shrink-0">
                             <div class="flex items-center gap-3">
                                <div class="flex flex-col items-center justify-center text-slate-500 px-1">
                                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M4 6a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M4 12a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z"/> 
                                   </svg>
                                   <span class="text-[9px] font-bold uppercase tracking-tighter mt-0.5">Fuel</span>
                                </div>
                                <div class="flex flex-col gap-1">
                                   <div class="flex gap-1 h-5 items-end">
                                      @for (seg of [1,2,3,4,5,6,7,8]; track seg) {
                                         <div class="w-3 rounded-sm transition-all duration-300"
                                              [class.h-3]="seg % 2 !== 0" 
                                              [class.h-5]="seg % 2 === 0"
                                              [ngClass]="getFuelSegmentClass(seg, repair.checkIn.fuelLevel)">
                                         </div>
                                      }
                                   </div>
                                   <div class="flex justify-between text-[9px] font-mono text-slate-500 px-0.5"><span>E</span><span>1/2</span><span>F</span></div>
                                </div>
                             </div>
                             <div class="text-right pl-2 border-l border-slate-200 dark:border-slate-800">
                                <span class="text-2xl font-bold font-mono" [class]="getFuelTextClass(repair.checkIn.fuelLevel)">
                                   {{ (repair.checkIn.fuelLevel * 100).toFixed(0) }}<span class="text-sm align-top opacity-70">%</span>
                                </span>
                             </div>
                          </div>
                          <!-- Checklist Grid -->
                          <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs bg-white dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 w-full">
                             <span class="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" [class.border-emerald-500_30]="repair.checkIn.checklist.securityNut">
                                <span class="w-4 h-4 flex items-center justify-center rounded-full text-[10px]" [class]="repair.checkIn.checklist.securityNut ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'">{{ repair.checkIn.checklist.securityNut ? '✓' : '•' }}</span>
                                <span [class.text-slate-900]="repair.checkIn.checklist.securityNut" [class.dark:text-white]="repair.checkIn.checklist.securityNut" [class.text-slate-500]="!repair.checkIn.checklist.securityNut">Écrou</span>
                             </span>
                             <span class="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" [class.border-emerald-500_30]="repair.checkIn.checklist.spareWheel">
                                <span class="w-4 h-4 flex items-center justify-center rounded-full text-[10px]" [class]="repair.checkIn.checklist.spareWheel ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'">{{ repair.checkIn.checklist.spareWheel ? '✓' : '•' }}</span>
                                <span [class.text-slate-900]="repair.checkIn.checklist.spareWheel" [class.dark:text-white]="repair.checkIn.checklist.spareWheel" [class.text-slate-500]="!repair.checkIn.checklist.spareWheel">Roue</span>
                             </span>
                             <span class="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" [class.border-emerald-500_30]="repair.checkIn.checklist.safetyVest">
                                <span class="w-4 h-4 flex items-center justify-center rounded-full text-[10px]" [class]="repair.checkIn.checklist.safetyVest ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'">{{ repair.checkIn.checklist.safetyVest ? '✓' : '•' }}</span>
                                <span [class.text-slate-900]="repair.checkIn.checklist.safetyVest" [class.dark:text-white]="repair.checkIn.checklist.safetyVest" [class.text-slate-500]="!repair.checkIn.checklist.safetyVest">Gilet</span>
                             </span>
                             <span class="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" [class.border-emerald-500_30]="repair.checkIn.checklist.radioFaceplate">
                                <span class="w-4 h-4 flex items-center justify-center rounded-full text-[10px]" [class]="repair.checkIn.checklist.radioFaceplate ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'">{{ repair.checkIn.checklist.radioFaceplate ? '✓' : '•' }}</span>
                                <span [class.text-slate-900]="repair.checkIn.checklist.radioFaceplate" [class.dark:text-white]="repair.checkIn.checklist.radioFaceplate" [class.text-slate-500]="!repair.checkIn.checklist.radioFaceplate">Radio</span>
                             </span>
                             <span class="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" [class.border-emerald-500_30]="repair.checkIn.checklist.serviceBook">
                                <span class="w-4 h-4 flex items-center justify-center rounded-full text-[10px]" [class]="repair.checkIn.checklist.serviceBook ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'">{{ repair.checkIn.checklist.serviceBook ? '✓' : '•' }}</span>
                                <span [class.text-slate-900]="repair.checkIn.checklist.serviceBook" [class.dark:text-white]="repair.checkIn.checklist.serviceBook" [class.text-slate-500]="!repair.checkIn.checklist.serviceBook">Carnet</span>
                             </span>
                          </div>
                          @if (repair.checkIn.photos.length > 0) {
                             <div class="flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 h-[86px] w-24 shrink-0 cursor-pointer hover:border-brand-500 transition-colors group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-brand-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span class="text-xs font-bold text-slate-900 dark:text-white mt-1">{{ repair.checkIn.photos.length }}</span>
                                <span class="text-[9px] text-slate-500">Photos</span>
                             </div>
                          }
                       </div>
                       @if (repair.checkIn.additionalInfo) {
                          <div class="mt-4 flex gap-2 text-sm text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-slate-800/30 p-3 rounded-lg border border-amber-100 dark:border-slate-800/50">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                             <span class="italic">"{{ repair.checkIn.additionalInfo }}"</span>
                          </div>
                       }
                    </div>
                  }

                  <!-- Parts & Labor -->
                  <div class="p-4 md:p-6 shrink-0">
                     <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <h3 class="font-bold text-slate-900 dark:text-white">Détail des Travaux</h3>
                        @if (repair.status !== 'Clôturé' && !repair.isLocked) {
                          <button (click)="openAddItemModal()" class="w-full sm:w-auto text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-600 dark:text-brand-400 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                             Ajouter Pièce / MO / Forfait
                          </button>
                        }
                     </div>

                     <div class="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                        <table class="w-full text-sm text-left mb-4 min-w-[600px]">
                           <thead class="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
                              <tr>
                                 <th class="px-4 py-3">Type</th>
                                 <th class="px-4 py-3">Description</th>
                                 <th class="px-4 py-3">Logistique</th>
                                 <th class="px-4 py-3 text-right">Qté</th>
                                 @if (dataService.canViewFinancials() || dataService.canInvoice()) {
                                    <th class="px-4 py-3 text-right">P.U.</th>
                                    <th class="px-4 py-3 text-right">Total HT</th>
                                 }
                                 <th class="px-4 py-3 w-20 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                              @for (item of repair.items; track $index) {
                                 <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td class="px-4 py-3">
                                       @if(item.type === 'labor') { <span class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">MO</span> }
                                       @else { <span class="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded">Pièce</span> }
                                    </td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ item.description }}</td>
                                    <td class="px-4 py-3">
                                       @if(item.type === 'part' && repair.status !== 'Clôturé') {
                                          <div class="flex items-center gap-2">
                                             @if (!item.fulfillmentStatus || item.fulfillmentStatus === 'PENDING') {
                                                <span class="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">En attente</span>
                                                @if (repair.status === 'En cours' || repair.status === 'En attente') { <button (click)="askLogisticsAction(repair.id, $index, 'REQUEST')" class="text-[10px] text-blue-500 hover:text-blue-400 underline">Demander</button> }
                                             } @else if (item.fulfillmentStatus === 'REQUESTED') {
                                                <span class="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">Demandé (Atelier)</span>
                                             } @else if (item.fulfillmentStatus === 'DELIVERED') {
                                                <span class="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                   <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                                   Sortie Validée
                                                </span>
                                             }
                                          </div>
                                       } @else if (item.type === 'part') { <span class="text-[10px] text-slate-500">Livré</span> }
                                    </td>
                                    <td class="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{{ item.quantity }}</td>
                                    @if (dataService.canViewFinancials() || dataService.canInvoice()) {
                                       <td class="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{{ formatMoney(item.unitPrice) }}</td>
                                       <td class="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-200">{{ formatMoney(item.quantity * item.unitPrice) }}</td>
                                    }
                                    <td class="px-4 py-3 text-right">
                                       @if (repair.status !== 'Clôturé' && !repair.isLocked) {
                                          <div class="flex justify-end gap-2">
                                             <button (click)="openEditItemModal($index)" class="text-slate-500 hover:text-blue-500 transition-colors" title="Modifier"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                             <button (click)="askDeleteItem($index)" class="text-slate-500 hover:text-red-500 transition-colors" title="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                                          </div>
                                       }
                                    </td>
                                 </tr>
                              }
                           </tbody>
                        </table>
                     </div>
                     
                     <!-- FINANCIALS -->
                     @if (dataService.canViewFinancials() || dataService.canInvoice()) {
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                           
                           <!-- Financial Inputs -->
                           <div class="space-y-3">
                              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">Facturation & Devis</h3>
                              
                              <div class="grid grid-cols-2 gap-3">
                                 <div>
                                    <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">TVA (%)</label>
                                    <select [ngModel]="repair.vatRate ?? dataService.currentSettings().defaultVatRate" (ngModelChange)="updateFinancials(repair.id, 'vatRate', $event)" [disabled]="repair.isLocked" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                       @for(rate of vatRates; track rate) { <option [ngValue]="rate">{{ rate }}%</option> }
                                    </select>
                                 </div>
                                 <div>
                                    <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type Remise</label>
                                    <select [ngModel]="repair.discountType || 'FIXED'" (ngModelChange)="updateFinancials(repair.id, 'discountType', $event)" [disabled]="repair.isLocked" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                       <option value="FIXED">Montant Fixe</option>
                                       <option value="PERCENT">Pourcentage (%)</option>
                                    </select>
                                 </div>
                              </div>
                              
                              <div>
                                 <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valeur Remise</label>
                                 <input type="number" [ngModel]="repair.discountValue || 0" (ngModelChange)="updateFinancials(repair.id, 'discountValue', $event)" [disabled]="repair.isLocked" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              </div>

                              <div>
                                 <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes Financières (Internes/Facture)</label>
                                 <textarea [ngModel]="repair.financialNotes || ''" (ngModelChange)="updateFinancials(repair.id, 'financialNotes', $event)" [disabled]="repair.isLocked" rows="2" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Ex: Remise commerciale exceptionnelle..."></textarea>
                              </div>
                           </div>

                           <!-- Totals Table -->
                           <div class="flex flex-col justify-end">
                              <table class="w-full text-sm">
                                 <tbody>
                                    <tr>
                                       <td class="py-1 text-slate-500 dark:text-slate-400">Total Brut HT</td>
                                       <td class="py-1 text-right font-medium text-slate-700 dark:text-slate-300">{{ formatMoney(calculateSubTotal(repair)) }}</td>
                                    </tr>
                                    @if(calculateDiscountAmount(repair) > 0) {
                                       <tr>
                                          <td class="py-1 text-slate-500 dark:text-slate-400">Remise {{ repair.discountType === 'PERCENT' ? '(' + repair.discountValue + '%)' : '' }}</td>
                                          <td class="py-1 text-right font-medium text-red-500">-{{ formatMoney(calculateDiscountAmount(repair)) }}</td>
                                       </tr>
                                    }
                                    <tr class="border-t border-slate-200 dark:border-slate-700">
                                       <td class="py-1 pt-2 text-slate-700 dark:text-slate-300 font-bold">Net HT</td>
                                       <td class="py-1 pt-2 text-right font-bold text-slate-900 dark:text-white">{{ formatMoney(calculateNetHT(repair)) }}</td>
                                    </tr>
                                    <tr>
                                       <td class="py-1 text-slate-500 dark:text-slate-400">TVA ({{ repair.vatRate ?? dataService.currentSettings().defaultVatRate }}%)</td>
                                       <td class="py-1 text-right font-medium text-slate-700 dark:text-slate-300">{{ formatMoney(calculateVATAmount(repair)) }}</td>
                                    </tr>
                                    <tr class="border-t-2 border-slate-300 dark:border-slate-600 text-lg">
                                       <td class="py-2 font-bold text-slate-900 dark:text-white">Total TTC</td>
                                       <td class="py-2 text-right font-bold text-brand-600 dark:text-brand-400">{{ formatMoney(calculateTotal(repair)) }}</td>
                                    </tr>
                                 </tbody>
                              </table>
                              
                              <!-- Payments Info -->
                              <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                 <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-bold text-slate-500 uppercase">Acomptes Reçus</span>
                                    @if(repair.status !== 'Clôturé') {
                                       <button (click)="openDownPaymentModal()" class="text-xs text-brand-600 hover:underline">+ Ajouter</button>
                                    }
                                 </div>
                                 @if(repair.downPayments.length > 0) {
                                    @for(dp of repair.downPayments; track dp.id) {
                                       <div class="flex justify-between text-xs text-slate-500 mb-1">
                                          <span>{{ formatDate(dp.date) }} ({{ dp.method }})</span>
                                          <span class="text-emerald-600 font-medium">-{{ formatMoney(dp.amount) }}</span>
                                       </div>
                                    }
                                    <div class="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                       <span class="text-slate-700 dark:text-slate-300">Reste à Payer</span>
                                       <span class="text-slate-900 dark:text-white">{{ formatMoney(calculateRemainingDue(repair)) }}</span>
                                    </div>
                                 } @else {
                                    <p class="text-xs text-slate-400 italic">Aucun acompte.</p>
                                 }
                              </div>
                           </div>
                        </div>
                     }

                     <div class="mb-8">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Historique & Suivi</h3>
                        <div class="space-y-3 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                           @for (event of repair.history; track $index) {
                              <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                 <div class="flex items-center justify-center w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:bg-brand-500 transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                                 <div class="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                                    <div class="flex flex-col mb-1">
                                       <div class="font-bold text-slate-700 dark:text-slate-300 text-xs">{{ event.description }}</div>
                                       <div class="flex justify-between text-[10px] text-slate-500 mt-1">
                                          <time class="font-mono">{{ formatDateFull(event.date) }}</time>
                                          <span>{{ event.user || 'Système' }}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           }
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Fixed Bottom Bar -->
               <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky bottom-0 z-10 shrink-0">
                  <button (click)="askDeleteRepair()" class="text-xs text-red-500 hover:text-red-400 hover:underline">Supprimer</button>
                  <div class="flex gap-3">
                     @if (dataService.canInvoice()) {
                        @if (!repair.isLocked) {
                           <button (click)="askGenerateQuote(repair)" class="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-white rounded flex items-center gap-2 transition-colors shadow-sm text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span class="hidden sm:inline">Générer</span> Devis
                           </button>
                        }
                        @if (repair.status === 'Terminé' || repair.status === 'Clôturé') {
                           <button (click)="createDocumentAndRedirect('Facture', repair)" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-2 transition-colors shadow-sm shadow-emerald-600/20 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span class="hidden sm:inline">Générer</span> Facture
                           </button>
                        }
                     }
                  </div>
               </div>

            } @else {
               <!-- Desktop placeholder -->
               <div class="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hidden lg:flex">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-16 mb-4 opacity-50">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p>Sélectionnez un Ordre de Réparation pour voir les détails.</p>
               </div>
            }
         </div>
      </div>
    </div>
    
    <!-- MODALS -->

    @if (showCreateModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
               <span>Nouvel Ordre de Réparation</span>
               <button (click)="closeCreateModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
             </div>
             <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="p-6 space-y-6">
                <!-- ... Content ... -->
                <div class="space-y-4">
                  <h3 class="text-sm font-semibold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-2">Informations Générales</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Véhicule</label>
                        <input type="text" [value]="vehicleSearchTerm()" (input)="updateVehicleSearch($event)" placeholder="Recherche (Plaque, Client)..." class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-t px-3 py-1.5 text-xs text-slate-900 dark:text-white mb-0.5 focus:ring-1 focus:ring-brand-500">
                        <select formControlName="vehicleId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-b px-3 py-2 text-slate-900 dark:text-white">
                           @for (v of filteredVehicles(); track v.id) { <option [value]="v.id">{{ v.plate }} - {{ v.brand }} {{ v.model }} ({{ getClientName(v.ownerId) }})</option> }
                           @if(filteredVehicles().length === 0) { <option value="" disabled>Aucun véhicule trouvé</option> }
                        </select>
                     </div>
                     <div><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Motif / Description</label><textarea formControlName="description" rows="1" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></textarea></div>
                  </div>
                </div>
                <div formGroupName="checkIn" class="space-y-4">
                  <h3 class="text-sm font-semibold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-2">Tour du véhicule</h3>
                  <div formGroupName="checklist" class="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" formControlName="securityNut" class="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-brand-600 focus:ring-brand-500"><span class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Écrou antivol</span></label>
                     <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" formControlName="spareWheel" class="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-brand-600 focus:ring-brand-500"><span class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Roue de secours</span></label>
                     <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" formControlName="safetyVest" class="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-brand-600 focus:ring-brand-500"><span class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Gilet / Triangle</span></label>
                     <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" formControlName="radioFaceplate" class="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-brand-600 focus:ring-brand-500"><span class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Façade Radio</span></label>
                     <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" formControlName="serviceBook" class="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-brand-600 focus:ring-brand-500"><span class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Carnet entretien</span></label>
                  </div>
                  <div class="mt-4"><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Niveau Carburant</label><div class="flex items-center gap-4"><span class="text-xs text-slate-500 font-bold">E</span><input type="range" formControlName="fuelLevel" min="0" max="1" step="0.125" class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-brand-500"><span class="text-xs text-slate-500 font-bold">F</span></div><div class="text-center text-xs text-brand-500 mt-1">{{ (createForm.get('checkIn.fuelLevel')?.value * 100).toFixed(0) }}%</div></div>
                  <div class="mt-4"><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Photos</label><div class="flex flex-wrap gap-3"><label class="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-brand-500 hover:text-brand-500 text-slate-400 dark:text-slate-500 transition-colors bg-slate-50 dark:bg-slate-800/50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mb-1"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.167-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg><span class="text-[10px] font-bold">Ajouter</span><input type="file" accept="image/*" capture="environment" (change)="onFileSelected($event)" class="hidden"></label>@for (photo of tempPhotos(); track $index) {<div class="relative w-20 h-20 group"><img [src]="photo" class="w-full h-full object-cover rounded-lg border border-slate-300 dark:border-slate-700"><button type="button" (click)="removePhoto($index)" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button></div>}</div></div>
                  <div class="mt-4"><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Informations complémentaires</label><textarea formControlName="additionalInfo" rows="2" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white text-sm"></textarea></div>
                </div>
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                   <button type="button" (click)="closeCreateModal()" class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">Annuler</button>
                   <button type="submit" class="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-500 shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:shadow-none">Créer OR</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- ... (Other modals) ... -->
    @if (showAddItemModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                {{ editingItemIndex() !== null ? 'Modifier ligne' : 'Ajouter une ligne' }}
             </div>
             <form [formGroup]="addItemForm" (ngSubmit)="submitAddItem()" class="p-6 space-y-4">
                @if (editingItemIndex() === null) {
                   <div class="grid grid-cols-3 gap-2 mb-4">
                      <label class="cursor-pointer"><input type="radio" name="mode" value="part" [checked]="addItemMode() === 'part'" (change)="addItemMode.set('part')" class="peer sr-only"><div class="text-center py-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 peer-checked:bg-slate-200 dark:peer-checked:bg-slate-800 peer-checked:border-brand-500 peer-checked:text-brand-600 dark:peer-checked:text-brand-400 text-slate-500 dark:text-slate-400 transition-all text-xs sm:text-sm font-medium">Pièce</div></label>
                      <label class="cursor-pointer"><input type="radio" name="mode" value="labor" [checked]="addItemMode() === 'labor'" (change)="addItemMode.set('labor')" class="peer sr-only"><div class="text-center py-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 peer-checked:bg-slate-200 dark:peer-checked:bg-slate-800 peer-checked:border-blue-500 peer-checked:text-blue-600 dark:peer-checked:text-blue-400 text-slate-500 dark:text-slate-400 transition-all text-xs sm:text-sm font-medium">Main d'œuvre</div></label>
                      <label class="cursor-pointer"><input type="radio" name="mode" value="package" [checked]="addItemMode() === 'package'" (change)="addItemMode.set('package')" class="peer sr-only"><div class="text-center py-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 peer-checked:bg-slate-200 dark:peer-checked:bg-slate-800 peer-checked:border-purple-500 peer-checked:text-purple-600 dark:peer-checked:text-purple-400 text-slate-500 dark:text-slate-400 transition-all text-xs sm:text-sm font-medium">Forfait</div></label>
                   </div>
                }
                @if (addItemMode() === 'part') {
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Rechercher Pièce</label>
                      <select (change)="onPartSelect($event)" formControlName="partId" [attr.disabled]="editingItemIndex() !== null ? true : null" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white disabled:opacity-50">
                         <option value="">Sélectionner...</option>
                         @for (part of dataService.parts(); track part.id) { <option [value]="part.id" [disabled]="part.stock === 0 || (isPartAlreadyInRepair(part.id) && editingItemIndex() === null)">{{ part.reference }} - {{ part.name }} ({{ part.stock }}) - {{ formatMoney(part.sellPrice) }}</option> }
                      </select>
                   </div>
                }
                @if (addItemMode() === 'labor') {
                   @if (editingItemIndex() === null) {
                      <div>
                         <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Type de Taux Horaire</label>
                         <select (change)="onLabourSelect($event)" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                            <option value="">-- Personnalisé --</option>
                            @for (rate of dataService.labourRates(); track rate.id) { <option [value]="rate.id">{{ rate.code }} - {{ rate.name }} ({{ formatMoney(rate.hourlyRate) }}/h)</option> }
                         </select>
                      </div>
                   }
                }
                @if (addItemMode() === 'package') {
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Sélectionner Forfait</label>
                      <select (change)="onPackageSelect($event)" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         <option value="">-- Choisir --</option>
                         @for (pkg of dataService.packages(); track pkg.id) { <option [value]="pkg.id">{{ pkg.name }} - {{ formatMoney(pkg.price) }}</option> }
                      </select>
                   </div>
                }
                @if (addItemMode() !== 'package') {
                   <div><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label><input type="text" formControlName="description" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   <div class="grid grid-cols-2 gap-4">
                      <div><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Quantité / Heures</label><input type="number" formControlName="quantity" [max]="maxQuantity()" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         @if(maxQuantity() < 9999) { <div class="text-[10px] text-amber-500 mt-1">Stock max: {{ maxQuantity() }}</div> }
                      </div>
                      @if (dataService.canViewFinancials()) { <div><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">P.U. HT</label><input type="number" formControlName="unitPrice" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div> }
                   </div>
                }
                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closeAddItemModal()" class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Annuler</button>
                   <button type="submit" class="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-500">{{ editingItemIndex() !== null ? 'Modifier' : 'Ajouter' }}</button>
                </div>
             </form>
          </div>
       </div>
    }
    
    @if (showDownPaymentModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">Ajouter un Acompte</div>
             <form [formGroup]="downPaymentForm" (ngSubmit)="submitDownPayment()" class="p-6 space-y-4">
                <div><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Montant</label><input type="number" formControlName="amount" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                 <div><label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Moyen de paiement</label><select formControlName="method" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"><option value="Carte">Carte Bancaire</option><option value="Espèces">Espèces</option><option value="Virement">Virement</option><option value="Chèque">Chèque</option></select></div>
                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closeDownPaymentModal()" class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Annuler</button>
                   <button type="submit" class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-500">Ajouter</button>
                </div>
             </form>
          </div>
       </div>
    }

    @if (showLogisticsConfirmModal() && logisticsAction(); as action) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
             <div class="p-6 text-center">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Demander la pièce ?</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Envoyer une demande au magasin ?</p>
                <div class="flex gap-3 justify-center">
                   <button (click)="closeLogisticsConfirmModal()" class="px-4 py-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Annuler</button>
                   <button (click)="confirmLogisticsAction()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium">Confirmer</button>
                </div>
             </div>
          </div>
       </div>
    }
    
    @if (showDeleteConfirmModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
             <div class="p-6 text-center">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Supprimer ligne ?</h3>
                <div class="flex gap-3 justify-center mt-6">
                   <button (click)="closeDeleteConfirmModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button (click)="confirmDelete()" class="bg-red-600 text-white px-4 py-2 rounded">Supprimer</button>
                </div>
             </div>
          </div>
       </div>
    }

    @if (showDeleteRepairConfirmModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-t-red-600">
             <div class="p-6">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Supprimer l'Ordre ?</h3>
                <p class="text-sm text-red-600 dark:text-red-400 mb-6">Cette action est irréversible et supprimera toutes les données associées.</p>
                <div class="flex gap-3 justify-end">
                   <button (click)="cancelDeleteRepair()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button (click)="confirmDeleteRepair()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold">Confirmer Suppression</button>
                </div>
             </div>
          </div>
       </div>
    }
  `
})
export class RepairsComponent {
   dataService = inject(DataService);
   toastService = inject(ToastService);
   fb: FormBuilder = inject(FormBuilder);
   router: Router = inject(Router);
   route: ActivatedRoute = inject(ActivatedRoute);

   // List State
   selectedRepairId = signal<string | null>(null);
   searchTerm = signal('');
   statusFilter = signal('');
   clientFilter = signal('');

   // Modals
   showCreateModal = signal(false);
   vehicleSearchTerm = signal('');
   tempPhotos = signal<string[]>([]);
   createForm: FormGroup;

   showAddItemModal = signal(false);
   addItemForm: FormGroup;
   addItemMode = signal<'part' | 'labor' | 'package'>('part');
   editingItemIndex = signal<number | null>(null);
   selectedPartId = signal<string>('');

   showDownPaymentModal = signal(false);
   downPaymentForm: FormGroup;

   showLogisticsConfirmModal = signal(false);
   logisticsAction = signal<{ repairId: string, itemIndex: number, type: 'REQUEST' | 'VALIDATE' } | null>(null);

   showDeleteConfirmModal = signal(false);
   itemToDeleteIndex = signal<number | null>(null);

   showDeleteRepairConfirmModal = signal(false);
   repairToDeleteId = signal<string | null>(null);

   vatRates = [0, 5.5, 10, 18, 20];

   constructor() {
      this.createForm = this.fb.group({
         vehicleId: ['', Validators.required],
         description: ['', Validators.required],
         checkIn: this.fb.group({
            checklist: this.fb.group({
               securityNut: [false],
               spareWheel: [false],
               safetyVest: [false],
               radioFaceplate: [false],
               serviceBook: [false]
            }),
            fuelLevel: [0.5],
            additionalInfo: ['']
         })
      });

      this.addItemForm = this.fb.group({
         partId: [''],
         description: ['', Validators.required],
         quantity: [1, [Validators.required, Validators.min(0.1)]],
         unitPrice: [0, [Validators.required, Validators.min(0)]]
      });

      this.downPaymentForm = this.fb.group({
         amount: [0, [Validators.required, Validators.min(1)]],
         method: ['Carte', Validators.required]
      });

      this.route.queryParams.subscribe(params => {
         if (params['openId']) {
            const id = params['openId'];
            setTimeout(() => {
               this.selectedRepairId.set(id);
               this.router.navigate([], { queryParams: { openId: null }, queryParamsHandling: 'merge', replaceUrl: true });
            }, 50);
         }
      });
   }

   // --- COMPUTED ---
   filteredRepairs = computed(() => {
      const term = this.searchTerm().toLowerCase();
      const status = this.statusFilter();
      const client = this.clientFilter();

      return this.dataService.repairs().filter(r => {
         const matchesTerm = !term ||
            r.description.toLowerCase().includes(term) ||
            this.getVehiclePlate(r.vehicleId).toLowerCase().includes(term) ||
            r.id.toLowerCase().includes(term);

         const matchesStatus = !status || r.status === status;
         const matchesClient = !client || r.clientId === client;

         return matchesTerm && matchesStatus && matchesClient;
      });
   });

   selectedRepair = computed(() => {
      return this.dataService.repairs().find(r => r.id === this.selectedRepairId()) || null;
   });

   filteredVehicles = computed(() => {
      const term = this.vehicleSearchTerm().toLowerCase();
      if (!term) return this.dataService.vehicles();
      return this.dataService.vehicles().filter(v =>
         v.plate.toLowerCase().includes(term) ||
         this.getClientName(v.id).toLowerCase().includes(term)
      );
   });

   maxQuantity = computed(() => {
      if (this.addItemMode() !== 'part') return 9999;
      const partId = this.selectedPartId();
      const part = this.dataService.getPartById(partId);
      return part ? part.stock : 0;
   });

   // --- ACTIONS ---
   selectRepair(repair: RepairOrder) { this.selectedRepairId.set(repair.id); }
   deselectRepair() { this.selectedRepairId.set(null); }

   updateSearch(e: Event) { this.searchTerm.set((e.target as HTMLInputElement).value); }
   updateStatusFilter(e: Event) { this.statusFilter.set((e.target as HTMLSelectElement).value); }
   updateClientFilter(e: Event) { this.clientFilter.set((e.target as HTMLSelectElement).value); }

   getVehiclePlate(id: string) { return this.dataService.getVehicleById(id)?.plate || '---'; }

   getVehicleName(id: string) {
      const v = this.dataService.getVehicleById(id);
      return v ? `${v.brand} ${v.model}` : 'Inconnu';
   }

   getClientName(id: string) {
      // Try to find Client directly by ID first
      const c = this.dataService.getClientById(id);
      if (c) return c.type === 'Entreprise' ? c.companyName || '' : `${c.firstName} ${c.lastName}`;

      // Fallback: If passed ID was a Vehicle ID (legacy support), try to find owner
      const v = this.dataService.getVehicleById(id);
      if (v) {
         const owner = this.dataService.getClientById(v.ownerId);
         return owner ? (owner.type === 'Entreprise' ? owner.companyName || '' : `${owner.firstName} ${owner.lastName}`) : 'Inconnu';
      }

      return 'Inconnu';
   }

   formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); }
   formatDateFull(dateStr: string) { return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
   formatMoney(val: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(val); }

   getStatusColor(status: string) {
      switch (status) {
         case 'En attente': return 'text-slate-500 border-slate-200';
         case 'Diagnostic': return 'text-amber-600 border-amber-200 bg-amber-50';
         case 'Devis': return 'text-purple-600 border-purple-200 bg-purple-50';
         case 'En cours': return 'text-blue-600 border-blue-200 bg-blue-50';
         case 'Terminé': return 'text-emerald-600 border-emerald-200 bg-emerald-50';
         case 'Clôturé': return 'text-slate-400 border-slate-200 bg-slate-100 line-through';
         default: return 'text-slate-500';
      }
   }

   getFuelSegmentClass(seg: number, level: number) {
      // 8 segments, each 0.125
      const threshold = seg * 0.125;
      if (level >= threshold) {
         if (level <= 0.25) return 'bg-red-500';
         if (level <= 0.5) return 'bg-amber-500';
         return 'bg-emerald-500';
      }
      return 'bg-slate-200 dark:bg-slate-800';
   }

   getFuelTextClass(level: number) {
      if (level <= 0.25) return 'text-red-500';
      if (level <= 0.5) return 'text-amber-500';
      return 'text-emerald-500';
   }

   // --- CREATE MODAL ---
   openNewRepairModal() {
      this.createForm.reset({ checkIn: { fuelLevel: 0.5, checklist: { securityNut: false, spareWheel: false, safetyVest: false, radioFaceplate: false, serviceBook: false } } });
      this.vehicleSearchTerm.set('');
      this.tempPhotos.set([]);
      this.showCreateModal.set(true);
   }
   closeCreateModal() { this.showCreateModal.set(false); }
   updateVehicleSearch(e: Event) { this.vehicleSearchTerm.set((e.target as HTMLInputElement).value); }

   onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (e: any) => this.tempPhotos.update(p => [...p, e.target.result]);
         reader.readAsDataURL(file);
      }
   }
   removePhoto(index: number) { this.tempPhotos.update(p => p.filter((_, i) => i !== index)); }

   submitCreate() {
      if (this.createForm.invalid) return;
      const val = this.createForm.value;

      const v = this.dataService.getVehicleById(val.vehicleId);
      if (!v) return;

      const newRepair: RepairOrder = {
         id: crypto.randomUUID(),
         vehicleId: val.vehicleId,
         clientId: v.ownerId,
         status: 'En attente',
         entryDate: new Date().toISOString(),
         description: val.description,
         items: [],
         checkIn: {
            ...val.checkIn,
            photos: this.tempPhotos()
         },
         history: [],
         downPayments: [],
         timeLogs: []
      };
      this.dataService.addRepair(newRepair);
      this.toastService.show('Ordre de réparation créé', 'success');
      this.closeCreateModal();
      this.selectedRepairId.set(newRepair.id);
   }

   // --- STATUS & MECHANIC ---
   assignMechanicValue(mech: string, id: string) {
      this.dataService.updateMechanic(id, mech);
      this.toastService.show('Mécanicien assigné', 'success');
   }

   updateStatus(e: Event, id: string) {
      const status = (e.target as HTMLSelectElement).value as any;
      this.dataService.updateRepairStatus(id, status);
      this.toastService.show(`Statut mis à jour : ${status}`, 'info');
   }

   // --- ADD ITEM MODAL ---
   openAddItemModal() {
      this.editingItemIndex.set(null);
      this.selectedPartId.set('');
      this.addItemForm.reset({ quantity: 1, unitPrice: 0 });
      this.addItemMode.set('part');
      this.showAddItemModal.set(true);
   }

   openEditItemModal(index: number) {
      const repair = this.selectedRepair();
      if (!repair) return;
      const item = repair.items[index];

      this.editingItemIndex.set(index);
      this.addItemMode.set(item.type === 'part' ? 'part' : 'labor'); // Simple check, package treated as labor for now edit
      this.selectedPartId.set(item.partId || '');
      this.addItemForm.patchValue({
         partId: item.partId,
         description: item.description,
         quantity: item.quantity,
         unitPrice: item.unitPrice
      });
      this.showAddItemModal.set(true);
   }

   closeAddItemModal() { this.showAddItemModal.set(false); }

   onPartSelect(e: Event) {
      const pid = (e.target as HTMLSelectElement).value;
      this.selectedPartId.set(pid);
      const p = this.dataService.getPartById(pid);
      if (p) {
         this.addItemForm.patchValue({
            description: `${p.reference} - ${p.name}`,
            unitPrice: p.sellPrice
         });
      }
   }

   onLabourSelect(e: Event) {
      const lid = (e.target as HTMLSelectElement).value;
      const l = this.dataService.labourRates().find(r => r.id === lid);
      if (l) {
         this.addItemForm.patchValue({
            description: l.name,
            unitPrice: l.hourlyRate
         });
      }
   }

   onPackageSelect(e: Event) {
      const pid = (e.target as HTMLSelectElement).value;
      const p = this.dataService.packages().find(pkg => pkg.id === pid);
      if (p) {
         // Just setting description/price for simple handling, ideally packages would add multiple items
         this.addItemForm.patchValue({
            description: `FORFAIT: ${p.name}`,
            unitPrice: p.price,
            quantity: 1
         });
      }
   }

   isPartAlreadyInRepair(partId: string): boolean {
      const r = this.selectedRepair();
      if (!r) return false;
      return r.items.some(i => i.partId === partId);
   }

   submitAddItem() {
      if (this.addItemForm.invalid) return;
      const val = this.addItemForm.value;
      const repair = this.selectedRepair();
      if (!repair) return;

      const newItem: RepairItem = {
         type: this.addItemMode() === 'part' ? 'part' : 'labor',
         partId: this.addItemMode() === 'part' ? val.partId : undefined,
         description: val.description,
         quantity: val.quantity,
         unitPrice: val.unitPrice,
         fulfillmentStatus: this.addItemMode() === 'part' ? 'PENDING' : undefined
      };

      const items = [...repair.items];
      if (this.editingItemIndex() !== null) {
         items[this.editingItemIndex()!] = { ...items[this.editingItemIndex()!], ...newItem };
      } else {
         items.push(newItem);
      }

      this.dataService.updateRepairItems(repair.id, items);
      this.closeAddItemModal();
   }

   // --- DELETE ITEM ---
   askDeleteItem(index: number) {
      this.itemToDeleteIndex.set(index);
      this.showDeleteConfirmModal.set(true);
   }
   closeDeleteConfirmModal() { this.showDeleteConfirmModal.set(false); this.itemToDeleteIndex.set(null); }
   confirmDelete() {
      const index = this.itemToDeleteIndex();
      const repair = this.selectedRepair();
      if (index !== null && repair) {
         const items = repair.items.filter((_, i) => i !== index);
         this.dataService.updateRepairItems(repair.id, items);
         this.toastService.show('Ligne supprimée', 'info');
      }
      this.closeDeleteConfirmModal();
   }

   // --- DOWN PAYMENT ---
   openDownPaymentModal() {
      this.downPaymentForm.reset({ amount: 0, method: 'Carte' });
      this.showDownPaymentModal.set(true);
   }
   closeDownPaymentModal() { this.showDownPaymentModal.set(false); }
   submitDownPayment() {
      if (this.downPaymentForm.invalid) return;
      const repair = this.selectedRepair();
      if (repair) {
         const dp: DownPayment = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            ...this.downPaymentForm.value
         };
         this.dataService.addDownPayment(repair.id, dp);
         this.toastService.show('Acompte ajouté', 'success');
      }
      this.closeDownPaymentModal();
   }

   // --- FINANCIAL HELPERS ---
   calculateSubTotal(r: RepairOrder) {
      return r.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
   }

   calculateDiscountAmount(r: RepairOrder) {
      if (!r.discountValue) return 0;
      if (r.discountType === 'FIXED') return r.discountValue;
      return this.calculateSubTotal(r) * (r.discountValue / 100);
   }

   calculateNetHT(r: RepairOrder) {
      return Math.max(0, this.calculateSubTotal(r) - this.calculateDiscountAmount(r));
   }

   calculateVATAmount(r: RepairOrder) {
      const rate = r.vatRate ?? this.dataService.currentSettings().defaultVatRate;
      return this.calculateNetHT(r) * (rate / 100);
   }

   calculateTotal(r: RepairOrder) {
      return this.calculateNetHT(r) + this.calculateVATAmount(r);
   }

   calculateRemainingDue(r: RepairOrder) {
      const total = this.calculateTotal(r);
      const paid = r.downPayments.reduce((sum, dp) => sum + dp.amount, 0);
      return Math.max(0, total - paid);
   }

   updateFinancials(repairId: string, field: string, value: any) {
      this.dataService.updateRepairFinancials(repairId, { [field]: value });
   }

   // --- LOGISTICS ---
   askLogisticsAction(repairId: string, itemIndex: number, type: 'REQUEST' | 'VALIDATE') {
      this.logisticsAction.set({ repairId, itemIndex, type });
      this.showLogisticsConfirmModal.set(true);
   }

   closeLogisticsConfirmModal() { this.showLogisticsConfirmModal.set(false); this.logisticsAction.set(null); }

   confirmLogisticsAction() {
      const action = this.logisticsAction();
      if (action) {
         if (action.type === 'REQUEST') {
            this.dataService.requestPartTransfer(action.repairId, action.itemIndex);
            this.toastService.show('Demande envoyée au magasin', 'success');
         }
      }
      this.closeLogisticsConfirmModal();
   }

   // --- DOCUMENTS ---
   goToDocuments() {
      this.router.navigate(['/documents']);
   }

   askGenerateQuote(repair: RepairOrder) {
      const client = this.dataService.getClientById(repair.clientId);
      const vehicle = this.dataService.getVehicleById(repair.vehicleId);

      if (!client) return;

      const invoiceItems: InvoiceItem[] = repair.items.map(i => ({
         description: i.description,
         quantity: i.quantity,
         unitPrice: i.unitPrice,
         totalHT: i.quantity * i.unitPrice,
         partId: i.partId
      }));

      // Calculate total discount from repair order
      const discount = this.calculateDiscountAmount(repair);
      if (discount > 0) {
         invoiceItems.push({
            description: `Remise ${repair.discountType === 'PERCENT' ? '(' + repair.discountValue + '%)' : ''}`,
            quantity: 1,
            unitPrice: -discount,
            totalHT: -discount
         });
      }

      const totalHT = this.calculateNetHT(repair);
      const totalVAT = this.calculateVATAmount(repair);
      const totalTTC = this.calculateTotal(repair);

      const quote: Invoice = {
         id: crypto.randomUUID(),
         number: `DEV-${Date.now().toString().slice(-6)}`,
         type: 'DEVIS',
         status: 'BROUILLON',
         date: new Date().toISOString(),
         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
         clientId: repair.clientId,
         clientName: client.type === 'Entreprise' ? client.companyName! : `${client.firstName} ${client.lastName}`,
         vehicleId: repair.vehicleId,
         vehicleDescription: vehicle ? `${vehicle.brand} ${vehicle.model}` : '',
         repairId: repair.id,
         items: invoiceItems,
         totalHT,
         totalVAT,
         totalTTC,
         paidAmount: 0,
         remainingAmount: totalTTC
      };

      this.dataService.addInvoice(quote);
      this.toastService.show('Devis généré', 'success');
      this.createDocumentAndRedirect('Devis', repair, quote);
   }

   createDocumentAndRedirect(type: string, repair: RepairOrder, existingDoc?: Invoice) {
      if (existingDoc) {
         this.router.navigate(['/documents'], { queryParams: { id: existingDoc.id } });
         return;
      }

      // Generate Invoice Logic (Similar to Quote but type FACTURE)
      const client = this.dataService.getClientById(repair.clientId)!;
      const vehicle = this.dataService.getVehicleById(repair.vehicleId);

      const invoiceItems: InvoiceItem[] = repair.items.map(i => ({
         description: i.description,
         quantity: i.quantity,
         unitPrice: i.unitPrice,
         totalHT: i.quantity * i.unitPrice,
         partId: i.partId
      }));

      const discount = this.calculateDiscountAmount(repair);
      if (discount > 0) {
         invoiceItems.push({
            description: `Remise`,
            quantity: 1,
            unitPrice: -discount,
            totalHT: -discount
         });
      }

      const totalHT = this.calculateNetHT(repair);
      const totalVAT = this.calculateVATAmount(repair);
      const totalTTC = this.calculateTotal(repair);
      const paid = repair.downPayments.reduce((s, d) => s + d.amount, 0);

      const invoice: Invoice = {
         id: crypto.randomUUID(),
         number: type === 'Facture' ? `FAC-${Date.now().toString().slice(-6)}` : `DEV-${Date.now().toString().slice(-6)}`,
         type: type === 'Facture' ? 'FACTURE' : 'DEVIS',
         status: type === 'Facture' ? 'ENVOYE' : 'BROUILLON',
         date: new Date().toISOString(),
         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
         clientId: repair.clientId,
         clientName: client.type === 'Entreprise' ? client.companyName! : `${client.firstName} ${client.lastName}`,
         vehicleId: repair.vehicleId,
         vehicleDescription: vehicle ? `${vehicle.brand} ${vehicle.model}` : '',
         repairId: repair.id,
         items: invoiceItems,
         totalHT,
         totalVAT,
         totalTTC,
         paidAmount: paid,
         remainingAmount: totalTTC - paid
      };

      this.dataService.addInvoice(invoice);
      this.toastService.show(`${type} généré(e)`, 'success');
      this.router.navigate(['/documents'], { queryParams: { id: invoice.id } });
   }

   // --- DELETE REPAIR ---
   askDeleteRepair() {
      this.repairToDeleteId.set(this.selectedRepairId());
      this.showDeleteRepairConfirmModal.set(true);
   }

   cancelDeleteRepair() {
      this.showDeleteRepairConfirmModal.set(false);
      this.repairToDeleteId.set(null);
   }

   confirmDeleteRepair() {
      const id = this.repairToDeleteId();
      if (id) {
         this.dataService.deleteRepair(id);
         this.toastService.show('Dossier supprimé', 'info');
         this.selectedRepairId.set(null);
      }
      this.cancelDeleteRepair();
   }
}
