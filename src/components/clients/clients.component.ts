import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Client, Vehicle, RepairOrder } from '../../services/data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import * as XLSX from 'xlsx';

@Component({
   selector: 'app-clients',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule],
   template: `
    <div class="flex flex-col h-full">
      
      <!-- Top Bar -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-end mb-6 shrink-0 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">CRM & Parc Véhicules</h1>
          <p class="text-sm md:text-base text-slate-500 dark:text-slate-400">Gestion de la relation client et de la flotte.</p>
        </div>
        
        <!-- Tabs -->
        <div class="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto">
           <button (click)="activeTab.set('clients')" [class]="activeTab() === 'clients' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-4 py-2 rounded text-sm font-medium transition-all">Clients</button>
           <button (click)="activeTab.set('vehicles')" [class]="activeTab() === 'vehicles' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-4 py-2 rounded text-sm font-medium transition-all">Véhicules</button>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
         <div class="flex flex-col md:flex-row gap-4 w-full md:max-w-2xl">
            <!-- Search Input -->
            <div class="relative w-full">
               <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
               </div>
               <input 
                  type="text" 
                  [value]="searchTerm()"
                  (input)="updateSearch($event)"
                  [placeholder]="activeTab() === 'clients' ? 'Nom, Société, Téléphone...' : 'Plaque, VIN, Modèle...'" 
                  class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
               >
            </div>

            <!-- Filters -->
            @if (activeTab() === 'clients') {
               <select 
                  [value]="clientTypeFilter()"
                  (change)="updateClientTypeFilter($event)"
                  class="w-full md:w-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent min-w-[150px] shadow-sm"
               >
                  <option value="">Tous types</option>
                  <option value="Particulier">Particuliers</option>
                  <option value="Entreprise">Entreprises</option>
               </select>
            }

            @if (activeTab() === 'vehicles') {
               <select 
                  [value]="vehicleOwnerFilter()"
                  (change)="updateVehicleOwnerFilter($event)"
                  class="w-full md:w-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent min-w-[200px] shadow-sm"
               >
                  <option value="">Tous les clients</option>
                  @for (c of dataService.clients(); track c.id) {
                     <option [value]="c.id">{{ c.type === 'Entreprise' ? c.companyName : c.firstName + ' ' + c.lastName }}</option>
                  }
               </select>
            }
         </div>
         
         <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            @if (dataService.canImportExport()) {
               <!-- Import/Export Buttons -->
               <div class="flex">
                  <input #fileInput type="file" accept=".csv, .xlsx, .xls" (change)="handleImport($event)" class="hidden">
                  <button (click)="fileInput.click()" class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-l-lg text-sm font-medium transition-colors flex items-center gap-2" title="Importer Excel/CSV">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                     <span class="hidden sm:inline">Import</span>
                  </button>
                  <button (click)="exportData()" class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-y border-r border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-r-lg text-sm font-medium transition-colors flex items-center gap-2" title="Exporter CSV">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     <span class="hidden sm:inline">Export</span>
                  </button>
               </div>
            }

            <button (click)="activeTab() === 'clients' ? openClientModal() : openVehicleModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-brand-600/20 text-sm md:text-base">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
               </svg>
               {{ activeTab() === 'clients' ? 'Client' : 'Véhicule' }}
            </button>
         </div>
      </div>

      <!-- CONTENT: CLIENTS TABLE -->
      @if (activeTab() === 'clients') {
         <div class="flex-1 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col">
            <div class="overflow-x-auto">
               <table class="w-full text-sm text-left">
                  <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                     <tr>
                        <th class="px-6 py-4">Client / Société</th>
                        <th class="px-6 py-4 hidden md:table-cell">Contact</th>
                        <th class="px-6 py-4 text-center hidden sm:table-cell">Véhicules</th>
                        <th class="px-6 py-4 text-right hidden lg:table-cell">Total Dépensé</th>
                        <th class="px-6 py-4 text-right hidden md:table-cell">Dernière Visite</th>
                        <th class="px-6 py-4 text-center hidden sm:table-cell">Statut</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                     @for (client of filteredClients(); track client.id) {
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" (click)="openClientDetails(client)">
                           <td class="px-6 py-4">
                              <div class="font-bold text-slate-900 dark:text-white text-base">
                                 {{ client.type === 'Entreprise' ? client.companyName : (client.firstName + ' ' + client.lastName) }}
                              </div>
                              <div class="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                 <span [class]="client.type === 'Entreprise' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'" class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                    {{ client.type === 'Entreprise' ? 'PRO' : 'PART' }}
                                 </span>
                                 @if(client.type === 'Entreprise') { <span>{{ client.firstName }} {{ client.lastName }}</span> }
                              </div>
                              <!-- Mobile Only Contact Info -->
                              <div class="md:hidden text-xs text-slate-500 mt-1">
                                 {{ client.phone }}
                              </div>
                           </td>
                           <td class="px-6 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                              <div class="flex flex-col gap-1">
                                 <span class="flex items-center gap-2 text-xs">
                                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {{ client.phone }}
                                 </span>
                                 <span class="flex items-center gap-2 text-xs">
                                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    {{ client.email }}
                                 </span>
                              </div>
                           </td>
                           <td class="px-6 py-4 text-center hidden sm:table-cell">
                              <span class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700">{{ getClientVehicleCount(client.id) }}</span>
                           </td>
                           <td class="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold hidden lg:table-cell">
                              {{ formatMoney(getClientTotalSpent(client.id)) }}
                           </td>
                           <td class="px-6 py-4 text-right text-slate-500 text-xs hidden md:table-cell">
                              {{ getClientLastVisit(client.id) }}
                           </td>
                           <td class="px-6 py-4 text-center hidden sm:table-cell">
                              @let status = getClientStatus(client);
                              <span [class]="status.class" class="px-2 py-1 rounded-full text-[10px] uppercase font-bold border">
                                 {{ status.label }}
                              </span>
                           </td>
                           <td class="px-6 py-4 text-right">
                              <button (click)="$event.stopPropagation(); openClientDetails(client)" class="text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-white text-xs font-medium underline">Détails</button>
                           </td>
                        </tr>
                     }
                     @if (filteredClients().length === 0) {
                        <tr><td colspan="7" class="p-8 text-center text-slate-500 italic">Aucun client trouvé.</td></tr>
                     }
                  </tbody>
               </table>
            </div>
         </div>
      }

      <!-- CONTENT: VEHICLES CARDS -->
      @if (activeTab() === 'vehicles') {
         <div class="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-4 p-1">
            @for (v of filteredVehicles(); track v.id) {
               <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-brand-500/30 transition-all flex flex-col gap-4 group relative shadow-md">
                  
                  <!-- Header: Plate & Status -->
                  <div class="flex justify-between items-start">
                     <div class="font-mono font-bold text-xl text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-950 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 tracking-wider">
                        {{ v.plate }}
                     </div>
                     <div class="flex flex-col items-end">
                        <span class="text-[10px] font-bold uppercase tracking-wider mb-1"
                           [class.text-green-600]="v.fuel === 'Essence'" [class.dark:text-green-400]="v.fuel === 'Essence'"
                           [class.text-yellow-600]="v.fuel === 'Diesel'" [class.dark:text-yellow-500]="v.fuel === 'Diesel'"
                           [class.text-blue-600]="v.fuel === 'Hybride'" [class.dark:text-blue-400]="v.fuel === 'Hybride'"
                           [class.text-purple-600]="v.fuel === 'Electrique'" [class.dark:text-purple-400]="v.fuel === 'Electrique'">
                           {{ v.fuel }}
                        </span>
                        <span class="text-xs text-slate-500 font-mono">{{ v.firstRegistrationDate | date:'yyyy' }}</span>
                     </div>
                  </div>

                  <!-- Main Info -->
                  <div>
                     <h3 class="text-lg font-bold text-slate-900 dark:text-white truncate">{{ v.brand }} {{ v.model }}</h3>
                     <p class="text-sm text-slate-500 dark:text-slate-400 truncate">{{ v.trim }} {{ v.engine }}</p>
                  </div>

                  <!-- Details Grid -->
                  <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mt-2 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                     <!-- Client -->
                     <div class="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                        </svg>
                        <span class="truncate font-medium">{{ getClientName(v.ownerId) }}</span>
                     </div>
                     
                     <!-- Mileage -->
                     <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                        </svg>
                        <span>{{ v.mileage }} km</span>
                     </div>

                     <!-- Gearbox -->
                     <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                        </svg>
                        <span>{{ v.gearbox }}</span>
                     </div>
                     
                     <!-- VIN -->
                     <div class="col-span-2 text-xs font-mono text-slate-500 truncate flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-2 mt-1">
                        <span class="uppercase font-bold text-slate-600 dark:text-slate-500">VIN</span> 
                        <span class="tracking-wide">{{ v.vin }}</span>
                     </div>
                  </div>

                  <!-- Actions -->
                  <div class="mt-auto pt-4 flex gap-3">
                     <button (click)="openTransferModal(v)" class="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        Transfert
                     </button>
                     <button (click)="openVehicleDetails(v)" class="flex-1 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 py-2 rounded-lg text-xs font-medium border border-brand-200 dark:border-brand-900 hover:border-brand-300 dark:hover:border-brand-800 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Détails
                     </button>
                  </div>
               </div>
            }
            @if (filteredVehicles().length === 0) { <div class="col-span-1 md:col-span-2 text-center py-12 text-slate-500 italic">Aucun véhicule trouvé.</div> }
         </div>
      }
    </div>

    <!-- ===== DETAILS MODALS ===== -->
    <!-- (Vehicle Details Modal Content) -->
    @if (showVehicleDetailModal() && selectedVehicleDetail()) {
       @let v = selectedVehicleDetail()!;
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
             <!-- Header -->
             <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex justify-between items-start">
                <div>
                   <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <span class="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{{ v.plate }}</span>
                      {{ v.brand }} {{ v.model }}
                   </h2>
                   <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">{{ v.trim }} - {{ v.engine }} ({{ v.firstRegistrationDate | date:'yyyy' }})</p>
                </div>
                <button (click)="closeVehicleDetails()" class="text-slate-500 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 p-2 rounded-full transition-colors border border-slate-200 dark:border-slate-700">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
             </div>

             <!-- Tabs -->
             <div class="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-4 md:px-6 gap-4 md:gap-6 overflow-x-auto">
                <button (click)="detailTab.set('infos')" [class.text-brand-600]="detailTab() === 'infos'" [class.dark:text-brand-400]="detailTab() === 'infos'" [class.border-brand-500]="detailTab() === 'infos'" class="py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap">Infos</button>
                <button (click)="detailTab.set('history')" [class.text-brand-600]="detailTab() === 'history'" [class.dark:text-brand-400]="detailTab() === 'history'" [class.border-brand-500]="detailTab() === 'history'" class="py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap">Interventions</button>
                <button (click)="detailTab.set('audit')" [class.text-brand-600]="detailTab() === 'audit'" [class.dark:text-brand-400]="detailTab() === 'audit'" [class.border-brand-500]="detailTab() === 'audit'" class="py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap">Audit</button>
             </div>

             <!-- Body -->
             <div class="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-slate-900">
                @if (detailTab() === 'infos') {
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <!-- Admin & Tech -->
                      <div class="space-y-6">
                         <div>
                            <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Administratif</h3>
                            <div class="grid grid-cols-2 gap-y-3 text-sm">
                               <div class="text-slate-500">VIN</div><div class="text-slate-900 dark:text-white font-mono break-all">{{ v.vin }}</div>
                               <div class="text-slate-500">Mise en Circ.</div><div class="text-slate-900 dark:text-white">{{ v.firstRegistrationDate | date:'dd/MM/yyyy' }}</div>
                               <div class="text-slate-500">Puissance Fisc.</div><div class="text-slate-900 dark:text-white">{{ v.fiscalPower }} CV</div>
                               <div class="text-slate-500">Propriétaire</div><div class="text-brand-600 dark:text-brand-400 font-medium">{{ getClientName(v.ownerId) }}</div>
                            </div>
                         </div>
                         
                         <div>
                            <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Technique</h3>
                            <div class="grid grid-cols-2 gap-y-3 text-sm">
                               <div class="text-slate-500">Marque/Modèle</div><div class="text-slate-900 dark:text-white">{{ v.brand }} {{ v.model }}</div>
                               <div class="text-slate-500">Finition</div><div class="text-slate-900 dark:text-white">{{ v.trim || '-' }}</div>
                               <div class="text-slate-500">Moteur</div><div class="text-slate-900 dark:text-white">{{ v.engine || '-' }}</div>
                               <div class="text-slate-500">Boîte</div><div class="text-slate-900 dark:text-white">{{ v.gearbox }}</div>
                               <div class="text-slate-500">Carburant</div><div class="text-slate-900 dark:text-white">{{ v.fuel }}</div>
                            </div>
                         </div>
                      </div>

                      <!-- Service & Tires -->
                      <div class="space-y-6">
                         <div>
                            <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Entretien</h3>
                            <div class="grid grid-cols-2 gap-y-3 text-sm">
                               <div class="text-slate-500">Kilométrage</div><div class="text-slate-900 dark:text-white font-bold">{{ v.mileage }} km</div>
                               <div class="text-slate-500">Dernier CT</div><div class="text-slate-900 dark:text-white">{{ v.lastTechnicalControl | date:'dd/MM/yyyy' }}</div>
                               <div class="text-slate-500">Huile (Visco)</div><div class="text-slate-900 dark:text-white">{{ v.oilType || '-' }}</div>
                            </div>
                         </div>

                         <div>
                            <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Pneumatiques</h3>
                            <div class="grid grid-cols-2 gap-y-3 text-sm">
                               <div class="text-slate-500">Avant</div><div class="text-slate-900 dark:text-white font-mono">{{ v.tireSizeFront || '-' }}</div>
                               <div class="text-slate-500">Arrière</div><div class="text-slate-900 dark:text-white font-mono">{{ v.tireSizeRear || '-' }}</div>
                            </div>
                         </div>
                      </div>
                   </div>
                }
                
                @if (detailTab() === 'history') {
                   <div class="space-y-4">
                      @for (repair of getVehicleRepairs(v.id); track repair.id) {
                         <div class="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-950/50">
                            <div class="flex justify-between items-start mb-2">
                               <div>
                                  <span class="font-bold text-slate-900 dark:text-white">OR #{{ repair.id.substring(0,6) }}</span>
                                  <span class="text-xs text-slate-500 ml-2">{{ repair.entryDate | date:'dd/MM/yyyy' }}</span>
                               </div>
                               <span class="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">{{ repair.status }}</span>
                            </div>
                            <p class="text-sm text-slate-700 dark:text-slate-300">{{ repair.description }}</p>
                            <div class="mt-2 text-xs text-slate-500">Total: {{ formatMoney(calculateTotal(repair)) }}</div>
                         </div>
                      }
                      @if (getVehicleRepairs(v.id).length === 0) {
                         <div class="text-center text-slate-500 italic py-8">Aucun historique d'intervention.</div>
                      }
                   </div>
                }

                @if (detailTab() === 'audit') {
                   <div class="space-y-4">
                      @for (log of v.history; track $index) {
                         <div class="flex gap-4 text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                            <div class="w-32 shrink-0 text-slate-500 text-xs">{{ log.date | date:'dd/MM/yyyy HH:mm' }}</div>
                            <div class="flex-1">
                               <div class="font-medium text-slate-900 dark:text-white">{{ log.action }}</div>
                               <div class="text-xs text-slate-500">Par: {{ log.user }}</div>
                            </div>
                         </div>
                      }
                   </div>
                }
             </div>

             <!-- Footer Actions -->
             <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                <button (click)="closeVehicleDetails()" class="px-4 py-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Fermer</button>
                <button (click)="openVehicleModal(v); closeVehicleDetails()" class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg">
                   Modifier Infos
                </button>
             </div>
          </div>
       </div>
    }

    <!-- CLIENT DETAILS MODAL -->
    @if (showClientDetailModal() && selectedClientDetail()) {
       @let c = selectedClientDetail()!;
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
             
             <!-- Header -->
             <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex justify-between items-start">
                <div>
                   <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      {{ c.type === 'Entreprise' ? c.companyName : c.firstName + ' ' + c.lastName }}
                      <span class="text-xs px-2 py-0.5 rounded-full border uppercase tracking-wide" [class]="c.type === 'Entreprise' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'">{{ c.type }}</span>
                   </h2>
                   @if(c.type === 'Entreprise') { <p class="text-slate-500 text-sm mt-1">Contact: {{ c.firstName }} {{ c.lastName }}</p> }
                </div>
                <button (click)="closeClientDetails()" class="text-slate-500 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 p-2 rounded-full transition-colors border border-slate-200 dark:border-slate-700">✕</button>
             </div>

             <!-- Body -->
             <div class="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                   <!-- Info -->
                   <div class="space-y-4">
                      <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1">Coordonnées</h3>
                      <div class="text-sm space-y-2">
                         <div class="flex justify-between"><span class="text-slate-500">Email</span> <span class="text-slate-900 dark:text-white">{{ c.email }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Téléphone</span> <span class="text-slate-900 dark:text-white">{{ c.phone }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Mobile</span> <span class="text-slate-900 dark:text-white">{{ c.mobile || '-' }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Adresse</span> <span class="text-slate-900 dark:text-white text-right">{{ c.address.street }}<br>{{ c.address.zip }} {{ c.address.city }}</span></div>
                      </div>
                   </div>
                   
                   <!-- Financial -->
                   <div class="space-y-4">
                      <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1">Données Financières</h3>
                      <div class="text-sm space-y-2">
                         <div class="flex justify-between"><span class="text-slate-500">Mode Règlement</span> <span class="text-slate-900 dark:text-white">{{ c.financial.paymentMethod }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Conditions</span> <span class="text-slate-900 dark:text-white">{{ c.financial.paymentTerms }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Solde Compte</span> <span class="font-bold" [class.text-red-500]="c.financial.balance > 0" [class.text-emerald-500]="c.financial.balance <= 0">{{ formatMoney(c.financial.balance) }}</span></div>
                      </div>
                   </div>
                </div>

                <!-- Vehicles List -->
                <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1 mb-4">Véhicules Associés ({{ getClientVehicleCount(c.id) }})</h3>
                 <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    @for (veh of getClientVehicles(c.id); track veh.id) {
                       <div (click)="closeClientDetails(); openVehicleDetails(veh)" class="p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-brand-500 cursor-pointer bg-slate-50 dark:bg-slate-950/30">
                          <div class="font-bold text-slate-900 dark:text-white">{{ veh.brand }} {{ veh.model }}</div>
                          <div class="text-xs text-slate-500 flex justify-between mt-1">
                             <span class="font-mono bg-white dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700">{{ veh.plate }}</span>
                             <span>{{ veh.mileage }} km</span>
                          </div>
                       </div>
                    }
                </div>
             </div>

             <!-- Footer -->
             <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                <button (click)="closeClientDetails()" class="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">Fermer</button>
                <button (click)="openClientModal(c); closeClientDetails()" class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg">Modifier Client</button>
             </div>
          </div>
       </div>
    }

    <!-- CLIENT FORM MODAL -->
    @if (showClientModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                <span>{{ editingClientId() ? 'Modifier Client' : 'Nouveau Client' }}</span>
                <button (click)="closeClientModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
             </div>
             
             <form [formGroup]="clientForm" (ngSubmit)="submitClient()" class="p-6 space-y-6">
                <!-- Type Selection -->
                <div class="flex gap-6">
                   <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" formControlName="type" value="Particulier" class="w-4 h-4 text-brand-600 focus:ring-brand-500">
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Particulier</span>
                   </label>
                   <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" formControlName="type" value="Entreprise" class="w-4 h-4 text-brand-600 focus:ring-brand-500">
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Entreprise</span>
                   </label>
                </div>

                <!-- Identity -->
                <div class="grid grid-cols-2 gap-4">
                   @if (clientForm.get('type')?.value === 'Entreprise') {
                      <div class="col-span-2">
                         <label class="block text-xs font-medium text-slate-500 mb-1">Nom Société *</label>
                         <input formControlName="companyName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">RCCM</label>
                         <input formControlName="rccm" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">N° TVA</label>
                         <input formControlName="vatNumber" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div class="col-span-2 text-xs font-bold text-slate-400 uppercase mt-2">Contact Principal</div>
                   }
                   
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Prénom *</label>
                      <input formControlName="firstName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Nom *</label>
                      <input formControlName="lastName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                </div>

                <!-- Contact -->
                <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Email *</label>
                      <input type="email" formControlName="email" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Téléphone *</label>
                      <input type="tel" formControlName="phone" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                </div>

                <!-- Address -->
                <div formGroupName="address" class="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                   <h4 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase">Adresse</h4>
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Rue / Voie</label>
                      <input formControlName="street" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div class="grid grid-cols-2 gap-4">
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Ville</label>
                         <input formControlName="city" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Code Postal / BP</label>
                         <input formControlName="zip" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                   </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                   <button type="button" (click)="closeClientModal()" class="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">Annuler</button>
                   <button type="submit" [disabled]="clientForm.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg disabled:opacity-50">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- VEHICLE FORM MODAL -->
    @if (showVehicleModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                <span>{{ editingVehicleId() ? 'Modifier Véhicule' : 'Nouveau Véhicule' }}</span>
                <button (click)="closeVehicleModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
             </div>
             
             <form [formGroup]="vehicleForm" (ngSubmit)="submitVehicle()" class="p-6 space-y-6">
                <!-- Identification -->
                <div class="space-y-4">
                   <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1">Identification</h3>
                   
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Propriétaire *</label>
                      <select formControlName="ownerId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         <option value="">-- Sélectionner un client --</option>
                         @for (c of dataService.clients(); track c.id) {
                            <option [value]="c.id">{{ c.type === 'Entreprise' ? c.companyName : c.firstName + ' ' + c.lastName }}</option>
                         }
                      </select>
                   </div>

                   <div class="grid grid-cols-2 gap-4">
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Immatriculation *</label>
                         <input formControlName="plate" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white font-mono uppercase">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">N° Série (VIN) *</label>
                         <input formControlName="vin" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white font-mono uppercase">
                      </div>
                   </div>
                </div>

                <!-- Specs -->
                <div class="space-y-4">
                   <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1">Caractéristiques</h3>
                   <div class="grid grid-cols-2 gap-4">
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Marque *</label>
                         <input formControlName="brand" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Modèle *</label>
                         <input formControlName="model" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Finition</label>
                         <input formControlName="trim" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Motorisation</label>
                         <input formControlName="engine" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Carburant</label>
                         <select formControlName="fuel" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                            <option value="Essence">Essence</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Hybride">Hybride</option>
                            <option value="Electrique">Electrique</option>
                         </select>
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Boîte</label>
                         <select formControlName="gearbox" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                            <option value="Manuelle">Manuelle</option>
                            <option value="Automatique">Automatique</option>
                         </select>
                      </div>
                   </div>
                </div>

                <!-- State -->
                <div class="space-y-4">
                   <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1">État & Entretien</h3>
                   <div class="grid grid-cols-2 gap-4">
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Kilométrage *</label>
                         <input type="number" formControlName="mileage" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Date Mise Circ.</label>
                         <input type="date" formControlName="firstRegistrationDate" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Pneus AV</label>
                         <input formControlName="tireSizeFront" placeholder="ex: 205/55 R16" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                      <div>
                         <label class="block text-xs font-medium text-slate-500 mb-1">Pneus AR</label>
                         <input formControlName="tireSizeRear" placeholder="ex: 205/55 R16" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                   </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                   <button type="button" (click)="closeVehicleModal()" class="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">Annuler</button>
                   <button type="submit" [disabled]="vehicleForm.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg disabled:opacity-50">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- TRANSFER MODAL -->
    @if (showTransferModal() && transferVehicleData()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
             <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Transférer Véhicule</h3>
             <p class="text-sm text-slate-500 mb-4">
                Sélectionnez le nouveau propriétaire pour le véhicule 
                <span class="font-bold text-slate-900 dark:text-white">{{ transferVehicleData()?.plate }}</span>.
             </p>
             
             <div class="mb-6">
                <label class="block text-xs font-medium text-slate-500 mb-1">Nouveau Propriétaire</label>
                <select #newOwnerSelect class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   <option value="">-- Choisir --</option>
                   @for (c of dataService.clients(); track c.id) {
                      @if (c.id !== transferVehicleData()?.ownerId) {
                         <option [value]="c.id">{{ c.type === 'Entreprise' ? c.companyName : c.firstName + ' ' + c.lastName }}</option>
                      }
                   }
                </select>
             </div>

             <div class="flex justify-end gap-3">
                <button (click)="closeTransferModal()" class="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">Annuler</button>
                <button (click)="confirmTransfer(newOwnerSelect.value)" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded font-medium">Valider Transfert</button>
             </div>
          </div>
       </div>
    }
  `
})
export class ClientsComponent {
   dataService = inject(DataService);
   toastService = inject(ToastService);
   fb: FormBuilder = inject(FormBuilder);

