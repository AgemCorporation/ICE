
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, AppUser, RepairOrder, EmployeeDocument } from '../../services/data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
   selector: 'app-hr',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule],
   template: `
    <div class="flex flex-col h-full">
      <div class="mb-6 shrink-0">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Ressources Humaines</h1>
        <p class="text-slate-500 dark:text-slate-400">Gestion du personnel, suivi des heures et productivité.</p>
      </div>

      <div class="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
         <!-- Left: Employee List -->
         <div class="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div class="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
               <h3 class="font-bold text-slate-900 dark:text-white">Effectif ({{ tenantStaff().length }})</h3>
               <button (click)="openCreateModal()" class="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                  Nouveau
               </button>
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-2">
               @for (user of tenantStaff(); track user.id) {
                  <div (click)="selectUser(user)" class="p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                       [class.border-brand-500]="selectedUser()?.id === user.id"
                       [class.bg-brand-50]="selectedUser()?.id === user.id"
                       [class.dark:bg-slate-800]="selectedUser()?.id === user.id"
                       [class.border-slate-200]="selectedUser()?.id !== user.id"
                       [class.dark:border-slate-800]="selectedUser()?.id !== user.id">
                     
                     <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" 
                          [ngClass]="getRoleColor(user.role)">
                        {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                     </div>
                     <div class="flex-1 min-w-0">
                        <div class="font-bold text-slate-900 dark:text-white truncate">{{ user.firstName }} {{ user.lastName }}</div>
                        <div class="text-xs text-slate-500 truncate">{{ user.jobTitle || user.role }}</div>
                     </div>
                     @if (user.role === 'Mecanicien') {
                        <div class="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                           {{ getInterventionCount(user) }} INT
                        </div>
                     }
                  </div>
               }
            </div>
         </div>

         <!-- Right: Details -->
         <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg relative">
            @if (selectedUser(); as user) {
               <div class="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-start">
                  <div class="flex items-center gap-4">
                     <div class="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-md" [ngClass]="getRoleColor(user.role)">
                        {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                     </div>
                     <div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">{{ user.firstName }} {{ user.lastName }}</h2>
                        <div class="flex items-center gap-2 mt-1">
                           <span class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              {{ user.role }}
                           </span>
                           <span class="text-sm text-slate-500">{{ user.email }}</span>
                        </div>
                     </div>
                  </div>
                  <button (click)="openEditModal(user)" class="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded transition-colors text-slate-600 dark:text-slate-300">
                     Modifier Fiche
                  </button>
               </div>

               <div class="flex-1 overflow-y-auto p-6 space-y-8">
                  
                  <!-- Info Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     
                     <!-- Block 1: Personal -->
                     <div class="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                        <h4 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Informations Personnelles</h4>
                        <div class="space-y-3 text-sm">
                           <div>
                              <span class="block text-xs text-slate-500">Adresse</span>
                              <span class="text-slate-900 dark:text-white">{{ user.address || 'Non renseignée' }}</span>
                           </div>
                           <div>
                              <span class="block text-xs text-slate-500">Téléphone</span>
                              <span class="text-slate-900 dark:text-white">{{ user.phone || '-' }}</span>
                           </div>
                           @if (user.emergencyContact) {
                              <div>
                                 <span class="block text-xs text-slate-500">Urgence ({{ user.emergencyContact.relation }})</span>
                                 <span class="text-slate-900 dark:text-white font-medium">{{ user.emergencyContact.name }} - {{ user.emergencyContact.phone }}</span>
                              </div>
                           }
                        </div>
                     </div>

                     <!-- Block 2: Contract -->
                     <div class="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                        <h4 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">Contrat & Statut</h4>
                        <div class="space-y-3 text-sm">
                           <div>
                              <span class="block text-xs text-slate-500">Poste / Intitulé</span>
                              <span class="text-slate-900 dark:text-white font-bold">{{ user.jobTitle || user.role }}</span>
                           </div>
                           <div>
                              <span class="block text-xs text-slate-500">Type de Contrat</span>
                              <span class="inline-block px-2 py-0.5 rounded text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">{{ user.contractType || 'Non défini' }}</span>
                           </div>
                           <div class="flex gap-4">
                              <div>
                                 <span class="block text-xs text-slate-500">Embauche</span>
                                 <span class="text-slate-900 dark:text-white">{{ user.hiredDate ? (user.hiredDate | date:'dd/MM/yyyy') : '-' }}</span>
                              </div>
                              @if (user.contractEndDate) {
                                 <div>
                                    <span class="block text-xs text-slate-500">Fin Contrat</span>
                                    <span class="text-slate-900 dark:text-white">{{ user.contractEndDate | date:'dd/MM/yyyy' }}</span>
                                 </div>
                              }
                           </div>
                        </div>
                     </div>

                     <!-- Block 3: Documents (GED) -->
                     <div class="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800 lg:col-span-1 md:col-span-2 lg:col-auto">
                        <div class="flex justify-between items-center mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">
                           <h4 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide">Documents Administratifs</h4>
                           <input type="file" #docInput class="hidden" (change)="onFileSelected($event)">
                           <button (click)="docInput.click()" class="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 px-2 py-1 rounded text-slate-600 dark:text-slate-300 transition-colors">
                              + Ajouter
                           </button>
                        </div>
                        
                        <div class="space-y-2 max-h-40 overflow-y-auto">
                           @for (doc of user.documents || []; track doc.id) {
                              <div class="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 group">
                                 <div class="flex items-center gap-2 overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    <div class="flex flex-col overflow-hidden">
                                       <span class="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{{ doc.name }}</span>
                                       <span class="text-[9px] text-slate-400">{{ doc.type }} • {{ doc.date | date:'dd/MM/yy' }}</span>
                                    </div>
                                 </div>
                                 <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button (click)="viewDocument(doc)" class="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg></button>
                                    <button (click)="deleteDocument(doc.id)" class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                                 </div>
                              </div>
                           }
                           @if (!user.documents || user.documents.length === 0) {
                              <div class="text-center py-4 text-xs text-slate-400 italic">Aucun document chargé</div>
                           }
                        </div>
                     </div>
                  </div>

                  <!-- Mechanics Stats -->
                  @if (user.role === 'Mecanicien') {
                     <div>
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-6">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                           Performance & Interventions
                        </h3>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                           <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl">
                              <div class="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase">Interventions Totales</div>
                              <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ getInterventionCount(user) }}</div>
                           </div>
                           <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl">
                              <div class="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">Temps Travaillé Cumulé</div>
                              <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ formatDuration(dataService.getMechanicTotalTime(user.id)) }}</div>
                           </div>
                        </div>

                        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Historique des travaux</h4>
                        <div class="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                           <table class="w-full text-sm text-left">
                              <thead class="bg-slate-50 dark:bg-slate-950 text-xs uppercase text-slate-500">
                                 <tr>
                                    <th class="px-4 py-3">Date</th>
                                    <th class="px-4 py-3">Véhicule</th>
                                    <th class="px-4 py-3">Description</th>
                                    <th class="px-4 py-3 text-right">Temps</th>
                                    <th class="px-4 py-3 text-center">Statut</th>
                                    <th class="px-4 py-3 text-center">Détails</th>
                                 </tr>
                              </thead>
                              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                 @for (repair of getMechanicRepairs(user); track repair.id) {
                                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                       <td class="px-4 py-3 text-slate-500 whitespace-nowrap">{{ repair.entryDate | date:'dd/MM/yy' }}</td>
                                       <td class="px-4 py-3 font-medium">{{ getVehicleName(repair.vehicleId) }}</td>
                                       <td class="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{{ repair.description }}</td>
                                       <td class="px-4 py-3 text-right font-mono">{{ formatDuration(getRepairTime(repair, user.id)) }}</td>
                                       <td class="px-4 py-3 text-center">
                                          <span class="text-[10px] px-2 py-0.5 rounded border uppercase" [class]="getStatusClass(repair.status)">{{ repair.status }}</span>
                                       </td>
                                       <td class="px-4 py-3 text-center">
                                          <button (click)="openHistoryDetails(repair)" class="text-slate-400 hover:text-brand-500 transition-colors" title="Voir les détails horaires">
                                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                          </button>
                                       </td>
                                    </tr>
                                 }
                                 @if (getMechanicRepairs(user).length === 0) {
                                    <tr><td colspan="6" class="p-6 text-center text-slate-500 italic">Aucune intervention enregistrée.</td></tr>
                                 }
                              </tbody>
                           </table>
                        </div>
                     </div>
                  }
               </div>
            } @else {
               <div class="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <p>Sélectionnez un employé pour voir sa fiche.</p>
               </div>
            }
         </div>
      </div>
    </div>

    <!-- HISTORY DETAILS MODAL -->
    @if (showHistoryDetailModal() && selectedHistoryRepair(); as repair) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div>
                   <span>Détail Intervention #{{ repair.id.substring(0,6) }}</span>
                   <div class="text-xs text-slate-500 font-normal mt-0.5">{{ getVehicleName(repair.vehicleId) }} - {{ repair.entryDate | date:'dd/MM/yyyy' }}</div>
                </div>
                <button (click)="closeHistoryDetails()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <div class="p-6 overflow-y-auto max-h-[60vh]">
                @if (repair.timeLogs && repair.timeLogs.length > 0) {
                   <table class="w-full text-sm text-left">
                      <thead class="bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                         <tr>
                            <th class="px-4 py-2">Type</th>
                            <th class="px-4 py-2">Début</th>
                            <th class="px-4 py-2">Fin</th>
                            <th class="px-4 py-2 text-right">Durée</th>
                            <th class="px-4 py-2">Détails / Motif</th>
                         </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                         @for (log of repair.timeLogs; track log.id) {
                            @if (log.userId === selectedUser()?.id) {
                               <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <td class="px-4 py-3">
                                     @if (log.type === 'PAUSE') {
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold">PAUSE</span>
                                     } @else {
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">TRAVAIL</span>
                                     }
                                  </td>
                                  <td class="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 text-xs">{{ log.startTime | date:'HH:mm' }}</td>
                                  <td class="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 text-xs">
                                     {{ log.endTime ? (log.endTime | date:'HH:mm') : 'En cours...' }}
                                  </td>
                                  <td class="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                     {{ log.durationMinutes ? log.durationMinutes + ' min' : '-' }}
                                  </td>
                                  <td class="px-4 py-3 text-xs text-slate-500">
                                     {{ log.pauseReason || '-' }}
                                  </td>
                               </tr>
                            }
                         }
                      </tbody>
                      <tfoot class="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                         <tr>
                            <td colspan="3" class="px-4 py-3 text-right font-bold text-slate-500 uppercase text-xs">Total Travaillé (Hors Pauses)</td>
                            <td class="px-4 py-3 text-right font-bold text-brand-600 dark:text-brand-400">
                               {{ formatDuration(getRepairTime(repair, selectedUser()?.id || '')) }}
                            </td>
                            <td></td>
                         </tr>
                      </tfoot>
                   </table>
                } @else {
                   <div class="text-center py-8 text-slate-500 italic">Aucun journal de temps enregistré pour cette intervention.</div>
                }
             </div>
             
             <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button (click)="closeHistoryDetails()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors">Fermer</button>
             </div>
          </div>
       </div>
    }

    <!-- EDIT / CREATE MODAL -->
    @if (showEditModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                <span>{{ selectedUser() ? 'Modifier Fiche' : 'Créer Nouvelle Fiche' }}</span>
                <button (click)="closeEditModal()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             <form [formGroup]="editForm" (ngSubmit)="submitEdit()" class="p-6 space-y-4">
                
                <h4 class="text-xs font-bold text-brand-500 uppercase border-b border-slate-200 dark:border-slate-800 pb-1">Identité & Compte</h4>
                <div class="grid grid-cols-2 gap-4">
                   <div><label class="block text-xs text-slate-500 mb-1">Prénom</label><input formControlName="firstName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   <div><label class="block text-xs text-slate-500 mb-1">Nom</label><input formControlName="lastName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   <div class="col-span-2">
                      <label class="block text-xs text-slate-500 mb-1">Poste (Intitulé)</label>
                      <input formControlName="jobTitle" placeholder="Ex: Chef d'Atelier" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                </div>

                <h4 class="text-xs font-bold text-brand-500 uppercase border-b border-slate-200 dark:border-slate-800 pb-1 pt-2">Infos RH</h4>
                <div class="grid grid-cols-2 gap-4">
                   <!-- Removed JobTitle from here, moved up -->
                   <div><label class="block text-xs text-slate-500 mb-1">Téléphone Perso</label><input formControlName="phone" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   <div class="col-span-2"><label class="block text-xs text-slate-500 mb-1">Adresse</label><input formControlName="address" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                </div>

                <h4 class="text-xs font-bold text-brand-500 uppercase border-b border-slate-200 dark:border-slate-800 pb-1 pt-2">Contrat</h4>
                <div class="grid grid-cols-2 gap-4">
                   <div><label class="block text-xs text-slate-500 mb-1">Type Contrat</label><select formControlName="contractType" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"><option value="CDI">CDI</option><option value="CDD">CDD</option><option value="Stage">Stage</option><option value="Apprentissage">Apprentissage</option><option value="Prestation">Prestation</option></select></div>
                   <div><label class="block text-xs text-slate-500 mb-1">Date d'embauche</label><input type="date" formControlName="hiredDate" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   <div><label class="block text-xs text-slate-500 mb-1">Fin de Contrat</label><input type="date" formControlName="contractEndDate" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   @if (editForm.get('role')?.value === 'Mecanicien') {
                      <div><label class="block text-xs text-slate-500 mb-1">Coût Horaire (Interne)</label><input type="number" formControlName="hourlyCost" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   }
                </div>

                <h4 class="text-xs font-bold text-brand-500 uppercase border-b border-slate-200 dark:border-slate-800 pb-1 pt-2">Contact Urgence</h4>
                <div formGroupName="emergencyContact" class="grid grid-cols-2 gap-4">
                   <div class="col-span-2"><label class="block text-xs text-slate-500 mb-1">Nom Contact</label><input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   <div><label class="block text-xs text-slate-500 mb-1">Lien / Relation</label><input formControlName="relation" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                   <div><label class="block text-xs text-slate-500 mb-1">Téléphone</label><input formControlName="phone" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white"></div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                   <button type="button" (click)="closeEditModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button type="submit" [disabled]="editForm.invalid" class="bg-brand-600 text-white px-4 py-2 rounded font-medium hover:bg-brand-500 disabled:opacity-50">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }
  `
})
export class HrComponent {
   dataService = inject(DataService);
   toastService = inject(ToastService);
   fb = inject(FormBuilder);

