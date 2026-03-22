
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Part, Supplier, StockMovement, Warehouse, LabourRate, ServicePackage } from '../../services/data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="flex flex-col h-full relative">
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 shrink-0 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Gestion Stocks & Services</h1>
          <p class="text-sm md:text-base text-slate-500 dark:text-slate-400">
             Catalogue de pièces, entrepôts et catalogue des prestations.
             @if (dataService.canViewFinancials() && dataService.canViewPartsStock()) {
                <span class="hidden sm:inline text-slate-400 dark:text-slate-500 ml-2">|</span>
                <span class="block sm:inline mt-1 sm:mt-0">Val. Stock : <span class="text-emerald-600 dark:text-emerald-400 font-mono">{{ formatMoney(dataService.totalStockValue()) }}</span></span>
             }
          </p>
        </div>
        
        <!-- Tab Navigation -->
        <div class="flex flex-wrap gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-auto overflow-x-auto">
           @if (dataService.canViewPartsStock()) {
              <button (click)="activeTab.set('stock')" [class]="activeTab() === 'stock' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-3 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Stock</button>
           }
           @if (dataService.canViewServicesCatalog()) {
              <button (click)="activeTab.set('services')" [class]="activeTab() === 'services' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-3 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Services</button>
           }
           @if (dataService.canViewWarehouses()) {
              <button (click)="activeTab.set('warehouses')" [class]="activeTab() === 'warehouses' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-3 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Entrepôts</button>
           }
           @if (dataService.canViewSuppliers()) {
              <button (click)="activeTab.set('suppliers')" [class]="activeTab() === 'suppliers' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-3 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Fournisseurs</button>
           }
           @if (dataService.canViewStockMovements()) {
              <button (click)="activeTab.set('movements')" [class]="activeTab() === 'movements' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-3 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Journal</button>
           }
        </div>
      </div>

      <!-- Action Buttons Toolbar (Contextual) -->
      <div class="flex flex-col gap-4 mb-6 shrink-0">
         
         <!-- TOOLBAR STOCK -->
         @if (activeTab() === 'stock') {
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div class="relative w-full sm:w-64">
                     <span class="absolute left-3 top-2 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                        </svg>
                     </span>
                     <input 
                        type="text" 
                        [value]="stockSearchTerm()"
                        (input)="updateStockSearch($event)"
                        placeholder="Rechercher..." 
                        class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white w-full focus:ring-1 focus:ring-brand-500 placeholder-slate-400 shadow-sm"
                     >
                  </div>
                  @if (dataService.canViewSuppliers()) {
                     <select 
                        [value]="stockSupplierFilter()"
                        (change)="updateStockSupplierFilter($event)"
                        class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-brand-500 shadow-sm w-full sm:w-auto"
                     >
                        <option value="">Tous les fournisseurs</option>
                        @for (s of dataService.suppliers(); track s.id) {
                           <option [value]="s.id">{{ s.name }}</option>
                        }
                     </select>
                  }
               </div>
               
               <div class="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
                  
                  @if (dataService.canImportExport()) {
                     <!-- Import/Export Buttons -->
                     <div class="flex mr-2">
                        <input #fileInput type="file" accept=".csv, .xlsx, .xls, .txt" (change)="handleImport($event)" class="hidden">
                        <button (click)="fileInput.click()" class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-l-lg text-sm font-medium transition-colors flex items-center gap-2" title="Importer Excel/CSV">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                           <span class="hidden sm:inline">Import</span>
                        </button>
                        <button (click)="exportStockCSV()" class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-y border-r border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-r-lg text-sm font-medium transition-colors flex items-center gap-2" title="Exporter CSV">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           <span class="hidden sm:inline">Export</span>
                        </button>
                     </div>
                  }

                  @if (dataService.canCreateCounterSale()) {
                     <button (click)="openMovementModal(null, 'OUT_COUNTER_SALE')" class="bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span class="hidden sm:inline">Vente</span> Comptoir
                     </button>
                  }

                  @if (dataService.canManagePartRequests()) {
                     <button (click)="showPartRequests.set(true)" class="relative bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0" /></svg>
                        <span class="hidden sm:inline">Demandes</span> Atelier
                        @if (dataService.pendingPartRequests().length > 0) {
                           <span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-slate-900">{{ dataService.pendingPartRequests().length }}</span>
                        }
                     </button>
                  }

                  @if (dataService.canManagePartsData()) {
                     <button (click)="openPartModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-brand-600/20">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                        Nouveau
                     </button>
                  }
               </div>
            </div>
         }

         <!-- TOOLBAR SERVICES -->
         @if (activeTab() === 'services') {
            <div class="flex justify-end gap-2 flex-wrap">
               @if(dataService.canManageServicesCatalog()) {
                  <button (click)="openLabourModal()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                     + Taux Horaire
                  </button>
                  <button (click)="openPackageModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                     + Forfait
                  </button>
               }
            </div>
         }

         <!-- TOOLBAR WAREHOUSES -->
         @if (activeTab() === 'warehouses') {
            <div class="flex justify-end gap-2">
               @if(dataService.canManageWarehouses()) {
                  <button (click)="openWarehouseModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                     + Nouvel Entrepôt
                  </button>
               }
            </div>
         }

         <!-- TOOLBAR SUPPLIERS -->
         @if (activeTab() === 'suppliers') {
            <div class="flex justify-end gap-2">
               @if(dataService.canManageSuppliers()) {
                  <button (click)="openSupplierModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                     + Nouveau Fournisseur
                  </button>
               }
            </div>
         }
      </div>

      <!-- CONTENT AREA -->
      <div class="flex-1 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col">
         
         <!-- TAB: STOCK (Parts List) -->
         @if (activeTab() === 'stock') {
            <div class="flex-1 overflow-y-auto">
               <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left">
                     <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                        <tr>
                           <th class="px-6 py-4 w-16 text-center">Image</th>
                           <th class="px-6 py-4">Référence / Désignation</th>
                           <th class="px-6 py-4">OEM</th>
                           <th class="px-6 py-4 hidden sm:table-cell">Catégorie</th>
                           <th class="px-6 py-4 text-center">Stock</th>
                           @if (dataService.canViewFinancials()) {
                              <th class="px-6 py-4 text-right hidden md:table-cell">Prix Achat</th>
                              <th class="px-6 py-4 text-right hidden md:table-cell">Prix Vente HT</th>
                           }
                           <th class="px-6 py-4 hidden lg:table-cell">Emplacement</th>
                           <th class="px-6 py-4 hidden xl:table-cell">Marque</th>
                           <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        @for (part of filteredParts(); track part.id) {
                           <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                              <td class="px-6 py-4 text-center">
                                 @if (part.image) {
                                    <div class="relative inline-block group/img">
                                       <img [src]="part.image" 
                                            class="h-10 w-10 object-cover rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mx-auto cursor-zoom-in"
                                            (mouseenter)="hoveredImage.set(part.image)"
                                            (mouseleave)="hoveredImage.set(null)">
                                    </div>
                                 } @else {
                                    <div class="h-10 w-10 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                 }
                              </td>
                              <td class="px-6 py-4">
                                 <div class="font-bold text-slate-900 dark:text-white font-mono">{{ part.reference }}</div>
                                 <div class="text-slate-600 dark:text-slate-300 text-xs">{{ part.name }}</div>
                              </td>
                              <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ part.oem || '-' }}</td>
                              <td class="px-6 py-4 hidden sm:table-cell">
                                 <span class="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {{ part.category }}
                                 </span>
                              </td>
                              <td class="px-6 py-4 text-center">
                                 <div class="flex flex-col items-center">
                                    <span class="font-bold text-lg" [ngClass]="getStockColor(part.stock, part.minStock)">
                                       {{ part.stock }}
                                    </span>
                                    @if (part.stock <= part.minStock) {
                                       <span class="text-[10px] text-red-500 font-bold uppercase tracking-wide">Stock Critique</span>
                                    }
                                 </div>
                              </td>
                              @if (dataService.canViewFinancials()) {
                                 <td class="px-6 py-4 text-right text-slate-500 font-mono text-xs hidden md:table-cell">{{ formatMoney(part.buyPrice) }}</td>
                                 <td class="px-6 py-4 text-right font-bold text-slate-900 dark:text-white font-mono hidden md:table-cell">{{ formatMoney(part.sellPrice) }}</td>
                              }
                              <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs hidden lg:table-cell">
                                 {{ part.location }}
                                 <div class="text-[10px] text-slate-400">{{ getWarehouseName(part.warehouseId) }}</div>
                              </td>
                              <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs truncate max-w-[150px] hidden xl:table-cell">
                                 {{ part.brand }}
                              </td>
                              <td class="px-6 py-4 text-right">
                                 <div class="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    @if (dataService.canManageStockLevels()) {
                                       <button (click)="openMovementModal(part, 'IN_PURCHASE')" class="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50" title="Entrée Stock">
                                          + Stock
                                       </button>
                                    }
                                    @if (dataService.canManagePartsData()) {
                                       <button (click)="openPartModal(part)" class="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="Modifier">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                       </button>
                                    }
                                 </div>
                              </td>
                           </tr>
                        }
                        @if (filteredParts().length === 0) {
                           <tr><td colspan="9" class="p-8 text-center text-slate-500 italic">Aucune pièce trouvée.</td></tr>
                        }
                     </tbody>
                  </table>
               </div>
            </div>
         }

         <!-- TAB: SERVICES (Labour & Packages) -->
         @if (activeTab() === 'services') {
            <div class="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
               <!-- Labour Rates -->
               <div class="space-y-4">
                  <h3 class="font-bold text-slate-900 dark:text-white text-lg border-b border-slate-200 dark:border-slate-800 pb-2">Taux Horaires Main d'Œuvre</h3>
                  <div class="space-y-3">
                     @for (rate of dataService.labourRates(); track rate.id) {
                        <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex justify-between items-center group">
                           <div>
                              <div class="font-bold text-slate-900 dark:text-white">{{ rate.name }} <span class="text-xs text-slate-500 font-normal">({{ rate.code }})</span></div>
                           </div>
                           <div class="flex items-center gap-4">
                              <span class="font-mono font-bold text-brand-600 dark:text-brand-400">{{ formatMoney(rate.hourlyRate) }} /h</span>
                              @if(dataService.canManageServicesCatalog()) {
                                 <button (click)="openLabourModal(rate)" class="text-slate-400 hover:text-blue-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                 </button>
                              }
                           </div>
                        </div>
                     }
                  </div>
               </div>

               <!-- Service Packages -->
               <div class="space-y-4">
                  <h3 class="font-bold text-slate-900 dark:text-white text-lg border-b border-slate-200 dark:border-slate-800 pb-2">Forfaits & Services</h3>
                  <div class="space-y-3">
                     @for (pkg of dataService.packages(); track pkg.id) {
                        <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 group">
                           <div class="flex justify-between items-start mb-2">
                              <div class="font-bold text-slate-900 dark:text-white">{{ pkg.name }}</div>
                              <div class="flex items-center gap-4">
                                 <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ formatMoney(pkg.price) }}</span>
                                 @if(dataService.canManageServicesCatalog()) {
                                    <button (click)="openPackageModal(pkg)" class="text-slate-400 hover:text-blue-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                       <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                    </button>
                                 }
                              </div>
                           </div>
                           <p class="text-xs text-slate-500 mb-2">{{ pkg.description }}</p>
                           @if (pkg.partIds && pkg.partIds.length > 0) {
                              <div class="flex flex-wrap gap-1">
                                 @for (pid of pkg.partIds; track pid) {
                                    <span class="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                       {{ getPartName(pid) }}
                                    </span>
                                 }
                              </div>
                           }
                        </div>
                     }
                  </div>
               </div>
            </div>
         }

         <!-- TAB: WAREHOUSES -->
         @if (activeTab() === 'warehouses') {
            <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               @for (w of dataService.warehouses(); track w.id) {
                  <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 group hover:border-brand-500/50 transition-colors">
                     <div class="flex justify-between items-start mb-3">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        @if(dataService.canManageWarehouses()) {
                           <button (click)="openWarehouseModal(w)" class="text-slate-400 hover:text-blue-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                           </button>
                        }
                     </div>
                     <h3 class="font-bold text-slate-900 dark:text-white text-lg">{{ w.name }}</h3>
                     <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ w.address || 'Aucune adresse' }}</p>
                  </div>
               }
            </div>
         }

         <!-- TAB: SUPPLIERS -->
         @if (activeTab() === 'suppliers') {
            <div class="flex-1 overflow-y-auto">
               <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left">
                     <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                           <th class="px-6 py-4">Nom</th>
                           <th class="px-6 py-4">Contact</th>
                           <th class="px-6 py-4">Délai (Jours)</th>
                           <th class="px-6 py-4 text-center">Statut</th>
                           <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        @for (s of dataService.suppliers(); track s.id) {
                           <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                              <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">{{ s.name }}</td>
                              <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                                 <div>{{ s.contactName }}</div>
                                 <div class="text-xs text-slate-500">{{ s.email }} | {{ s.phone }}</div>
                              </td>
                              <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ s.deliveryDelayDays }}j</td>
                              <td class="px-6 py-4 text-center">
                                 @if (!s.isArchived) {
                                    <span class="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded">Actif</span>
                                 } @else {
                                    <span class="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded">Archivé</span>
                                 }
                              </td>
                              <td class="px-6 py-4 text-right">
                                 @if(dataService.canManageSuppliers()) {
                                    <button (click)="openSupplierModal(s)" class="text-slate-400 hover:text-blue-500">Modifier</button>
                                 }
                              </td>
                           </tr>
                        }
                     </tbody>
                  </table>
               </div>
            </div>
         }

         <!-- TAB: MOVEMENTS (Journal) -->
         @if (activeTab() === 'movements') {
            <div class="flex-1 overflow-y-auto">
               <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left">
                     <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                        <tr>
                           <th class="px-6 py-3">Date</th>
                           <th class="px-6 py-3">Type</th>
                           <th class="px-6 py-3">Pièce</th>
                           <th class="px-6 py-3 text-right">Quantité</th>
                           <th class="px-6 py-3">Motif / OR</th>
                           <th class="px-6 py-3">Utilisateur</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                        @for (mvt of dataService.movements(); track mvt.id) {
                           <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td class="px-6 py-3 text-slate-500 whitespace-nowrap">{{ mvt.date | date:'dd/MM/yyyy HH:mm' }}</td>
                              <td class="px-6 py-3 whitespace-nowrap">
                                 @if (mvt.type === 'IN_PURCHASE') { <span class="text-emerald-600 dark:text-emerald-400 font-bold">ENTRÉE (Achat)</span> }
                                 @if (mvt.type === 'OUT_REPAIR') { <span class="text-blue-600 dark:text-blue-400 font-bold">SORTIE (Atelier)</span> }
                                 @if (mvt.type === 'OUT_COUNTER_SALE') { <span class="text-purple-600 dark:text-purple-400 font-bold">VENTE COMPTOIR</span> }
                                 @if (mvt.type === 'ADJUSTMENT') { <span class="text-amber-600 dark:text-amber-400 font-bold">AJUSTEMENT</span> }
                              </td>
                              <td class="px-6 py-3 text-slate-900 dark:text-white font-sans">{{ getPartName(mvt.partId) }}</td>
                              <td class="px-6 py-3 text-right font-bold" [class.text-red-500]="mvt.quantity < 0" [class.text-emerald-500]="mvt.quantity > 0">
                                 {{ mvt.quantity > 0 ? '+' : '' }}{{ mvt.quantity }}
                              </td>
                              <td class="px-6 py-3 text-slate-600 dark:text-slate-300">{{ mvt.reason || '-' }}</td>
                              <td class="px-6 py-3 text-slate-500">{{ mvt.userId }}</td>
                           </tr>
                        }
                     </tbody>
                  </table>
               </div>
            </div>
         }
      </div>
    </div>

    <!-- IMAGE HOVER OVERLAY -->
    @if (hoveredImage()) {
       <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-none">
          <img [src]="hoveredImage()" class="max-w-[500px] max-h-[500px] rounded-xl shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 object-contain">
       </div>
    }

    <!-- ===== MODALS ===== -->

    <!-- PART MODAL -->
    @if (showPartModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                <span>{{ editingPartId() ? 'Modifier la pièce' : 'Nouvelle Référence' }}</span>
                <button (click)="closePartModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
             </div>
             <form [formGroup]="partForm" (ngSubmit)="submitPart()" class="p-6 space-y-6">
                <!-- Image Input Area -->
                <div class="flex items-center gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800">
                   <div class="w-20 h-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative shrink-0">
                      @if(partImagePreview()) {
                         <img [src]="partImagePreview()" class="w-full h-full object-cover">
                         <button type="button" (click)="removePartImage()" class="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">✕</button>
                      } @else {
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      }
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Photo de la pièce</label>
                      <input type="file" (change)="onPartImageSelected($event)" accept="image/*" class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-slate-800 dark:file:text-slate-300 transition-all cursor-pointer">
                      <p class="text-[10px] text-slate-400 mt-1">Format JPG/PNG.</p>
                   </div>
                </div>

                <!-- Identification -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Référence *</label>
                      <input formControlName="reference" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white font-mono uppercase">
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">OEM *</label>
                      <input formControlName="oem" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white font-mono uppercase" placeholder="Référence Constructeur">
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Désignation *</label>
                      <input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <!-- Fabricant removed -->
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Catégorie</label>
                      <input formControlName="category" list="categories" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      <datalist id="categories">
                         <option value="Filtration">
                         <option value="Freinage">
                         <option value="Moteur">
                         <option value="Liquides">
                         <option value="Éclairage">
                      </datalist>
                   </div>
                </div>

                <!-- Stock & Location -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                   @if (!editingPartId()) {
                      <div>
                         <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Stock Initial</label>
                         <input type="number" formControlName="stock" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                      </div>
                   }
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Stock Min (Alerte)</label>
                      <input type="number" formControlName="minStock" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Emplacement</label>
                      <input formControlName="location" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div class="col-span-2 md:col-span-1">
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Entrepôt</label>
                      <select formControlName="warehouseId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         @for (w of dataService.warehouses(); track w.id) {
                            <option [value]="w.id">{{ w.name }}</option>
                         }
                      </select>
                   </div>
                   <div class="col-span-2">
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Marque</label>
                      <input formControlName="brand" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                </div>

                <!-- Pricing -->
                <div class="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Prix Achat HT</label>
                      <input type="number" formControlName="buyPrice" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Prix Vente HT</label>
                      <input type="number" formControlName="sellPrice" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                </div>

                <div class="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                   <button type="button" (click)="closePartModal()" class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Annuler</button>
                   <button type="submit" [disabled]="partForm.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-brand-600/20 disabled:opacity-50">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- MOVEMENT MODAL -->
    @if (showMovementModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                @if (movementType() === 'IN_PURCHASE') { Entrée de Stock (Achat) }
                @if (movementType() === 'OUT_COUNTER_SALE') { Vente Comptoir }
                @if (movementType() === 'ADJUSTMENT') { Ajustement Stock }
             </div>
             <form [formGroup]="movementForm" (ngSubmit)="submitMovement()" class="p-6 space-y-4">
                
                @if (!selectedPartForMovement()) {
                   <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Sélectionner Pièce</label>
                      <select formControlName="partId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         <option value="">-- Choisir --</option>
                         @for (p of dataService.parts(); track p.id) {
                            <option [value]="p.id">{{ p.reference }} - {{ p.name }} (Stock: {{ p.stock }})</option>
                         }
                      </select>
                   </div>
                } @else {
                   <div class="bg-slate-100 dark:bg-slate-800 p-3 rounded mb-2">
                      <div class="font-bold text-slate-900 dark:text-white">{{ selectedPartForMovement()?.reference }}</div>
                      <div class="text-xs text-slate-500">{{ selectedPartForMovement()?.name }}</div>
                      <div class="text-xs text-slate-500 mt-1">Stock Actuel: <span class="font-bold">{{ selectedPartForMovement()?.stock }}</span></div>
                   </div>
                }

                <div>
                   <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Quantité</label>
                   <input type="number" formControlName="quantity" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white font-bold">
                   @if (movementType() === 'ADJUSTMENT') {
                      <p class="text-[10px] text-slate-500 mt-1">Utilisez une valeur négative pour réduire le stock.</p>
                   }
                </div>

                <div>
                   <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Motif / Référence Doc</label>
                   <input formControlName="reason" placeholder="Ex: BL-12345, Inventaire..." class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                </div>

                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closeMovementModal()" class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Annuler</button>
                   <button type="submit" [disabled]="movementForm.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded font-medium disabled:opacity-50">Valider</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- PART REQUESTS MODAL -->
    @if (showPartRequests()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                <span>Demandes de Pièces (Atelier)</span>
                <button (click)="showPartRequests.set(false)" class="text-slate-400 hover:text-white">✕</button>
             </div>
             <div class="p-6">
                @if (dataService.pendingPartRequests().length > 0) {
                   <div class="space-y-4">
                      @for (req of dataService.pendingPartRequests(); track req.item) {
                         <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex justify-between items-center">
                            <div>
                               <div class="font-bold text-slate-900 dark:text-white">{{ req.item.description }} <span class="text-brand-600 dark:text-brand-400">x{{ req.item.quantity }}</span></div>
                               <div class="text-sm text-slate-500 mt-1">
                                  OR: #{{ req.repair.id.substring(0,6) }} ({{ req.repair.mechanic }})
                                </div>
                            </div>
                            <div>
                               @let part = getPartById(req.item.partId!);
                               @if (part && part.stock >= req.item.quantity) {
                                  <button (click)="validateRequest(req.repair.id, req.itemIndex, req.repair.mechanic || 'Atelier')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium">
                                     Sortir du Stock
                                  </button>
                               } @else {
                                  <span class="text-red-500 text-sm font-bold border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded">Stock Insuffisant ({{ part?.stock || 0 }})</span>
                               }
                            </div>
                         </div>
                      }
                   </div>
                } @else {
                   <div class="text-center py-12 text-slate-500">Aucune demande en attente.</div>
                }
             </div>
          </div>
       </div>
    }

    <!-- Other Modals (Supplier, Warehouse, Labour, Package) ... simplified for brevity but functional -->
    <!-- SUPPLIER MODAL -->
    @if (showSupplierModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">Fournisseur</div>
             <form [formGroup]="supplierForm" (ngSubmit)="submitSupplier()" class="p-6 space-y-4">
                <div><label class="block text-xs text-slate-500 mb-1">Nom</label><input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Contact</label><input formControlName="contactName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Email</label><input formControlName="email" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Téléphone</label><input formControlName="phone" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Délai Livraison (Jours)</label><input type="number" formControlName="deliveryDelayDays" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closeSupplierModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button type="submit" class="bg-brand-600 text-white px-4 py-2 rounded">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- WAREHOUSE MODAL -->
    @if (showWarehouseModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">Entrepôt</div>
             <form [formGroup]="warehouseForm" (ngSubmit)="submitWarehouse()" class="p-6 space-y-4">
                <div><label class="block text-xs text-slate-500 mb-1">Nom</label><input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Adresse / Note</label><input formControlName="address" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closeWarehouseModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button type="submit" class="bg-brand-600 text-white px-4 py-2 rounded">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- LABOUR RATE MODAL -->
    @if (showLabourModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">Taux Horaire</div>
             <form [formGroup]="labourForm" (ngSubmit)="submitLabour()" class="p-6 space-y-4">
                <div><label class="block text-xs text-slate-500 mb-1">Code</label><input formControlName="code" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Libellé</label><input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Taux Horaire HT</label><input type="number" formControlName="hourlyRate" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closeLabourModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button type="submit" class="bg-brand-600 text-white px-4 py-2 rounded">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- PACKAGE MODAL -->
    @if (showPackageModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">Forfait</div>
             <form [formGroup]="packageForm" (ngSubmit)="submitPackage()" class="p-6 space-y-4">
                <div><label class="block text-xs text-slate-500 mb-1">Nom du Forfait</label><input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Description</label><input formControlName="description" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                <div><label class="block text-xs text-slate-500 mb-1">Prix Total HT</label><input type="number" formControlName="price" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                
                <div>
                   <label class="block text-xs text-slate-500 mb-2">Pièces incluses</label>
                   <div class="max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-700 rounded p-2 bg-slate-50 dark:bg-slate-950">
                      @for (p of dataService.parts(); track p.id) {
                         <label class="flex items-center gap-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer">
                            <input type="checkbox" [checked]="isPartInPackage(p.id)" (change)="togglePartInPackage(p.id)">
                            <span class="text-sm text-slate-700 dark:text-slate-300">{{ p.reference }} - {{ p.name }}</span>
                         </label>
                      }
                   </div>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closePackageModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button type="submit" class="bg-brand-600 text-white px-4 py-2 rounded">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }
  `
})
export class InventoryComponent {
  dataService: DataService = inject(DataService);
  toastService: ToastService = inject(ToastService);
  fb: FormBuilder = inject(FormBuilder);

  activeTab = signal<'stock' | 'services' | 'warehouses' | 'suppliers' | 'movements'>('stock');
  
  // Stock State
  stockSearchTerm = signal('');
  stockSupplierFilter = signal('');
  
  // Modals
  showPartModal = signal(false);
  editingPartId = signal<string | null>(null);
  
  showMovementModal = signal(false);
  movementType = signal<'IN_PURCHASE' | 'OUT_COUNTER_SALE' | 'ADJUSTMENT'>('IN_PURCHASE');
  selectedPartForMovement = signal<Part | null>(null);

  showPartRequests = signal(false);

  showSupplierModal = signal(false);
  editingSupplierId = signal<string | null>(null);

  showWarehouseModal = signal(false);
  editingWarehouseId = signal<string | null>(null);

  showLabourModal = signal(false);
  editingLabourId = signal<string | null>(null);

  showPackageModal = signal(false);
  editingPackageId = signal<string | null>(null);
  
  // Forms
  partForm: FormGroup;
  movementForm: FormGroup;
  supplierForm: FormGroup;
  warehouseForm: FormGroup;
  labourForm: FormGroup;
  packageForm: FormGroup;

  // Selected Parts for Package Form (local state)
  selectedPackageParts = signal<string[]>([]);
  
  // Image Upload
  partImagePreview = signal<string | null>(null);
  
  // Hover Image
  hoveredImage = signal<string | null>(null);

  constructor() {
     this.partForm = this.fb.group({
        reference: ['', Validators.required],
        oem: ['', Validators.required], // REQUIRED
        name: ['', Validators.required],
        brand: [''], // Kept in model but removed from UI
        category: [''],
        stock: [0, Validators.min(0)],
        minStock: [5],
        buyPrice: [0],
        sellPrice: [0],
        location: [''],
        warehouseId: [''],
        supplierId: [''],
        image: [''] // Added Image Field
     });

     this.movementForm = this.fb.group({
        partId: ['', Validators.required],
        quantity: [1, Validators.required],
        reason: ['']
     });

     this.supplierForm = this.fb.group({
        name: ['', Validators.required],
        contactName: [''],
        email: ['', Validators.email],
        phone: [''],
        deliveryDelayDays: [0]
     });

     this.warehouseForm = this.fb.group({
        name: ['', Validators.required],
        address: ['']
     });

     this.labourForm = this.fb.group({
        code: ['', Validators.required],
        name: ['', Validators.required],
        hourlyRate: [0, Validators.required]
     });

     this.packageForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        price: [0, Validators.required]
     });
  }

  // --- COMPUTED ---
  filteredParts = computed(() => {
     const term = this.stockSearchTerm().toLowerCase();
     const supplierId = this.stockSupplierFilter();
     
     return this.dataService.parts().filter(p => {
        const matchesTerm = !term || p.name.toLowerCase().includes(term) || p.reference.toLowerCase().includes(term);
        const matchesSupplier = !supplierId || p.supplierId === supplierId;
        return matchesTerm && matchesSupplier;
     });
  });

  // --- ACTIONS ---
  updateStockSearch(e: Event) { this.stockSearchTerm.set((e.target as HTMLInputElement).value); }
  updateStockSupplierFilter(e: Event) { this.stockSupplierFilter.set((e.target as HTMLSelectElement).value); }

  formatMoney(val: number) { return new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'XOF'}).format(val); }
  
  getWarehouseName(id?: string) { return this.dataService.warehouses().find(w => w.id === id)?.name || '-'; }
  getSupplierName(id?: string) { return this.dataService.suppliers().find(s => s.id === id)?.name || '-'; }
  getPartName(id?: string) { 
     const p = this.dataService.getPartById(id || '');
     return p ? p.name : '-';
  }
  
  // FIX: Helper method required for template
  getPartById(id: string) { return this.dataService.getPartById(id); }

  getStockColor(stock: number, min: number) {
     if (stock <= 0) return 'text-red-600 dark:text-red-500';
     if (stock <= min) return 'text-amber-600 dark:text-amber-500';
     return 'text-emerald-600 dark:text-emerald-400';
  }

  // --- PART MODAL ---
  openPartModal(part?: Part) {
     if (part) {
        this.editingPartId.set(part.id);
        this.partForm.patchValue(part);
        this.partImagePreview.set(part.image || null); // Set image preview
        this.partForm.get('stock')?.disable(); // Can't edit stock directly here, use movement
     } else {
        this.editingPartId.set(null);
        this.partForm.reset({ stock: 0, minStock: 5 });
        this.partImagePreview.set(null);
        this.partForm.get('stock')?.enable();
     }
     this.showPartModal.set(true);
  }
  closePartModal() { this.showPartModal.set(false); }
  
  onPartImageSelected(event: any) {
     const file = event.target.files[0];
     if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
           this.partImagePreview.set(e.target.result);
           this.partForm.patchValue({ image: e.target.result });
        };
        reader.readAsDataURL(file);
     }
  }

  removePartImage() {
     this.partImagePreview.set(null);
     this.partForm.patchValue({ image: '' });
  }
  
  submitPart() {
     if(this.partForm.invalid) return;
     const formVal = this.partForm.getRawValue();
     
     if (this.editingPartId()) {
        const p = this.dataService.getPartById(this.editingPartId()!);
        if(p) {
           this.dataService.updatePart({ ...p, ...formVal });
           this.toastService.show('Pièce mise à jour', 'success');
        }
     } else {
        const newPart: Part = {
           id: crypto.randomUUID(),
           ...formVal,
           priceHistory: []
        };
        this.dataService.addPart(newPart);
        // Initial Stock Movement if stock > 0
        if (newPart.stock > 0) {
           this.dataService.addMovement({
              id: crypto.randomUUID(),
              partId: newPart.id,
              date: new Date().toISOString(),
              type: 'IN_PURCHASE',
              quantity: newPart.stock,
              reason: 'Stock Initial',
              userId: this.dataService.currentUser().firstName
           });
        }
        this.toastService.show('Pièce créée', 'success');
     }
     this.closePartModal();
  }

  // --- MOVEMENT MODAL ---
  openMovementModal(part: Part | null, type: 'IN_PURCHASE' | 'OUT_COUNTER_SALE' | 'ADJUSTMENT') {
     this.selectedPartForMovement.set(part);
     this.movementType.set(type);
     this.movementForm.reset({ 
        partId: part ? part.id : '',
        quantity: 1,
        reason: ''
     });
     this.showMovementModal.set(true);
  }
  closeMovementModal() { this.showMovementModal.set(false); }
  
  submitMovement() {
     if (this.movementForm.invalid) return;
     const val = this.movementForm.value;
     
     // Check Stock for OUT
     const part = this.dataService.getPartById(val.partId);
     if (!part) return;

     let qty = val.quantity;
     if (this.movementType() === 'OUT_COUNTER_SALE') {
        if (part.stock < qty) {
           this.toastService.show('Stock insuffisant !', 'error');
           return;
        }
        qty = -qty; // Negative for out
     }
     // Adjustment can be + or - directly from input if needed, but usually handled by UI. 
     // Here assuming Adjustment Input is relative change.

     const mvt: StockMovement = {
        id: crypto.randomUUID(),
        partId: val.partId,
        date: new Date().toISOString(),
        type: this.movementType(),
        quantity: this.movementType() === 'OUT_COUNTER_SALE' ? qty : val.quantity, // For sale enforce neg, for others take val (adjustment can be neg in input)
        reason: val.reason,
        userId: this.dataService.currentUser().firstName
     };
     
     this.dataService.addMovement(mvt);
     this.toastService.show('Mouvement enregistré', 'success');
     this.closeMovementModal();
  }

  // --- REQUEST VALIDATION ---
  validateRequest(repairId: string, itemIndex: number, mechanicName: string) {
     this.dataService.validatePartExit(repairId, itemIndex, mechanicName);
     this.toastService.show('Sortie validée', 'success');
  }

  // --- SUPPLIER ---
  openSupplierModal(s?: Supplier) {
     if(s) { this.editingSupplierId.set(s.id); this.supplierForm.patchValue(s); }
     else { this.editingSupplierId.set(null); this.supplierForm.reset(); }
     this.showSupplierModal.set(true);
  }
  closeSupplierModal() { this.showSupplierModal.set(false); }
  submitSupplier() {
     if(this.supplierForm.invalid) return;
     if(this.editingSupplierId()) {
        const s = this.dataService.getSupplierById(this.editingSupplierId()!);
        if(s) this.dataService.updateSupplier({...s, ...this.supplierForm.value});
     } else {
        this.dataService.addSupplier({id: crypto.randomUUID(), ...this.supplierForm.value, isArchived: false});
     }
     this.closeSupplierModal();
  }

  // --- WAREHOUSE ---
  openWarehouseModal(w?: Warehouse) {
     if(w) { this.editingWarehouseId.set(w.id); this.warehouseForm.patchValue(w); }
     else { this.editingWarehouseId.set(null); this.warehouseForm.reset(); }
     this.showWarehouseModal.set(true);
  }
  closeWarehouseModal() { this.showWarehouseModal.set(false); }
  submitWarehouse() {
     if(this.warehouseForm.invalid) return;
     if(this.editingWarehouseId()) {
        const w = this.dataService.getWarehouseById(this.editingWarehouseId()!);
        if(w) this.dataService.updateWarehouse({...w, ...this.warehouseForm.value});
     } else {
        this.dataService.addWarehouse({id: crypto.randomUUID(), ...this.warehouseForm.value});
     }
     this.closeWarehouseModal();
  }

  // --- LABOUR ---
  openLabourModal(l?: LabourRate) {
     if(l) { this.editingLabourId.set(l.id); this.labourForm.patchValue(l); }
     else { this.editingLabourId.set(null); this.labourForm.reset(); }
     this.showLabourModal.set(true);
  }
  closeLabourModal() { this.showLabourModal.set(false); }
  submitLabour() {
     if(this.labourForm.invalid) return;
     if(this.editingLabourId()) {
        const l = this.dataService.labourRates().find(x => x.id === this.editingLabourId());
        if(l) this.dataService.updateLabourRate({...l, ...this.labourForm.value});
     } else {
        this.dataService.addLabourRate({id: crypto.randomUUID(), ...this.labourForm.value});
     }
     this.closeLabourModal();
  }

  // --- PACKAGE ---
  openPackageModal(p?: ServicePackage) {
     if(p) { 
        this.editingPackageId.set(p.id); 
        this.packageForm.patchValue(p);
        this.selectedPackageParts.set(p.partIds || []);
     } else { 
        this.editingPackageId.set(null); 
        this.packageForm.reset(); 
        this.selectedPackageParts.set([]);
     }
     this.showPackageModal.set(true);
  }
  closePackageModal() { this.showPackageModal.set(false); }
  
  isPartInPackage(partId: string) { return this.selectedPackageParts().includes(partId); }
  togglePartInPackage(partId: string) {
     this.selectedPackageParts.update(ids => {
        if (ids.includes(partId)) return ids.filter(id => id !== partId);
        return [...ids, partId];
     });
  }

  submitPackage() {
     if(this.packageForm.invalid) return;
     const pkgData = { ...this.packageForm.value, partIds: this.selectedPackageParts() };
     
     if(this.editingPackageId()) {
        const p = this.dataService.packages().find(x => x.id === this.editingPackageId());
        if(p) this.dataService.updatePackage({...p, ...pkgData});
     } else {
        this.dataService.addPackage({id: crypto.randomUUID(), ...pkgData});
     }
     this.closePackageModal();
  }

  // --- IMPORT / EXPORT ---
  
  exportStockCSV() {
     const data = this.dataService.parts().map(p => ({
        Reference: p.reference,
        OEM: p.oem || '', // Include in export
        Designation: p.name,
        Marque: p.brand,
        Categorie: p.category,
        Stock: p.stock,
        MinStock: p.minStock,
        PrixAchat: p.buyPrice,
        PrixVente: p.sellPrice,
        Emplacement: p.location,
        Fournisseur: this.getSupplierName(p.supplierId)
     }));
     
     const ws = XLSX.utils.json_to_sheet(data);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, 'Stock');
     XLSX.writeFile(wb, `Stock_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
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
        
        let count = 0;
        data.forEach((row: any) => {
           // Simple mapping assuming columns match
           const newPart: Part = {
              id: crypto.randomUUID(),
              reference: row['Reference'] || 'REF-' + Math.random().toString(36).substr(2, 5),
              oem: row['OEM'] || '',
              name: row['Designation'] || 'Pièce Importée',
              brand: row['Marque'] || '',
              category: row['Categorie'] || 'Divers',
              stock: Number(row['Stock']) || 0,
              minStock: Number(row['MinStock']) || 0,
              buyPrice: Number(row['PrixAchat']) || 0,
              sellPrice: Number(row['PrixVente']) || 0,
              location: row['Emplacement'] || '',
              warehouseId: '',
              supplierId: '',
              vatRate: 18,
              marginPercent: 0,
              reorderQty: 0,
              priceHistory: []
           };
           this.dataService.addPart(newPart);
           count++;
        });
        
        this.toastService.show(`${count} articles importés avec succès`, 'success');
     };
     reader.readAsBinaryString(file);
  }
}