   // UI State
   activeTab = signal<'clients' | 'vehicles'>('clients');
   searchTerm = signal('');

   // Filters
   clientTypeFilter = signal<string>(''); // 'Particulier' | 'Entreprise' | ''
   vehicleOwnerFilter = signal<string>(''); // clientId | ''

   // Create/Edit Modals
   showClientModal = signal(false);
   editingClientId = signal<string | null>(null);

   showVehicleModal = signal(false);
   editingVehicleId = signal<string | null>(null);

   showTransferModal = signal(false);
   transferVehicleData = signal<Vehicle | null>(null);

   // Detail View Modals
   showClientDetailModal = signal(false);
   selectedClientDetail = signal<Client | null>(null);

   showVehicleDetailModal = signal(false);
   selectedVehicleDetail = signal<Vehicle | null>(null);

   detailTab = signal<'infos' | 'history' | 'audit' | 'vehicles'>('infos');

   // Forms
   clientForm: FormGroup;
   vehicleForm: FormGroup;

   constructor() {
      this.clientForm = this.fb.group({
         type: ['Particulier', Validators.required],
         firstName: ['', Validators.required],
         lastName: ['', Validators.required],
         companyName: [''],
         rccm: [''],
         vatNumber: [''],
         email: ['', [Validators.required, Validators.email]],
         phone: ['', Validators.required],
         mobile: [''],
         address: this.fb.group({
            street: [''],
            city: [''],
            zip: ['']
         }),
         financial: this.fb.group({
            paymentMethod: ['CB'],
            paymentTerms: ['Comptant'],
            discountPercent: [0],
            balance: [0]
         }),
         notes: ['']
      });

      this.vehicleForm = this.fb.group({
         ownerId: ['', Validators.required],
         plate: ['', Validators.required],
         vin: ['', Validators.required],
         firstRegistrationDate: [''],
         fiscalPower: [0],
         brand: ['', Validators.required],
         model: ['', Validators.required],
         trim: [''],
         engine: [''],
         fuel: ['Essence'],
         gearbox: ['Manuelle'],
         mileage: [0, Validators.required],
         tireSizeFront: [''],
         tireSizeRear: [''],
         oilType: [''],
         lastTechnicalControl: ['']
      });
   }