   selectedUser = signal<AppUser | null>(null);

   tenantStaff = computed(() => {
      const tId = this.dataService.currentTenantId();
      if (!tId && this.dataService.isAdmin()) return this.dataService.staff();
      return this.dataService.staff().filter(u => u.tenantId === tId);
   });

   // Edit Modal
   showEditModal = signal(false);
   editForm: FormGroup;

   // History Details Modal
   showHistoryDetailModal = signal(false);
   selectedHistoryRepair = signal<RepairOrder | null>(null);

   constructor() {
      this.editForm = this.fb.group({
         firstName: ['', Validators.required],
         lastName: ['', Validators.required],
         jobTitle: [''],
         phone: [''],
         address: [''],
         contractType: ['CDI'],
         hiredDate: [''],
         contractEndDate: [''],
         hourlyCost: [0],
         emergencyContact: this.fb.group({
            name: [''],
            phone: [''],
            relation: ['']
         })
      });
   }

   selectUser(user: AppUser) {
      this.selectedUser.set(user);
   }

   getRoleColor(role: string): string {
      switch (role) {
         case 'Admin': return 'bg-blue-500';
         case 'Manager': return 'bg-indigo-500';
         case 'Secretaire': return 'bg-purple-500';
         case 'Mecanicien': return 'bg-emerald-500';
         default: return 'bg-slate-500';
      }
   }

