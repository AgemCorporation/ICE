
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Invoice } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { jsPDF } from 'jspdf';
import { ActivatedRoute } from '@angular/router';

@Component({
   selector: 'app-documents',
   standalone: true,
   imports: [CommonModule, FormsModule],
   template: `
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Historique Documents</h1>
          <p class="text-slate-500 dark:text-slate-400">Archives complètes des devis, factures et avoirs.</p>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-end">
         
         <!-- Search -->
         <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Recherche</label>
            <div class="relative">
               <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </span>
               <input 
                  type="text" 
                  [ngModel]="searchTerm()"
                  (ngModelChange)="searchTerm.set($event)"
                  placeholder="N° Doc, Client, Véhicule..." 
                  class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
               >
            </div>
         </div>

         <!-- Type Filter -->
         <div class="w-40">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
            <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
               <option value="ALL">Tous</option>
               <option value="DEVIS">Devis</option>
               <option value="FACTURE">Factures</option>
               <option value="AVOIR">Avoirs</option>
            </select>
         </div>

         <!-- Period Filter -->
         <div class="w-40">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Période</label>
            <select [ngModel]="periodFilter()" (ngModelChange)="periodFilter.set($event)" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
               <option value="ALL">Tout l'historique</option>
               <option value="MONTH">Ce mois</option>
               <option value="YEAR">Cette année</option>
            </select>
         </div>
      </div>

      <!-- Main Table -->
      <div class="flex-1 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col">
         <div class="flex-1 overflow-y-auto">
            <table class="w-full text-sm text-left">
               <thead class="bg-slate-100 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                  <tr>
                     <th class="px-6 py-4">Date</th>
                     <th class="px-6 py-4">Numéro</th>
                     <th class="px-6 py-4">Type</th>
                     <th class="px-6 py-4">Client / Véhicule</th>
                     <th class="px-6 py-4 text-right">Montant TTC</th>
                     <th class="px-6 py-4 text-center">Statut</th>
                     <th class="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (doc of filteredDocuments(); track doc.id) {
                     <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td class="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                           {{ doc.date | date:'dd/MM/yyyy' }}
                        </td>
                        <td class="px-6 py-4">
                           <span class="font-mono font-bold text-slate-900 dark:text-white">{{ doc.number }}</span>
                        </td>
                        <td class="px-6 py-4">
                           @if(doc.type === 'DEVIS') {
                              <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                 DEVIS
                              </span>
                           } @else if (doc.type === 'FACTURE') {
                              <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                 FACTURE
                              </span>
                           } @else if (doc.type === 'AVOIR') {
                              <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                 AVOIR
                              </span>
                           } @else {
                              <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                 {{ doc.type }}
                              </span>
                           }
                        </td>
                        <td class="px-6 py-4">
                           <div class="font-medium text-slate-900 dark:text-white">{{ doc.clientName }}</div>
                           <div class="text-xs text-slate-500 truncate max-w-[200px]">{{ doc.vehicleDescription || '-' }}</div>
                        </td>
                        <td class="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                           {{ formatMoney(doc.totalTTC) }}
                        </td>
                        <td class="px-6 py-4 text-center">
                           @if (dataService.canInvoice()) {
                              <select 
                                 [value]="doc.status" 
                                 (change)="updateDocStatus($event, doc)"
                                 [class]="getStatusClass(doc.status)"
                                 class="appearance-none text-[10px] uppercase px-2 py-1 rounded-full font-bold border cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500"
                                 style="text-align-last: center;"
                              >
                                 <option value="BROUILLON">Brouillon</option>
                                 <option value="ENVOYE">Envoyé</option>
                                 <option value="VALIDE">Validé</option>
                                 <option value="PAYE">Payé</option>
                                 <option value="PARTIEL">Partiel</option>
                                 <option value="ANNULE">Annulé</option>
                                 <option value="REFUSE">Refusé</option>
                              </select>
                           } @else {
                              <span [class]="getStatusClass(doc.status)" class="text-[10px] uppercase px-2 py-1 rounded-full font-bold border block text-center">
                                 {{ doc.status }}
                              </span>
                           }
                        </td>
                        <td class="px-6 py-4 text-right">
                           <div class="flex justify-end gap-2">
                              <!-- WhatsApp -->
                              <button (click)="sendDocument(doc, 'WHATSAPP')" class="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors" title="WhatsApp + PDF">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                                 </svg>
                              </button>
                              
                              <!-- Email -->
                              <button (click)="sendDocument(doc, 'EMAIL')" class="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Envoyer par Email">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                 </svg>
                              </button>

                              <!-- Notify Ready (Facture only) -->
                              @if (doc.type === 'FACTURE') {
                                 <button (click)="notifyReady(doc)" class="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors" title="Notifier véhicule prêt">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                 </button>
                              }

                              <div class="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                              <button (click)="openPreview(doc)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Aperçu">
                                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                              <button (click)="generatePDF(doc)" class="text-slate-400 hover:text-brand-600 transition-colors" title="Télécharger PDF">
                                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </button>
                           </div>
                        </td>
                     </tr>
                  }
                  @if (filteredDocuments().length === 0) {
                     <tr><td colspan="7" class="p-12 text-center text-slate-500 italic">Aucun document trouvé correspondant à vos critères.</td></tr>
                  }
               </tbody>
            </table>
         </div>
      </div>
    </div>

    <!-- PREVIEW MODAL -->
    @if (showPreviewModal() && selectedDoc()) {
       @let doc = selectedDoc()!;
       @let client = dataService.getClientById(doc.clientId);
       @let vehicle = getVehicle(doc.vehicleId || '');
       
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
             
             <!-- Header -->
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 shrink-0">
                <div class="flex items-center gap-3">
                   <span class="font-bold text-slate-900 dark:text-white text-lg">{{ doc.type }} {{ doc.number }}</span>
                   <span [class]="getStatusClass(doc.status)" class="text-[10px] uppercase px-2 py-1 rounded-full font-bold border">
                      {{ doc.status }}
                   </span>
                </div>
                <div class="flex gap-2">
                   <button (click)="generatePDF(doc)" class="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Télécharger PDF
                   </button>
                   <button (click)="closePreview()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">✕</button>
                </div>
             </div>

             <!-- Document Body Preview (Strict A4 Layout) -->
             <div class="flex-1 overflow-y-auto p-8 bg-slate-200 dark:bg-slate-950 flex justify-center">
                
                <!-- A4 PAGE CONTAINER -->
                <div class="bg-white text-black shadow-2xl shrink-0 flex flex-col relative box-border" 
                     style="width: 210mm; min-height: 297mm; padding: 20mm;">
                   
                   <!-- LOGO / HEADER SECTION -->
                   <div class="flex justify-between items-start mb-8 h-[40mm]">
                      <div class="w-1/2">
                         @if (dataService.currentSettings().logoUrl) {
                            <img [src]="dataService.currentSettings().logoUrl" class="h-16 object-contain mb-4" alt="Logo">
                         }
                         <h2 class="text-xl font-bold uppercase text-brand-600 leading-none mb-1">{{ dataService.currentSettings().name }}</h2>
                         <div class="text-xs text-gray-600 leading-snug">
                            {{ dataService.currentSettings().address }}<br>
                            {{ dataService.currentSettings().zip }} {{ dataService.currentSettings().city }}<br>
                            {{ dataService.currentSettings().phone }}
                         </div>
                      </div>
                      <div class="text-right w-1/2">
                         <h1 class="text-3xl font-bold text-gray-800 uppercase tracking-widest">{{ doc.type }}</h1>
                         <div class="text-gray-500 font-mono text-lg mt-1">#{{ doc.number }}</div>
                         <div class="text-sm font-bold mt-4">Date : {{ doc.date | date:'dd/MM/yyyy' }}</div>
                         @if (doc.type === 'DEVIS') {
                            <div class="text-xs text-gray-500">Validité : {{ doc.dueDate | date:'dd/MM/yyyy' }}</div>
                         } @else {
                            <div class="text-xs text-gray-500">Échéance : {{ doc.dueDate | date:'dd/MM/yyyy' }}</div>
                         }
                      </div>
                   </div>

                   <!-- ADDRESSES SECTION -->
                   <div class="flex gap-8 mb-8 border-t border-b border-gray-100 py-6">
                      <div class="w-1/2">
                         <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">FACTURÉ À</div>
                         <div class="font-bold text-base text-gray-900">{{ doc.clientName }}</div>
                         @if(client) {
                            <div class="text-xs text-gray-600 mt-1">
                               {{ client.address.street }}<br>
                               {{ client.address.zip }} {{ client.address.city }}
                            </div>
                            @if(client.vatNumber) { <div class="text-[10px] text-gray-500 mt-1">TVA: {{ client.vatNumber }}</div> }
                         }
                      </div>
                      <div class="w-1/2 pl-6 border-l border-gray-100">
                         <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">VÉHICULE CONCERNÉ</div>
                         <div class="font-bold text-base text-gray-900">{{ doc.vehicleDescription || 'Non spécifié' }}</div>
                         @if(vehicle) {
                            <div class="text-xs text-gray-600 mt-1 space-y-0.5">
                               <div>VIN: <span class="font-mono">{{ vehicle.vin }}</span></div>
                               <div>Immat: <span class="font-mono bg-gray-100 px-1 rounded">{{ vehicle.plate }}</span></div>
                               <div>KM: {{ vehicle.mileage }} km</div>
                            </div>
                         }
                      </div>
                   </div>

                   <!-- TABLE SECTION -->
                   <div class="mb-8 flex-1">
                      <table class="w-full text-sm border-collapse">
                         <thead>
                            <tr class="border-b-2 border-brand-500 bg-gray-50">
                               <th class="text-left py-2 pl-2 font-bold text-xs text-gray-600 uppercase">Description</th>
                               <th class="text-right py-2 w-16 font-bold text-xs text-gray-600 uppercase">Qté</th>
                               <th class="text-right py-2 w-28 font-bold text-xs text-gray-600 uppercase">P.U. HT</th>
                               <th class="text-right py-2 w-28 pr-2 font-bold text-xs text-gray-600 uppercase">Total HT</th>
                            </tr>
                         </thead>
                         <tbody>
                            @for (item of doc.items; track $index) {
                               <tr class="border-b border-gray-100">
                                  <td class="py-3 pl-2 text-gray-800">{{ item.description }}</td>
                                  <td class="text-right py-3 text-gray-600">{{ item.quantity }}</td>
                                  <td class="text-right py-3 text-gray-600">{{ formatMoney(item.unitPrice) }}</td>
                                  <td class="text-right py-3 font-bold text-gray-900 pr-2">{{ formatMoney(item.totalHT) }}</td>
                               </tr>
                            }
                         </tbody>
                      </table>
                   </div>

                   <!-- TOTALS SECTION -->
                   <div class="flex justify-end mb-12 break-inside-avoid">
                      <div class="w-64 space-y-2">
                         @let totalDiscount = getTotalDiscount(doc);
                         @let grossHT = getGrossHT(doc);

                         @if (totalDiscount > 0) {
                            <div class="flex justify-between text-sm">
                               <span class="text-gray-500">Total Brut HT</span>
                               <span class="font-medium text-gray-900">{{ formatMoney(grossHT) }}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                               <span class="text-gray-500">Remise</span>
                               <span class="font-medium text-red-500">-{{ formatMoney(totalDiscount) }}</span>
                            </div>
                            <div class="flex justify-between text-sm border-t border-gray-100 pt-1">
                               <span class="text-gray-800 font-bold">Net HT</span>
                               <span class="font-bold text-gray-900">{{ formatMoney(doc.totalHT) }}</span>
                            </div>
                         } @else {
                            <div class="flex justify-between text-sm">
                               <span class="text-gray-500">Total HT</span>
                               <span class="font-medium text-gray-900">{{ formatMoney(doc.totalHT) }}</span>
                            </div>
                         }

                         <div class="flex justify-between text-sm">
                            <span class="text-gray-500">TVA ({{ getVatRate(doc) }}%)</span>
                            <span class="font-medium text-gray-900">{{ formatMoney(doc.totalVAT) }}</span>
                         </div>
                         <div class="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-2 mt-2">
                            <span class="text-gray-900">Total TTC</span>
                            <span class="text-brand-600">{{ formatMoney(doc.totalTTC) }}</span>
                         </div>
                         @if(doc.type !== 'DEVIS') {
                            <div class="flex justify-between text-xs text-gray-500 pt-2 mt-2 border-t border-gray-200">
                               <span>Déjà réglé</span>
                               <span>{{ formatMoney(doc.paidAmount) }}</span>
                            </div>
                            <div class="flex justify-between text-sm font-bold text-gray-800">
                               <span>Reste à payer</span>
                               <span>{{ formatMoney(doc.remainingAmount) }}</span>
                            </div>
                         }
                      </div>
                   </div>

                   <!-- FOOTER SECTION -->
                   <div class="mt-auto pt-8 border-t border-gray-200 text-center">
                      <p class="text-[9px] text-gray-400 uppercase tracking-wider mb-2">
                         {{ dataService.currentSettings().invoiceFooter }}
                      </p>
                      <p class="text-[8px] text-gray-300">
                         Document généré automatiquement par ICE BY MECATECH
                      </p>
                   </div>

                </div>
             </div>
          </div>
       </div>
    }
  `
})
export class DocumentsComponent {
   dataService = inject(DataService);
   toastService = inject(ToastService);
   route = inject(ActivatedRoute);