   // Computed Lists
   filteredClients = computed(() => {
      const term = this.searchTerm().toLowerCase();
      const type = this.clientTypeFilter();

      return this.dataService.clients().filter(c => {
         const matchesTerm = c.lastName.toLowerCase().includes(term) ||
            c.firstName.toLowerCase().includes(term) ||
            (c.companyName && c.companyName.toLowerCase().includes(term)) ||
            c.phone.includes(term);

         const matchesType = !type || c.type === type;

         return matchesTerm && matchesType;
      });
   });

   filteredVehicles = computed(() => {
      const term = this.searchTerm().toLowerCase();
      const ownerId = this.vehicleOwnerFilter();

      return this.dataService.vehicles().filter(v => {
         const matchesTerm = v.plate.toLowerCase().includes(term) ||
            v.vin.toLowerCase().includes(term) ||
            v.model.toLowerCase().includes(term);

         const matchesOwner = !ownerId || v.ownerId === ownerId;

         return matchesTerm && matchesOwner;
      });
   });

   updateSearch(e: Event) { this.searchTerm.set((e.target as HTMLInputElement).value); }
   updateClientTypeFilter(e: Event) { this.clientTypeFilter.set((e.target as HTMLSelectElement).value); }
   updateVehicleOwnerFilter(e: Event) { this.vehicleOwnerFilter.set((e.target as HTMLSelectElement).value); }