   // Stats
   getInterventionCount(user: AppUser): number {
      return this.dataService.repairs().filter(r => r.mechanic === user.firstName).length;
   }

   getMechanicRepairs(user: AppUser): RepairOrder[] {
      return this.dataService.repairs().filter(r => r.mechanic === user.firstName).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
   }

   getRepairTime(repair: RepairOrder, userId: string): number {
      if (!repair.timeLogs) return 0;
      // Only count actual WORK time, not pauses
      return repair.timeLogs
         .filter(l => l.userId === userId && l.type === 'WORK')
         .reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
   }

   formatDuration(minutes: number): string {
      if (!minutes) return '0 min';
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h > 0) return `${h}h ${m}m`;
      return `${m} min`;
   }

   getVehicleName(vid: string) {
      const v = this.dataService.getVehicleById(vid);
      return v ? `${v.brand} ${v.model}` : 'Inconnu';
   }

   getStatusClass(status: string) {
      switch (status) {
         case 'En cours': return 'bg-purple-100 text-purple-700 border-purple-200';
         case 'Terminé': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
         case 'Clôturé': return 'bg-slate-100 text-slate-500 border-slate-200';
         default: return 'bg-white text-slate-700 border-slate-200';
      }
   }

   // Documents
   onFileSelected(event: any) {
      const file = event.target.files[0];
      if (!file || !this.selectedUser()) return;

      // Simulate upload
      const reader = new FileReader();
      reader.onload = (e: any) => {
         const newDoc: EmployeeDocument = {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.name.toLowerCase().includes('cv') ? 'CV' : 'AUTRE',
            date: new Date().toISOString(),
            url: e.target.result // Base64 for demo
         };

         const updatedUser = {
            ...this.selectedUser()!,
            documents: [...(this.selectedUser()!.documents || []), newDoc]
         };

         this.dataService.updateStaff(updatedUser);
         this.selectedUser.set(updatedUser);
         this.toastService.show('Document ajouté', 'success');
      };
      reader.readAsDataURL(file);

      // Reset input
      event.target.value = '';
   }

   deleteDocument(docId: string) {
      if (!confirm('Supprimer ce document ?')) return;
      if (this.selectedUser()) {
         const updatedDocs = (this.selectedUser()!.documents || []).filter(d => d.id !== docId);
         const updatedUser = { ...this.selectedUser()!, documents: updatedDocs };
         this.dataService.updateStaff(updatedUser);
         this.selectedUser.set(updatedUser);
         this.toastService.show('Document supprimé', 'info');
      }
   }

   viewDocument(doc: EmployeeDocument) {
      this.toastService.show(`Ouverture de ${doc.name}...`, 'info');
      // For demo, we just log. In real app, open new window with URL
      console.log('Open Doc:', doc.url);
   }

   // Edit / Create
   openEditModal(user: AppUser) {
      this.editForm.patchValue({
         firstName: user.firstName,
         lastName: user.lastName,
         jobTitle: user.jobTitle || '',
         phone: user.phone || '',
         address: user.address || '',
         hiredDate: user.hiredDate || '',
         contractType: user.contractType || 'CDI',
         contractEndDate: user.contractEndDate || '',
         hourlyCost: user.hourlyCost || 0,
         emergencyContact: {
            name: user.emergencyContact?.name || '',
            phone: user.emergencyContact?.phone || '',
            relation: user.emergencyContact?.relation || ''
         }
      });
      this.showEditModal.set(true);
   }

   openCreateModal() {
      this.selectedUser.set(null); // Clear selected to indicate creation mode
      this.editForm.reset({
         contractType: 'CDI',
         hourlyCost: 0
      });
      this.showEditModal.set(true);
   }

   closeEditModal() { this.showEditModal.set(false); }

   submitEdit() {
      if (this.editForm.invalid) {
         this.toastService.show('Formulaire invalide', 'error');
         return;
      }

      const formVal = this.editForm.value;

      if (this.selectedUser()) {
         // UPDATE EXISTING
         const updated = { ...this.selectedUser()!, ...formVal };
         this.dataService.updateStaff(updated);
         this.selectedUser.set(updated);
         this.toastService.show('Informations mises à jour', 'success');
      } else {
         // CREATE NEW
         const tId = this.dataService.currentTenantId();
         const newUser: AppUser = {
            id: crypto.randomUUID(),
            active: true,
            tenantId: tId || undefined,
            ...formVal,
            documents: []
         };
         this.dataService.addStaff(newUser);
         this.selectedUser.set(newUser);
         this.toastService.show('Fiche employée créée', 'success');
      }
      this.closeEditModal();
   }

   // History Details
   openHistoryDetails(repair: RepairOrder) {
      this.selectedHistoryRepair.set(repair);
      this.showHistoryDetailModal.set(true);
   }

   closeHistoryDetails() {
      this.showHistoryDetailModal.set(false);
      this.selectedHistoryRepair.set(null);
   }
}