   // Filters State (Using Signals for Reactivity)
   searchTerm = signal('');
   typeFilter = signal('ALL');
   periodFilter = signal('ALL');

   // Preview State
   showPreviewModal = signal(false);
   selectedDoc = signal<Invoice | null>(null);

   constructor() {
      // Listen to query params for direct document opening
      this.route.queryParams.subscribe(params => {
         if (params['id']) {
            const doc = this.dataService.getInvoiceById(params['id']);
            if (doc) {
               // Using setTimeout to ensure UI is ready if navigating rapidly
               setTimeout(() => {
                  this.selectedDoc.set(doc);
                  this.showPreviewModal.set(true);
               }, 100);
            }
         }
      });
   }

   // --- COMPUTED ---
   filteredDocuments = computed(() => {
      const search = this.searchTerm().toLowerCase();
      const type = this.typeFilter();
      const period = this.periodFilter();

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      return this.dataService.invoices().filter(doc => {
         // Search Filter
         const matchesSearch = !search ||
            doc.number.toLowerCase().includes(search) ||
            doc.clientName.toLowerCase().includes(search) ||
            (doc.vehicleDescription && doc.vehicleDescription.toLowerCase().includes(search));

         // Type Filter
         const matchesType = type === 'ALL' || doc.type === type;

         // Period Filter
         const docDate = new Date(doc.date);
         let matchesPeriod = true;
         if (period === 'MONTH') {
            matchesPeriod = docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
         } else if (period === 'YEAR') {
            matchesPeriod = docDate.getFullYear() === currentYear;
         }

         return matchesSearch && matchesType && matchesPeriod;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   });

   // --- ACTIONS ---

   formatMoney(val: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(val); }

   getStatusClass(status: string) {
      switch (status) {
         case 'PAYE': case 'ACCEPTE': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
         case 'VALIDE': case 'ENVOYE': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
         case 'PARTIEL': case 'NON_VALIDE': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
         case 'BROUILLON': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
         case 'ANNULE': case 'REFUSE': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
         default: return 'bg-slate-100 text-slate-600';
      }
   }

   getVehicle(id: string) {
      return this.dataService.getVehicleById(id);
   }

   updateDocStatus(event: Event, doc: Invoice) {
      const newStatus = (event.target as HTMLSelectElement).value as any;
      this.dataService.updateInvoiceStatus(doc.id, newStatus);
      this.toastService.show('Statut mis à jour', 'success');
   }

   openPreview(doc: Invoice) {
      this.selectedDoc.set(doc);
      this.showPreviewModal.set(true);
   }

   closePreview() {
      this.showPreviewModal.set(false);
      this.selectedDoc.set(null);
   }

   // --- HELPER METHODS FOR TOTALS ---

   getGrossHT(doc: Invoice): number {
      return doc.items.filter(i => i.totalHT >= 0).reduce((acc, i) => acc + i.totalHT, 0);
   }

   getTotalDiscount(doc: Invoice): number {
      return doc.items.filter(i => i.totalHT < 0).reduce((acc, i) => acc + Math.abs(i.totalHT), 0);
   }

   getVatRate(doc: Invoice): string {
      return doc.totalHT > 0 ? (doc.totalVAT / doc.totalHT * 100).toFixed(0) : '0';
   }

   // --- SEND & NOTIFY ACTIONS ---

   sendDocument(doc: Invoice, method: 'EMAIL' | 'WHATSAPP') {
      const client = this.dataService.getClientById(doc.clientId);
      if (!client) {
         this.toastService.show('Client introuvable', 'error');
         return;
      }

      if (method === 'EMAIL') {
         if (!client.email) {
            this.toastService.show('Aucune adresse email pour ce client', 'error');
            return;
         }

         // Construct Mailto Link
         const subject = encodeURIComponent(`${doc.type} N° ${doc.number} - ${this.dataService.currentSettings().name}`);
         const body = encodeURIComponent(
            `Bonjour ${client.firstName},\n\nVeuillez trouver ci-joint votre ${doc.type.toLowerCase()} n°${doc.number} du ${new Date(doc.date).toLocaleDateString('fr-FR')}.\nMontant Total: ${this.formatMoney(doc.totalTTC)}.\n\nCordialement,\n${this.dataService.currentSettings().name}`
         );

         // Trigger default email client
         window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;

         this.dataService.updateInvoiceStatus(doc.id, 'ENVOYE');
         this.toastService.show(`Ouverture du client mail...`, 'info');
      }
      else if (method === 'WHATSAPP') {
         if (!client.phone) {
            this.toastService.show('Aucun téléphone pour ce client', 'error');
            return;
         }

         // Generate the PDF immediately so the user has it ready to drag & drop
         this.generatePDF(doc);
         this.toastService.show('Document téléchargé. Vous pouvez le glisser dans WhatsApp Web.', 'info');

         // Clean phone number (remove non-digits)
         const phone = client.phone.replace(/[^0-9]/g, '');

         // Removed payment link as requested and removed manual upload notice
         const message = encodeURIComponent(
            `Bonjour ${client.firstName},\n\nVoici votre ${doc.type.toLowerCase()} n°${doc.number}.\nMontant Total: ${this.formatMoney(doc.totalTTC)}.\n\nCordialement,\n${this.dataService.currentSettings().name}`
         );

         const url = `https://wa.me/${phone}?text=${message}`;
         window.open(url, '_blank');
         this.dataService.updateInvoiceStatus(doc.id, 'ENVOYE');
      }
   }

   notifyReady(doc: Invoice) {
      const client = this.dataService.getClientById(doc.clientId);
      if (!client || !client.phone) {
         this.toastService.show('Téléphone client introuvable', 'error');
         return;
      }

      const phone = client.phone.replace(/[^0-9]/g, '');
      const vehicle = doc.vehicleDescription || 'votre véhicule';
      const message = encodeURIComponent(
         `Bonjour ${client.firstName},\n\nLes travaux sur ${vehicle} sont terminés ! \nLe véhicule est prêt à être récupéré.\n\nMontant à régler: ${this.formatMoney(doc.remainingAmount)}.\n\nÀ bientôt,\n${this.dataService.currentSettings().name}`
      );

      const url = `https://wa.me/${phone}?text=${message}`;
      window.open(url, '_blank');
      this.toastService.show('Notification préparée (WhatsApp)', 'success');
   }

   // Unified PDF Generator
   // Designed to match the A4 HTML Preview layout exactly (20mm margins)
   generatePDF(docData: Invoice) {
      const doc = new jsPDF({
         format: 'a4',
         unit: 'mm'
      });

      const settings = this.dataService.currentSettings();
      const client = this.dataService.getClientById(docData.clientId);
      const vehicle = this.dataService.getVehicleById(docData.vehicleId || '');

      const currency = settings.currency || 'XOF';
      const primaryColor = settings.docColor || '#2563eb';
      const format = (n: number) => n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

      // Calculate Totals Breakdown for PDF
      const positiveItems = docData.items.filter(i => i.totalHT >= 0);
      const discountItems = docData.items.filter(i => i.totalHT < 0);

      const grossHT = positiveItems.reduce((acc, i) => acc + i.totalHT, 0);
      const discountTotal = discountItems.reduce((acc, i) => acc + Math.abs(i.totalHT), 0);

      // Dynamic VAT Calculation
      const computedVatRate = docData.totalHT > 0
         ? Math.round((docData.totalVAT / docData.totalHT) * 100)
         : 18; // Fallback or standard if 0 HT (full discount case)

      // Helper for Hex to RGB for jsPDF
      const hexToRgb = (hex: string) => {
         const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
         return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
         } : { r: 0, g: 0, b: 0 };
      }
      const colorRgb = hexToRgb(primaryColor);

      let y = 20; // Start at 20mm margin top
      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - (margin * 2);

      // --- BACKGROUND IMAGE ---
      if (settings.useBackgroundImage && settings.backgroundImageUrl) {
         try {
            doc.addImage(settings.backgroundImageUrl, 'JPEG', 0, 0, 210, 297);
         } catch (e) { console.error('Error loading background', e); }
         // If background image is used, we assume it contains the header/footer graphics.
         // We adjust start Y to below the header typically.
         y = 50;
      }

      // --- HEADER (If no background) ---
      if (!settings.useBackgroundImage) {
         // Logo
         if (settings.logoUrl) {
            try {
               doc.addImage(settings.logoUrl, 'PNG', margin, y, 25, 25, undefined, 'FAST');
            } catch (e) { }
         }

         // Company Info (Left)
         const textLeftX = settings.logoUrl ? margin + 30 : margin;
         doc.setFontSize(16);
         doc.setTextColor(colorRgb.r, colorRgb.g, colorRgb.b);
         doc.setFont('helvetica', 'bold');
         doc.text(settings.name.toUpperCase(), textLeftX, y + 8);

         doc.setFontSize(9);
         doc.setTextColor(80, 80, 80);
         doc.setFont('helvetica', 'normal');
         doc.text(settings.address, textLeftX, y + 14);
         doc.text(`${settings.zip} ${settings.city}`, textLeftX, y + 18);
         doc.text(settings.phone, textLeftX, y + 22);

         // Document Info (Right)
         doc.setFontSize(24);
         doc.setTextColor(40, 40, 40);
         doc.setFont('helvetica', 'bold');
         doc.text(docData.type, pageWidth - margin, y + 8, { align: 'right' });

         doc.setFontSize(12);
         doc.setTextColor(100, 100, 100);
         doc.setFont('courier', 'normal');
         doc.text(`#${docData.number}`, pageWidth - margin, y + 14, { align: 'right' });

         doc.setFontSize(10);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(40, 40, 40);
         doc.text(`Date : ${new Date(docData.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, y + 24, { align: 'right' });

         doc.setFontSize(9);
         doc.setFont('helvetica', 'normal');
         doc.setTextColor(120, 120, 120);
         const dateLabel = docData.type === 'DEVIS' ? 'Validité' : 'Échéance';
         doc.text(`${dateLabel} : ${new Date(docData.dueDate).toLocaleDateString('fr-FR')}`, pageWidth - margin, y + 29, { align: 'right' });

         y += 40; // Move down after header
      }

      // --- INFO BOXES (Client & Vehicle) ---
      // Divider line matches HTML border-top/bottom
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      // Col 1: Client
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURÉ À', margin, y);

      y += 5;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(docData.clientName, margin, y);

      y += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      if (client) {
         doc.text(client.address.street, margin, y);
         doc.text(`${client.address.zip} ${client.address.city}`, margin, y + 4);
         if (client.vatNumber) doc.text(`TVA: ${client.vatNumber}`, margin, y + 8);
      }

      // Col 2: Vehicle (Right side of grid)
      // Divider vertical line simulation
      doc.setDrawColor(230, 230, 230);
      doc.line(105, y - 10, 105, y + 15);

      const col2X = 110; // Right column start
      let yVeh = y - 5; // Reset Y for right col relative to header

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'bold');
      doc.text('VÉHICULE CONCERNÉ', col2X, yVeh);

      yVeh += 5;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(docData.vehicleDescription || 'Non spécifié', col2X, yVeh);

      yVeh += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      if (vehicle) {
         doc.text(`VIN: ${vehicle.vin || '-'}`, col2X, yVeh);
         doc.text(`Immat: ${vehicle.plate || '-'}`, col2X, yVeh + 4);
         doc.text(`KM: ${vehicle.mileage}`, col2X, yVeh + 8);
      }

      y += 20; // Space after boxes
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y); // Bottom border of info section
      y += 10;

      // --- TABLE HEADERS ---
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setDrawColor(colorRgb.r, colorRgb.g, colorRgb.b); // Brand color border bottom
      doc.setLineWidth(0.5);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100); // Gray-600
      doc.setFont('helvetica', 'bold');

      doc.text('DESCRIPTION', margin + 2, y + 5);
      doc.text('QTÉ', pageWidth - margin - 60, y + 5, { align: 'right' });
      doc.text('P.U. HT', pageWidth - margin - 35, y + 5, { align: 'right' });
      doc.text('TOTAL HT', pageWidth - margin - 2, y + 5, { align: 'right' });

      y += 14;

      // --- TABLE ROWS ---
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      docData.items.forEach((item, i) => {
         // Page break check
         if (y > 270) {
            doc.addPage();
            y = 20;
            // Reprint headers? Optional, kept simple here to match HTML flow
         }

         doc.text(item.description, margin + 2, y);
         doc.text(item.quantity.toString(), pageWidth - margin - 60, y, { align: 'right' });
         doc.text(format(item.unitPrice), pageWidth - margin - 35, y, { align: 'right' });
         doc.setFont('helvetica', 'bold');
         doc.text(format(item.totalHT), pageWidth - margin - 2, y, { align: 'right' });
         doc.setFont('helvetica', 'normal');

         // Row Border
         doc.setDrawColor(240, 240, 240);
         doc.setLineWidth(0.1);
         doc.line(margin, y + 3, pageWidth - margin, y + 3);
         y += 8;
      });

      // --- TOTALS ---
      y += 5;
      // Page break check for totals
      if (y > 250) { doc.addPage(); y = 20; }

      const rightColX = pageWidth - margin;
      const labelColX = pageWidth - margin - 50;

      const printTotal = (label: string, value: string, bold = false, size = 9, color: 'gray' | 'black' | 'brand' | 'red' = 'gray') => {
         doc.setFontSize(size);
         doc.setFont('helvetica', bold ? 'bold' : 'normal');

         if (color === 'brand') doc.setTextColor(colorRgb.r, colorRgb.g, colorRgb.b);
         else if (color === 'black') doc.setTextColor(0, 0, 0);
         else if (color === 'red') doc.setTextColor(239, 68, 68);
         else doc.setTextColor(100, 100, 100);

         doc.text(label, labelColX, y);
         doc.text(value, rightColX, y, { align: 'right' });
         y += 5;
      };

      // LOGIC: If we have discounts, show breakdown.
      if (discountTotal > 0) {
         printTotal('Total Brut HT', format(grossHT));
         printTotal('Remise', '-' + format(discountTotal), false, 9, 'red');

         y += 1;
         doc.setDrawColor(230, 230, 230);
         doc.line(labelColX, y - 1, rightColX, y - 1); // Line above Net
         y += 2;

         printTotal('Net HT', format(docData.totalHT), true, 9, 'black');
      } else {
         printTotal('Total HT', format(docData.totalHT));
      }

      printTotal(`TVA (${computedVatRate}%)`, format(docData.totalVAT));

      y += 2;
      // Border top for Total TTC
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.5);
      doc.line(labelColX, y - 1, rightColX, y - 1);
      y += 5;

      printTotal('Total TTC', format(docData.totalTTC) + ' ' + currency, true, 12, 'brand');

      if (docData.type !== 'DEVIS') {
         y += 2;
         doc.setDrawColor(200, 200, 200);
         doc.line(labelColX, y - 1, rightColX, y - 1);
         y += 3;

         printTotal('Déjà réglé', format(docData.paidAmount), false, 8);
         printTotal('Reste à payer', format(docData.remainingAmount) + ' ' + currency, true, 10, 'black');
      }

      // --- FOOTER ---
      if (!settings.useBackgroundImage) {
         const pageHeight = doc.internal.pageSize.height;
         const footerY = pageHeight - 15;

         doc.setDrawColor(230, 230, 230);
         doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

         doc.setFontSize(8);
         doc.setTextColor(150, 150, 150);
         doc.text(settings.invoiceFooter || '', pageWidth / 2, footerY, { align: 'center', maxWidth: 150 });

         doc.setFontSize(6);
         doc.setTextColor(200, 200, 200);
         doc.text('Document généré automatiquement par ICE BY MECATECH', pageWidth / 2, footerY + 5, { align: 'center' });
      }

      doc.save(`${docData.type}_${docData.number}.pdf`);
      this.toastService.show('Document téléchargé', 'success');
   }
}