   // Helpers
   getVehicleById(vid: string) { return this.dataService.getVehicleById(vid); }
   getVehiclePlate(vid: string) { return this.dataService.getVehicleById(vid)?.plate ?? '???'; }
   getClientName(cid: string) {
      const c = this.dataService.getClientById(cid);
      return c ? (c.type === 'Entreprise' ? c.companyName : `${c.firstName} ${c.lastName}`) : 'Inconnu';
   }

   // Dynamic vehicle resolution — avoids relying on client.vehicleIds which can desync from DB
   getClientVehicles(clientId: string): Vehicle[] {
      return this.dataService.vehicles().filter(v => v.ownerId === clientId);
   }
   getClientVehicleCount(clientId: string): number {
      return this.dataService.vehicles().filter(v => v.ownerId === clientId).length;
   }

   formatMoney(val: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(val); }

   calculateTotal(repair: RepairOrder) {
      return repair.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
   }

   // Client List Helpers
   getClientTotalSpent(clientId: string): number {
      const clientVehicles = this.dataService.vehicles().filter(v => v.ownerId === clientId).map(v => v.id);
      const repairs = this.dataService.repairs().filter(r => clientVehicles.includes(r.vehicleId) && r.status === 'Clôturé');
      return repairs.reduce((acc, r) => acc + this.calculateTotal(r), 0);
   }

   getClientLastVisit(clientId: string): string {
      const clientVehicles = this.dataService.vehicles().filter(v => v.ownerId === clientId).map(v => v.id);
      const repairs = this.dataService.repairs().filter(r => clientVehicles.includes(r.vehicleId));

      if (repairs.length === 0) return 'Jamais';

      // Sort desc
      const lastRepair = repairs.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())[0];
      return new Date(lastRepair.entryDate).toLocaleDateString('fr-FR');
   }

   getClientStatus(client: Client): { label: string, class: string } {
      const lastVisit = this.getClientLastVisit(client.id);
      if (lastVisit === 'Jamais') return { label: 'Prospect', class: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
      return { label: 'Actif', class: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
   }

   // History Helpers
   getClientRepairs(clientId: string): RepairOrder[] {
      const clientVehicles = this.dataService.vehicles().filter(v => v.ownerId === clientId).map(v => v.id);
      return this.dataService.repairs()
         .filter(r => clientVehicles.includes(r.vehicleId))
         .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
   }

   getVehicleRepairs(vehicleId: string): RepairOrder[] {
      return this.dataService.repairs()
         .filter(r => r.vehicleId === vehicleId)
         .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
   }

   // --- DETAILS ACTIONS ---

   openClientDetails(client: Client) {
      this.selectedClientDetail.set(client);
      this.detailTab.set('infos');
      this.showClientDetailModal.set(true);
   }
   closeClientDetails() { this.showClientDetailModal.set(false); }

   openVehicleDetails(vehicle: Vehicle) {
      this.selectedVehicleDetail.set(vehicle);
      this.detailTab.set('infos');
      this.showVehicleDetailModal.set(true);
   }
   closeVehicleDetails() { this.showVehicleDetailModal.set(false); }


   // --- CLIENT FORM ACTIONS ---

   openClientModal(client?: Client) {
      if (client) {
         this.editingClientId.set(client.id);
         this.clientForm.patchValue(client);
      } else {
         this.editingClientId.set(null);
         this.clientForm.reset({
            type: 'Particulier',
            firstName: '',
            lastName: '',
            companyName: '',
            email: '',
            phone: '',
            address: { street: '', city: '', zip: '' },
            financial: { paymentMethod: 'CB', paymentTerms: 'Comptant', discountPercent: 0, balance: 0 }
         });
      }
      this.showClientModal.set(true);
   }

   closeClientModal() { this.showClientModal.set(false); }

   submitClient() {
      if (this.clientForm.invalid) {
         this.toastService.show('Formulaire invalide. Vérifiez les champs obligatoires.', 'error');
         this.clientForm.markAllAsTouched();
         return;
      }

      // Logic for Company Name if Enterprise
      const formVal = this.clientForm.value;
      if (formVal.type === 'Particulier') {
         formVal.companyName = '';
         formVal.rccm = '';
         formVal.vatNumber = '';
      }

      if (this.editingClientId()) {
         const existing = this.dataService.getClientById(this.editingClientId()!);
         if (existing) {
            const updatedClient: Client = { ...existing, ...formVal };
            this.dataService.updateClient(updatedClient);
            // Update details modal if open
            if (this.selectedClientDetail()?.id === updatedClient.id) {
               this.selectedClientDetail.set(updatedClient);
            }
         }
      } else {
         const newClient: Client = {
            id: crypto.randomUUID(),
            ...formVal,
            vehicleIds: [],
            history: []
         };
         this.dataService.addClient(newClient);
      }
      this.closeClientModal();
   }

   // --- VEHICLE FORM ACTIONS ---

   openVehicleModal(vehicle?: Vehicle) {
      if (vehicle) {
         this.editingVehicleId.set(vehicle.id);
         this.vehicleForm.patchValue(vehicle);
         this.vehicleForm.get('ownerId')?.disable(); // Can't change owner here, use Transfer
      } else {
         this.editingVehicleId.set(null);
         this.vehicleForm.reset({
            ownerId: '', // Default empty to force selection
            fuel: 'Essence',
            gearbox: 'Manuelle',
            fiscalPower: 0,
            mileage: 0
         });
         this.vehicleForm.get('ownerId')?.enable();
      }
      this.showVehicleModal.set(true);
   }

   closeVehicleModal() { this.showVehicleModal.set(false); }

   submitVehicle() {
      if (this.vehicleForm.invalid) {
         this.toastService.show('Formulaire invalide. Vérifiez le propriétaire, la plaque et le modèle.', 'error');
         this.vehicleForm.markAllAsTouched();
         return;
      }

      const formVal = this.vehicleForm.getRawValue();

      if (this.editingVehicleId()) {
         const existing = this.dataService.getVehicleById(this.editingVehicleId()!);
         if (existing) {
            const updatedVehicle: Vehicle = { ...existing, ...formVal };
            this.dataService.updateVehicle(updatedVehicle);
            // Update details modal if open
            if (this.selectedVehicleDetail()?.id === updatedVehicle.id) {
               this.selectedVehicleDetail.set(updatedVehicle);
            }
         }
      } else {
         const newVehicle: Vehicle = {
            id: crypto.randomUUID(),
            ...formVal,
            history: []
         };
         this.dataService.addVehicle(newVehicle);
      }
      this.closeVehicleModal();
   }

   // --- TRANSFER ACTIONS ---

   openTransferModal(vehicle: Vehicle) {
      this.transferVehicleData.set(vehicle);
      this.showTransferModal.set(true);
   }

   closeTransferModal() {
      this.showTransferModal.set(false);
      this.transferVehicleData.set(null);
   }

   confirmTransfer(newOwnerId: string) {
      if (!newOwnerId || !this.transferVehicleData()) return;

      this.dataService.transferVehicleOwnership(this.transferVehicleData()!.id, newOwnerId);
      this.toastService.show('Transfert de propriété effectué', 'success');
      this.closeTransferModal();
   }

   // --- IMPORT / EXPORT ACTIONS ---

   exportData() {
      if (this.activeTab() === 'clients') {
         this.exportClients();
      } else {
         this.exportVehicles();
      }
   }

   exportClients() {
      const data = this.dataService.clients().map(c => ({
         Type: c.type,
         Nom: c.lastName,
         Prenom: c.firstName,
         Societe: c.companyName || '',
         Email: c.email,
         Telephone: c.phone,
         Mobile: c.mobile || '',
         Rue: c.address.street,
         Ville: c.address.city,
         CP: c.address.zip,
         Solde: c.financial.balance
      }));
      this.generateExcel(data, 'Clients');
   }

   exportVehicles() {
      const data = this.dataService.vehicles().map(v => {
         const client = this.dataService.getClientById(v.ownerId);
         return {
            Immatriculation: v.plate,
            VIN: v.vin,
            Marque: v.brand,
            Modele: v.model,
            Finition: v.trim || '',
            Moteur: v.engine || '',
            Energie: v.fuel,
            Kilometrage: v.mileage,
            Proprietaire: client ? (client.type === 'Entreprise' ? client.companyName : `${client.firstName} ${client.lastName}`) : 'Inconnu'
         };
      });
      this.generateExcel(data, 'Vehicules');
   }

   generateExcel(data: any[], fileName: string) {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, fileName);
      XLSX.writeFile(wb, `${fileName}_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
   }

   handleImport(event: any) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e: any) => {
         const bstr = e.target.result;
         const wb = XLSX.read(bstr, { type: 'binary' });
         const wsname = wb.SheetNames[0];
         const ws = wb.Sheets[wsname];
         const data = XLSX.utils.sheet_to_json(ws);

         if (this.activeTab() === 'clients') {
            this.importClients(data);
         } else {
            this.importVehicles(data);
         }

         // Reset input
         (event.target as HTMLInputElement).value = '';
      };
      reader.readAsBinaryString(file);
   }

   importClients(data: any[]) {
      let count = 0;
      data.forEach((row: any) => {
         const newClient: Client = {
            id: crypto.randomUUID(),
            type: row['Type'] === 'Entreprise' ? 'Entreprise' : 'Particulier',
            firstName: row['Prenom'] || '',
            lastName: row['Nom'] || row['Societe'] || 'Inconnu',
            companyName: row['Societe'],
            email: row['Email'] || `import-${Date.now()}-${Math.floor(Math.random() * 1000)}@autofix.local`,
            phone: row['Telephone'] || '',
            mobile: row['Mobile'],
            address: {
               street: row['Rue'] || '',
               city: row['Ville'] || '',
               zip: row['CP'] || ''
            },
            financial: {
               paymentMethod: 'CB',
               paymentTerms: 'Comptant',
               discountPercent: 0,
               balance: Number(row['Solde']) || 0
            },
            vehicleIds: [],
            history: [{ date: new Date().toISOString(), action: 'Import Excel', user: this.dataService.currentUser().firstName }]
         };
         this.dataService.addClient(newClient);
         count++;
      });
      this.toastService.show(`${count} clients importés`, 'success');
   }

   importVehicles(data: any[]) {
      let count = 0;
      let skipped = 0;

      data.forEach((row: any) => {
         const ownerName = row['Proprietaire'];
         let ownerId = '';

         if (ownerName) {
            const client = this.dataService.clients().find(c =>
               (c.type === 'Entreprise' && c.companyName?.toLowerCase() === ownerName.toLowerCase()) ||
               (`${c.firstName} ${c.lastName}`.toLowerCase() === ownerName.toLowerCase())
            );
            if (client) ownerId = client.id;
         }

         if (!ownerId) {
            skipped++;
            return;
         }

         const newVehicle: Vehicle = {
            id: crypto.randomUUID(),
            ownerId: ownerId,
            plate: row['Immatriculation'] || 'INCONNU',
            vin: row['VIN'] || '',
            brand: row['Marque'] || '',
            model: row['Modele'] || '',
            trim: row['Finition'],
            engine: row['Moteur'],
            fuel: row['Energie'] || 'Essence',
            gearbox: 'Manuelle',
            mileage: Number(row['Kilometrage']) || 0,
            firstRegistrationDate: new Date().toISOString(),
            fiscalPower: 0,
            history: [{ date: new Date().toISOString(), action: 'Import Excel', user: this.dataService.currentUser().firstName }]
         };

         this.dataService.addVehicle(newVehicle);
         count++;
      });

      if (count > 0) this.toastService.show(`${count} véhicules importés`, 'success');
      if (skipped > 0) this.toastService.show(`${skipped} ignorés (Propriétaire introuvable)`, 'error');
   }
}