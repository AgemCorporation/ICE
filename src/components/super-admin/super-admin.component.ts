
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Tenant, PlatformLead, QuoteRequest, Invoice, RepairStatus, SystemLog, PlatformConfig, ALL_PERMISSIONS, PLAN_DEFAULTS, CITIES, IVORY_COAST_LOCATIONS, AppUser } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
   selector: 'app-super-admin',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, FormsModule],
   template: `
    <div class="flex flex-col h-full">
      <!-- Header Area (Contextual) -->
      <div class="flex justify-between items-end mb-6 shrink-0">
        <div>
           <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">{{ pageTitle() }}</h1>
           <p class="text-slate-500 dark:text-slate-400">{{ pageDescription() }}</p>
        </div>
      </div>

      <div class="flex-1 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col relative">
         
         <!-- 1. DASHBOARD TAB -->
         @if (activeTab() === 'dashboard') {
            <div class="p-6 overflow-y-auto">
               <!-- KPI Cards -->
               <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 p-6 rounded-xl relative overflow-hidden group">
                     <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-20 text-indigo-500"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <h3 class="text-indigo-600 dark:text-indigo-300 font-medium text-sm uppercase tracking-wider mb-1">MRR (Mensuel)</h3>
                     <div class="text-3xl font-bold text-slate-900 dark:text-white">{{ formatMoney(dataService.saasMetrics().totalMrr) }}</div>
                     <div class="text-xs text-indigo-500 dark:text-indigo-400 mt-2 flex items-center gap-1"><span class="bg-indigo-100 dark:bg-indigo-500/20 px-1 rounded text-indigo-600 dark:text-indigo-300">+5.4%</span> vs mois dernier</div>
                  </div>

                  <div class="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
                     <h3 class="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Garages Actifs</h3>
                     <div class="text-3xl font-bold text-slate-900 dark:text-white">{{ dataService.saasMetrics().activeTenants }} <span class="text-lg text-slate-400 dark:text-slate-500 font-normal">/ {{ dataService.saasMetrics().totalTenants }}</span></div>
                     <div class="text-xs text-slate-500 mt-2">Taux de rétention : <span class="text-emerald-600 dark:text-emerald-400 font-bold">98%</span></div>
                  </div>

                  <div class="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
                     <h3 class="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Demandes de Devis (Leads)</h3>
                     <div class="text-3xl font-bold text-slate-900 dark:text-white">{{ dataService.quoteRequests().length }}</div>
                     <div class="text-xs text-slate-500 mt-2 text-brand-600 dark:text-brand-400 font-medium cursor-pointer hover:underline" (click)="activeTab.set('moderation')">Voir la modération</div>
                  </div>

                  <div class="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
                     <h3 class="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Incidents Système</h3>
                     <div class="text-3xl font-bold text-slate-900 dark:text-white">{{ errorLogsCount() }}</div>
                     <div class="text-xs text-emerald-600 dark:text-emerald-500 mt-2">Systèmes opérationnels</div>
                  </div>
               </div>

               <!-- Global Alert Box -->
               <div class="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8">
                  <h3 class="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                     Annonce Globale (Push Notification)
                  </h3>
                  <div class="flex gap-4">
                     <textarea #broadcastMsg placeholder="Message à envoyer à tous les utilisateurs connectés..." class="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"></textarea>
                     <button (click)="sendBroadcast(broadcastMsg.value); broadcastMsg.value=''" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-lg font-medium">Envoyer</button>
                  </div>
               </div>
            </div>
         }

         <!-- 7. SCANS ICE TAB -->
         @if (activeTab() === 'scans') {
            <div class="p-6 h-full flex flex-col">
               <div class="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
                  <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50 relative z-10 shrink-0">
                     <div class="relative w-full sm:w-96">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" [ngModel]="scanSearchTerm()" (ngModelChange)="scanSearchTerm.set($event)" placeholder="Chercher un client, garage, téléphone..." class="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                     </div>
                  </div>
                  
                  <div class="flex-1 overflow-y-auto">
                     <table class="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-medium text-slate-500 dark:text-slate-400 sticky top-0 z-20">
                           <tr>
                              <th class="px-6 py-4">Date du Scan</th>
                              <th class="px-6 py-4">Client App ICE</th>
                              <th class="px-6 py-4">Scanné par</th>
                           </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 relative z-10">
                           @for (scan of filteredScans(); track scan.id) {
                              <tr class="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-slate-900 dark:text-white font-medium">{{ scan.timestamp | date:'dd/MM/yyyy' }}</div>
                                    <div class="text-[10px] text-slate-400">{{ scan.timestamp | date:'HH:mm:ss' }}</div>
                                 </td>
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="font-bold text-slate-900 dark:text-white">{{ scan.scannedUserName }}</div>
                                    <div class="text-slate-500 text-xs">{{ scan.scannedUserPhone }}</div>
                                 </td>
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center gap-2">
                                       <span class="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs">{{ scan.scannerName.charAt(0) }}</span>
                                       <div>
                                          <div class="text-slate-900 dark:text-white font-medium text-xs">{{ scan.scannerName }}</div>
                                          <div class="text-[10px] text-slate-500">{{ scan.scannerTenantId === 'SUPER_ADMIN' ? 'Admin ICE' : getTenantName(scan.scannerTenantId) }}</div>
                                       </div>
                                    </div>
                                 </td>
                              </tr>
                           }
                           @if (filteredScans().length === 0) {
                              <tr>
                                 <td colspan="3" class="px-6 py-8 text-center text-slate-500">Aucun scan trouvé.</td>
                              </tr>
                           }
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         }

         <!-- 10. ICE MOBILE USERS TAB -->
         @if (activeTab() === 'customers') {
            <div class="p-6 h-full flex flex-col">
               <div class="flex justify-between items-center mb-6">
                  <div>
                     <h2 class="text-xl font-bold text-slate-900 dark:text-white">Base Automobilistes Inscrits</h2>
                     <p class="text-sm text-slate-500">Liste des particuliers ayant créé un compte via l'Application Mobile ICE.</p>
                  </div>
               </div>
               
               <div class="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
                  <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50 relative z-10 shrink-0">
                     <div class="relative w-full sm:w-96">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" [ngModel]="mobileUsersSearchTerm()" (ngModelChange)="mobileUsersSearchTerm.set($event)" placeholder="Rechercher par nom, téléphone, email..." class="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                     </div>
                  </div>
                  
                  <div class="flex-1 overflow-y-auto">
                     <table class="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-medium text-slate-500 dark:text-slate-400 sticky top-0 z-20">
                           <tr>
                              <th class="px-6 py-4">Client</th>
                              <th class="px-6 py-4">Contact</th>
                              <th class="px-6 py-4">Localisation</th>
                              <th class="px-6 py-4 text-center">Flotte (Véhicules)</th>
                           </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 relative z-10">
                           @for (user of mobileUsers(); track user.id) {
                              <tr class="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                 <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                       <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0">{{ (user.firstName.charAt(0) + (user.lastName ? user.lastName.charAt(0) : '')).toUpperCase() }}</span>
                                       <div>
                                          <div class="font-bold text-slate-900 dark:text-white">{{ user.firstName }} {{ user.lastName }}</div>
                                          <div class="text-[10px] text-slate-400 mt-0.5" title="ID d'inscription unique">ID: {{ user.id.substring(0,8) }}</div>
                                       </div>
                                    </div>
                                 </td>
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-slate-900 dark:text-white font-medium">{{ user.phone }}</div>
                                    <div class="text-xs text-slate-500">{{ user.email || 'Non renseigné' }}</div>
                                 </td>
                                 <td class="px-6 py-4">
                                    <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                       <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                       <span class="font-medium">{{ user.address?.city || 'Inconnue' }}</span>
                                    </div>
                                    <div class="text-[10px] text-slate-500 mt-0.5 ml-5 line-clamp-1" [title]="user.address?.street">{{ user.address?.street || 'Adresse non renseignée' }}</div>
                                 </td>
                                 <td class="px-6 py-4 text-center">
                                    <span class="inline-flex items-center justify-center h-6 w-8 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs" [class.bg-emerald-100]="user.vehicleCount > 0" [class.text-emerald-700]="user.vehicleCount > 0" [class.dark:bg-emerald-900/30]="user.vehicleCount > 0" [class.dark:text-emerald-400]="user.vehicleCount > 0">
                                       {{ user.vehicleCount }}
                                    </span>
                                 </td>
                              </tr>
                           }
                           @if(mobileUsers().length === 0) {
                              <tr><td colspan="4" class="px-6 py-12 text-center text-slate-500">
                                 <div class="flex flex-col items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    <span class="font-medium text-slate-400">Aucun automobiliste trouvé.</span>
                                 </div>
                              </td></tr>
                           }
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         }

         <!-- 8. ADMIN MANAGEMENT TAB (ROOT ONLY) -->
         @if (activeTab() === 'admins') {
            <div class="p-6 h-full flex flex-col">
               <div class="flex justify-between items-center mb-6">
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">Gestion des Administrateurs</h2>
                  <button (click)="openAdminModal()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                     Nouvel Administrateur
                  </button>
               </div>
               
               <div class="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
                  <div class="flex-1 overflow-y-auto">
                     <table class="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-medium text-slate-500 dark:text-slate-400 sticky top-0 z-20">
                           <tr>
                              <th class="px-6 py-4">Administrateur</th>
                              <th class="px-6 py-4">Rôle</th>
                              <th class="px-6 py-4">Permissions (Déléguées)</th>
                              <th class="px-6 py-4 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 relative z-10">
                           @for (admin of dataService.admins(); track admin.id) {
                              <tr class="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                 <td class="px-6 py-4">
                                    <div class="font-bold text-slate-900 dark:text-white">{{ admin.firstName }} {{ admin.lastName }}</div>
                                    <div class="text-xs text-slate-500">{{ admin.email }}</div>
                                 </td>
                                 <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs font-bold rounded" [ngClass]="admin.role === 'Root' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'">
                                       {{ admin.role }}
                                    </span>
                                 </td>
                                 <td class="px-6 py-4">
                                    <div class="flex flex-wrap gap-1">
                                       @if (!admin.superAdminPerms || admin.superAdminPerms.length === 0) {
                                          <span class="text-xs text-slate-400 italic">Aucune / Accès Basique</span>
                                       }
                                       @for (perm of admin.superAdminPerms; track perm) {
                                          <span class="px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">{{ perm }}</span>
                                       }
                                    </div>
                                 </td>
                                 <td class="px-6 py-4 text-right">
                                    @if(admin.role !== 'Root') {
                                       <button (click)="openAdminModal(admin)" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-xs">Modifier</button>
                                    } @else {
                                       <span class="text-slate-400 text-xs italic">Verrouillé</span>
                                    }
                                 </td>
                              </tr>
                           }
                           @if(dataService.admins().length === 0) {
                              <tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">Aucun administrateur trouvé.</td></tr>
                           }
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         }

         <!-- 9. AUDIT LOGS TAB (ROOT ONLY) -->
         @if (activeTab() === 'audit') {
            <div class="p-6 h-full flex flex-col">
               <div class="flex justify-between items-center mb-6">
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">Journal d'Audit (Traçabilité)</h2>
                  <p class="text-sm text-slate-500">Historique des actions critiques effectuées par les administrateurs.</p>
               </div>
               
               <div class="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
                  <div class="flex-1 overflow-y-auto">
                     <table class="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-medium text-slate-500 dark:text-slate-400 sticky top-0 z-20">
                           <tr>
                              <th class="px-6 py-4">Date</th>
                              <th class="px-6 py-4">Administrateur</th>
                              <th class="px-6 py-4">Action</th>
                              <th class="px-6 py-4">Détails</th>
                           </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 relative z-10">
                           @for (log of auditLogs(); track log.id) {
                              <tr class="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="font-medium text-slate-900 dark:text-white">{{ log.createdAt | date:'dd/MM/yyyy' }}</div>
                                    <div class="text-[10px] text-slate-500">{{ log.createdAt | date:'HH:mm:ss' }}</div>
                                 </td>
                                 <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">{{ log.adminName }}</td>
                                 <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-[10px] font-bold uppercase rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">{{ log.action }}</span>
                                 </td>
                                 <td class="px-6 py-4 text-xs">{{ log.details || '-' }}</td>
                              </tr>
                           }
                           @if(auditLogs().length === 0) {
                              <tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">Aucune activité récente.</td></tr>
                           }
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         }

         <!-- 2. PRO DEVIS AUTO TAB (MODERATION) -->
         @if (activeTab() === 'moderation') {
             <div class="flex flex-col h-full">
                <!-- Sub Tabs Navigation -->
                <div class="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-x-auto">
                   <button (click)="moderationFilter.set('MODERATE')" [class.border-indigo-500]="moderationFilter() === 'MODERATE'" [class.text-indigo-600]="moderationFilter() === 'MODERATE'" [class.dark:text-indigo-400]="moderationFilter() === 'MODERATE'" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
                      À Modérer ({{ countByFilter('MODERATE') }})
                   </button>
                   <button (click)="moderationFilter.set('VALIDATE')" [class.border-indigo-500]="moderationFilter() === 'VALIDATE'" [class.text-indigo-600]="moderationFilter() === 'VALIDATE'" [class.dark:text-indigo-400]="moderationFilter() === 'VALIDATE'" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
                      En Validation ({{ countByFilter('VALIDATE') }})
                   </button>
                   <button (click)="moderationFilter.set('TRACKING')" [class.border-indigo-500]="moderationFilter() === 'TRACKING'" [class.text-indigo-600]="moderationFilter() === 'TRACKING'" [class.dark:text-indigo-400]="moderationFilter() === 'TRACKING'" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
                      Suivi Travaux
                   </button>
                   <button (click)="moderationFilter.set('REJECTED')" [class.border-indigo-500]="moderationFilter() === 'REJECTED'" [class.text-indigo-600]="moderationFilter() === 'REJECTED'" [class.dark:text-indigo-400]="moderationFilter() === 'REJECTED'" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
                      Rejetés ({{ countByFilter('REJECTED') }})
                   </button>
                   <button (click)="moderationFilter.set('DIRECT')" [class.border-indigo-500]="moderationFilter() === 'DIRECT'" [class.text-indigo-600]="moderationFilter() === 'DIRECT'" [class.dark:text-indigo-400]="moderationFilter() === 'DIRECT'" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
                      Demandes Directes ({{ countByFilter('DIRECT') }})
                   </button>
                   <button (click)="moderationFilter.set('HISTORY')" [class.border-indigo-500]="moderationFilter() === 'HISTORY'" [class.text-indigo-600]="moderationFilter() === 'HISTORY'" [class.dark:text-indigo-400]="moderationFilter() === 'HISTORY'" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
                      Historique
                   </button>
                </div>

                <!-- Search Bar -->
                <div class="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                   <div class="relative max-w-md">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <input type="text" [ngModel]="moderationSearchTerm()" (ngModelChange)="moderationSearchTerm.set($event)" placeholder="Rechercher par Réf, Nom ou Téléphone..." class="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm">
                      @if(moderationSearchTerm()) {
                         <button (click)="moderationSearchTerm.set('')" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                      }
                   </div>
                </div>

                <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
                   
                   <!-- VIEW: TO MODERATE & DIRECT REQUESTS -->
                   @if (moderationFilter() === 'MODERATE' || moderationFilter() === 'DIRECT') {
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         @for (req of filteredRequests(); track req.id) {
                            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
                               <div class="flex justify-between items-center">
                                  <div class="flex gap-2 items-center">
                                     <span class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] px-2 py-1 rounded font-bold uppercase border border-indigo-200 dark:border-indigo-800">{{ req.locationCity }}</span>
                                     @if (req.isDirectRequest) {
                                        <span class="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-1 rounded font-bold uppercase border border-amber-200 dark:border-amber-800">Demande Directe (Scan)</span>
                                     }
                                  </div>
                                  <span class="text-xs text-slate-500 shrink-0">{{ req.date | date:'dd/MM/yyyy' }}</span>
                               </div>
                               <div class="flex items-center gap-2 mb-1">
                                  <h3 class="font-bold text-slate-900 dark:text-white text-lg leading-none">{{ req.vehicleBrand }} {{ req.vehicleModel }}</h3>
                                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Réf: {{ getRef(req.id) }}</span>
                               </div>
                               
                               <div class="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" (click)="openRequestDetails(req)">
                                  <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Demande (Voir fiche) :</span>
                                  <p class="text-sm text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap max-h-20 overflow-hidden text-ellipsis">"{{ req.description }}"</p>
                               </div>

                               <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                  <div class="flex justify-between items-center">
                                     <div>
                                        <div class="text-xs font-bold text-slate-400 uppercase mb-1">Automobiliste</div>
                                        <div class="text-sm text-slate-800 dark:text-slate-200 font-medium">{{ req.motoristName }}</div>
                                     </div>
                                     <!-- Detail Eye Button -->
                                     <button (click)="openRequestDetails(req)" class="text-slate-400 hover:text-indigo-500 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Voir Fiche Complète">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                     </button>
                                  </div>
                               </div>
                               <div class="mt-4 grid grid-cols-2 gap-3">
                                  <button (click)="openRejectModal(req)" class="px-3 py-2 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors">Refuser</button>
                                  @if (req.isDirectRequest) {
                                     @if (req.status === 'QUOTE_SUBMITTED' || req.garageQuoteId || (req.proposedQuotes && req.proposedQuotes.length > 0)) {
                                        <button (click)="openQuotePreview(req)" class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Valider Devis</button>
                                     } @else {
                                        <button (click)="openRequestDetails(req)" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors">Voir Fiche</button>
                                     }
                                  } @else {
                                     <button (click)="openRequestModal(req)" class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Dispatcher</button>
                                  }
                               </div>
                            </div>
                         }
                         @if(filteredRequests().length === 0) { <div class="col-span-full text-center py-12 text-slate-500">Aucune demande à modérer.</div> }
                      </div>
                   }

                   <!-- VIEW: VALIDATE & HISTORY & REJECTED (Table View) -->
                   @if (moderationFilter() === 'VALIDATE' || moderationFilter() === 'HISTORY' || moderationFilter() === 'REJECTED') {
                      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                         <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500">
                               <tr>
                                  <th class="px-6 py-3">Date</th>
                                  <th class="px-6 py-3">Automobiliste</th>
                                  <th class="px-6 py-3 w-1/3">Garages / Avis</th>
                                  <th class="px-6 py-3 text-center">Statut</th>
                                  <th class="px-6 py-3 text-right">Actions</th>
                               </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                               @for (req of filteredRequests(); track req.id) {
                                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                     <td class="px-6 py-4 text-slate-500">{{ req.date | date:'dd/MM/yy' }}</td>
                                     <td class="px-6 py-4">
                                        <div class="font-medium text-slate-900 dark:text-white">{{ req.motoristName }}</div>
                                        <div class="text-xs text-slate-500">{{ req.locationCity }}</div>
                                     </td>
                                     <td class="px-6 py-4">
                                        <div class="font-bold text-slate-900 dark:text-white">{{ req.vehicleBrand }} {{ req.vehicleModel }}</div>
                                        <div class="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0 inline-block mt-1 border border-slate-200 dark:border-slate-700">Réf: {{ getRef(req.id) }}</div>
                                     </td>
                                     <td class="px-6 py-4 text-center">
                                        @if ((req.status === 'CONVERTED' || req.status === 'COMPLETED' || req.acceptedQuoteId) && getWinnerTenantName(req)) {
                                           <div class="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                              Garage Choisi : {{ getWinnerTenantName(req) }}
                                           </div>
                                        }
                                        <div class="text-xs text-slate-600 dark:text-slate-400 whitespace-normal max-w-[250px]">
                                           <span class="font-bold text-slate-500">Sollicités :</span> {{ getTenantNames(req.assignedTenantIds) }}
                                        </div>
                                        @if (req.clientRating) {
                                           <div class="mt-2 text-[10px] text-amber-500 font-bold flex flex-col gap-0.5 bg-amber-50 dark:bg-amber-900/10 p-1.5 rounded border border-amber-100 dark:border-amber-800">
                                              <span>★ {{ req.clientRating }} / 5</span>
                                              @if (req.clientReview) {
                                                 <span class="text-slate-500 dark:text-slate-400 font-normal italic">"{{ req.clientReview }}"</span>
                                              }
                                           </div>
                                        }
                                     </td>
                                     <td class="px-6 py-4 text-center">
                                        @if(moderationFilter() === 'REJECTED' || req.status === 'REJECTED') { <span class="text-red-500 font-bold text-xs uppercase">Refusé</span> }
                                        @else if(req.status === 'CANCELED') { <span class="text-slate-500 font-bold text-xs uppercase" title="Annulé par l'automobiliste">Annulé (Client)</span> }
                                        @else if(req.status === 'QUOTE_SUBMITTED') { <span class="text-amber-500 font-bold text-xs uppercase">Devis Reçu</span> }
                                        @else if(req.status === 'DISPATCHED') { <span class="text-blue-500 font-bold text-xs uppercase">En attente</span> }
                                        @else if(req.status === 'COMPLETED') { <span class="text-emerald-500 font-bold text-xs uppercase">Devis Envoyé</span> }
                                        @else if(req.status === 'CONVERTED') { <span class="text-green-600 font-bold text-xs uppercase">Converti</span> }
                                     </td>
                                     <td class="px-6 py-4 text-right">
                                        <div class="flex justify-end items-center gap-2 relative">
                                           <button (click)="openRequestDetails(req)" class="text-slate-400 hover:text-indigo-500 p-1" title="Voir Fiche Complète">
                                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                           </button>
                                           @if (req.garageQuoteId || req.acceptedQuoteId || (req.proposedQuotes && req.proposedQuotes.length > 0)) {
                                              <div class="relative">
                                                 <button (click)="openQuotePreview(req)" class="text-indigo-600 hover:underline text-xs font-bold px-2">Examiner Devis</button>
                                                 @if (req.hasUnreadMessagesForAdmin) {
                                                    <span class="absolute top-0 right-0 flex h-2 w-2">
                                                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                      <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                 }
                                              </div>
                                           }
                                        </div>
                                     </td>
                                  </tr>
                               }
                               @if(filteredRequests().length === 0) { <tr><td colspan="6" class="p-8 text-center text-slate-500">Aucun dossier dans cette catégorie.</td></tr> }
                            </tbody>
                         </table>
                      </div>
                   }

                   <!-- VIEW: TRACKING (Converted/In Progress) -->
                   @if (moderationFilter() === 'TRACKING') {
                      <div class="space-y-4">
                         @for (work of trackedWorks(); track work.req.id) {
                            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center gap-6">
                               <div class="flex-1 w-full">
                                  <div class="flex justify-between items-start mb-2">
                                     <div>
                                        <div class="font-bold text-lg text-slate-900 dark:text-white">{{ work.req.vehicleBrand }} {{ work.req.vehicleModel }}</div>
                                        <div class="text-sm text-slate-500">{{ work.req.motoristName }} • {{ work.req.locationCity }}</div>
                                        <div class="relative inline-block mt-1">
                                           <button (click)="openQuotePreview(work.req)" class="text-xs text-indigo-600 hover:text-indigo-700 font-bold underline flex items-center gap-1">
                                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                              Revoir le devis
                                           </button>
                                           @if (work.req.hasUnreadMessagesForAdmin) {
                                              <span class="absolute -top-1 -right-2 flex h-2 w-2">
                                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                              </span>
                                           }
                                        </div>
                                     </div>
                                     <div class="text-right">
                                        <div class="text-sm font-bold text-indigo-600 dark:text-indigo-400">{{ formatMoney(work.totalAmount) }}</div>
                                        <div class="text-xs text-slate-400">Montant Travaux</div>
                                     </div>
                                  </div>
                                  
                                  <!-- Progress Bar -->
                                  <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mb-1">
                                     <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" [style.width.%]="work.progress"></div>
                                  </div>
                                  <div class="flex justify-between text-xs font-medium mb-3">
                                     <span class="text-slate-500">Progression : {{ work.progress }}%</span>
                                     <span [class]="getStatusColor(work.repairStatus)">{{ work.repairStatus || 'En attente' }}</span>
                                  </div>

                                  <!-- Appointment Info if Scheduled -->
                                  @if(work.repairDate) {
                                     <div class="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span class="font-bold uppercase text-xs">Rendez-vous :</span> {{ work.repairDate | date:'dd/MM/yyyy HH:mm' }}
                                     </div>
                                  }

                                  <!-- Details: Garages & Reviews -->
                                  <div class="text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                     @if (getWinnerTenantName(work.req)) {
                                        <div class="mb-1 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                           <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                           Garage Retenu : {{ getWinnerTenantName(work.req) }}
                                        </div>
                                     }
                                     <div>
                                        <span class="font-bold text-slate-700 dark:text-slate-300">Sollicités :</span> {{ getTenantNames(work.req.assignedTenantIds) }}
                                     </div>
                                     @if (work.req.clientRating) {
                                        <div class="mt-2 text-amber-600 dark:text-amber-400">
                                           <span class="font-bold">Avis Client (★ {{ work.req.clientRating }}) :</span> <span class="italic text-slate-600 dark:text-slate-400">"{{ work.req.clientReview }}"</span>
                                        </div>
                                     }
                                  </div>
                               </div>
                               
                               <div class="shrink-0 flex gap-2">
                                  <!-- View Full Details Button -->
                                  <button (click)="openRequestDetails(work.req)" class="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                     Détails
                                  </button>
                               </div>
                            </div>
                         }
                         @if(trackedWorks().length === 0) { <div class="text-center py-12 text-slate-500">Aucun travail en cours de suivi.</div> }
                      </div>
                   }
                </div>
             </div>
         }

         <!-- 3. TENANTS TAB -->
         @if (activeTab() === 'tenants') {
            <div class="flex flex-col h-full">
               <div class="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-4 items-center justify-between">
                  <div class="flex gap-2 w-full md:w-auto flex-wrap">
                     <input type="text" [value]="tenantSearchTerm()" (input)="updateTenantSearch($event)" placeholder="Rechercher..." class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white w-full md:w-48">
                     
                     <select [value]="tenantCityFilter()" (change)="updateTenantCityFilter($event)" class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white">
                        <option value="">Toutes Villes</option>
                        @for(city of cities; track city) { <option [value]="city">{{ city }}</option> }
                     </select>

                     <select [value]="tenantStatusFilter()" (change)="tenantStatusFilter.set($any($event.target).value)" class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white">
                        <option value="">Tous les statuts</option>
                        <option value="Active">Actifs</option>
                        <option value="Suspended">Suspendus</option>
                     </select>
                  </div>
                  @if (canManageTenants()) {
                     <button (click)="openTenantModal()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        Ajouter Garage
                     </button>
                  }
               </div>
               <div class="flex-1 overflow-y-auto">
                  <table class="w-full text-sm text-left">
                     <thead class="bg-slate-100 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 uppercase sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                           <th class="px-6 py-3">Garage</th>
                           <th class="px-6 py-3">Admin</th>
                           <th class="px-6 py-3">Plan</th>
                           <th class="px-6 py-3 text-center">Localisation</th>
                           <th class="px-6 py-3 text-center">Statut</th>
                           <th class="px-6 py-3 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        @for (t of filteredTenants(); track t.id) {
                           <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                              <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">{{ t.name }}</td>
                              <td class="px-6 py-4 text-slate-600 dark:text-slate-400">{{ t.adminEmail }}</td>
                              <td class="px-6 py-4">
                                 @if (t.plan === 'ICE Full') {
                                    <span class="px-2 py-1 font-bold rounded text-xs border bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 shadow-sm"><span class="text-[10px]">💎</span> {{ t.plan }}</span>
                                 } @else {
                                    <span class="px-2 py-1 rounded text-xs border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{{ t.plan }}</span>
                                 }
                              </td>
                              <td class="px-6 py-4 text-center">
                                 <div class="text-xs text-slate-600 dark:text-slate-300">{{ t.city }}</div>
                                 <div class="text-[10px] text-slate-400">{{ t.commune || '-' }}</div>
                              </td>
                              <td class="px-6 py-4 text-center">
                                 <div class="flex flex-col items-center gap-1">
                                    @if (t.status === 'Active') {
                                       <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">Actif</span>
                                    } @else {
                                       <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">Suspendu</span>
                                    }
                                    @if (t.rating) {
                                       <div class="flex text-[10px] text-amber-400 items-center bg-amber-50 dark:bg-amber-900/10 px-1 rounded border border-amber-100 dark:border-amber-900/30">
                                          <span>★</span> <span class="text-amber-600 dark:text-amber-500 font-bold ml-0.5">{{ t.rating.toFixed(1) }}</span> <span class="text-slate-400 ml-1">({{ t.reviewCount }})</span>
                                       </div>
                                    }
                                 </div>
                              </td>
                              <td class="px-6 py-4 text-right">
                                 <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    @if (canManageTenants()) {
                                       <button (click)="impersonate(t)" class="p-1 text-slate-400 hover:text-indigo-500" title="Se connecter en tant que"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg></button>
                                       <button (click)="openEditTenant(t)" class="p-1 text-slate-400 hover:text-blue-500" title="Modifier"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                       <button (click)="toggleTenantStatus(t)" class="p-1 text-slate-400 hover:text-red-500" title="Suspendre/Activer"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
                                    }
                                 </div>
                              </td>
                           </tr>
                        }
                     </tbody>
                  </table>
               </div>
            </div>
         }

         <!-- 4. LEADS TAB -->
         @if (activeTab() === 'leads') {
            <div class="flex flex-col h-full p-6">
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                   <table class="w-full text-sm text-left">
                      <thead class="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500">
                         <tr>
                            <th class="px-6 py-3">Garage Prospect</th>
                            <th class="px-6 py-3">Contact</th>
                            <th class="px-6 py-3">Plan Intérêt</th>
                            <th class="px-6 py-3">Date</th>
                            <th class="px-6 py-3 text-center">Statut</th>
                         </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                         @for(lead of dataService.leads(); track lead.id) {
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                               <td class="px-6 py-4 font-bold text-slate-900 dark:text-white">{{ lead.garageName }}</td>
                               <td class="px-6 py-4">
                                  <div class="text-sm text-slate-700 dark:text-slate-300">{{ lead.contactName }}</div>
                                  <div class="text-xs text-slate-500">{{ lead.email }} • {{ lead.phone }}</div>
                               </td>
                               <td class="px-6 py-4">
                                  <span class="px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{{ lead.planInterest }}</span>
                               </td>
                               <td class="px-6 py-4 text-slate-500">{{ lead.date | date:'dd/MM/yyyy' }}</td>
                               <td class="px-6 py-4 text-center">
                                  <span class="px-2 py-1 rounded-full text-xs font-bold" 
                                     [class.bg-blue-100]="lead.status === 'New'" [class.text-blue-700]="lead.status === 'New'"
                                     [class.bg-amber-100]="lead.status === 'Contacted'" [class.text-amber-700]="lead.status === 'Contacted'"
                                     [class.bg-emerald-100]="lead.status === 'Converted'" [class.text-emerald-700]="lead.status === 'Converted'">
                                     {{ lead.status }}
                                  </span>
                               </td>
                            </tr>
                         }
                      </tbody>
                   </table>
                </div>
            </div>
         }

         <!-- 5. CONFIG TAB -->
         @if (activeTab() === 'config') {
            <div class="p-6 overflow-y-auto">
               <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="max-w-4xl space-y-8">
                  
                  <!-- Platform Identity -->
                  <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                     <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Identité Plateforme</h3>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom de l'Application</label>
                           <input formControlName="appName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
                        </div>
                        <div>
                           <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom Super Admin (Affichage)</label>
                           <input formControlName="superAdminName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
                        </div>
                     </div>
                  </div>

                  <!-- Logos -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase">Logo Application (Public)</h3>
                        <div class="flex items-center gap-4">
                           <div class="w-24 h-24 rounded-lg bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative overflow-hidden group">
                              @if(appLogoPreview()) {
                                 <img [src]="appLogoPreview()" class="w-full h-full object-contain p-2">
                                 <button type="button" (click)="removeAppLogo()" class="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold">Supprimer</button>
                              } @else {
                                 <span class="text-xs text-slate-400">Aucun</span>
                              }
                              <input type="file" (change)="onAppLogoSelected($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer">
                           </div>
                           <div class="text-xs text-slate-500">Affiché sur la page de connexion et le menu principal.</div>
                        </div>
                     </div>

                     <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase">Logo Super Admin</h3>
                        <div class="flex items-center gap-4">
                           <div class="w-24 h-24 rounded-lg bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative overflow-hidden group">
                              @if(adminLogoPreview()) {
                                 <img [src]="adminLogoPreview()" class="w-full h-full object-contain p-2">
                                 <button type="button" (click)="removeAdminLogo()" class="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold">Supprimer</button>
                              } @else {
                                 <span class="text-xs text-slate-400">Aucun</span>
                              }
                              <input type="file" (change)="onAdminLogoSelected($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer">
                           </div>
                           <div class="text-xs text-slate-500">Affiché dans l'interface d'administration.</div>
                        </div>
                     </div>
                  </div>

                  <!-- System Control -->
                  <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                     <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Contrôle Système</h3>
                     <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" formControlName="maintenanceMode" class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 dark:bg-slate-900">
                        <div>
                           <span class="block text-sm font-medium text-slate-900 dark:text-white">Mode Maintenance</span>
                           <span class="block text-xs text-slate-500">Empêche les connexions des garages (sauf admin).</span>
                        </div>
                     </label>
                  </div>

                  <div class="flex justify-end">
                     <button type="submit" [disabled]="configForm.invalid" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-colors">
                        Enregistrer la configuration
                     </button>
                  </div>
               </form>
            </div>
         }

         <!-- 6. LOGS TAB -->
         @if (activeTab() === 'logs') {
            <div class="flex flex-col h-full">
               <div class="flex-1 overflow-y-auto">
                  <table class="w-full text-sm text-left">
                     <thead class="bg-slate-100 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 uppercase sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                           <th class="px-6 py-3">Date</th>
                           <th class="px-6 py-3">Niveau</th>
                           <th class="px-6 py-3 w-1/2">Message</th>
                           <th class="px-6 py-3">Utilisateur</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        @for(log of dataService.systemLogs(); track log.id) {
                           <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 font-mono text-xs">
                              <td class="px-6 py-3 text-slate-500 whitespace-nowrap">{{ log.date | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                              <td class="px-6 py-3">
                                 <span class="px-2 py-0.5 rounded font-bold"
                                    [class.bg-blue-100]="log.level==='INFO'" [class.text-blue-700]="log.level==='INFO'"
                                    [class.bg-amber-100]="log.level==='WARNING'" [class.text-amber-700]="log.level==='WARNING'"
                                    [class.bg-red-100]="log.level==='ERROR'" [class.text-red-700]="log.level==='ERROR'"
                                    [class.bg-purple-100]="log.level==='SECURITY'" [class.text-purple-700]="log.level==='SECURITY'">
                                    {{ log.level }}
                                 </span>
                              </td>
                              <td class="px-6 py-3 text-slate-700 dark:text-slate-300">{{ log.message }}</td>
                              <td class="px-6 py-3 text-slate-500">{{ log.user || 'System' }}</td>
                           </tr>
                        }
                     </tbody>
                  </table>
               </div>
            </div>
         }
      </div>
    </div>

    <!-- MODALS -->
    <!-- QUOTE PREVIEW MODAL -->
    @if (showQuotePreviewModal() && selectedRequestForAction(); as req) {
       @let quote = getGarageQuote(selectedQuotePreviewId() || req.garageQuoteId || req.proposedQuotes?.[0]);
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <span>Examiner la proposition de {{ getTenantName(quote?.tenantId) }}</span>
                <button (click)="closeQuotePreview()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <div class="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
                @if (req.proposedQuotes && req.proposedQuotes.length > 0) {
                   @let visibleQuotes = getVisibleQuotes(req);
                   @if (visibleQuotes.length > 1 || (moderationFilter() === 'REJECTED' && req.status !== 'REJECTED')) {
                      <div class="mb-4 flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
                         @for (qid of visibleQuotes; track qid) {
                         @let qInfo = getGarageQuote(qid);
                         <button (click)="selectedQuotePreviewId.set(qid)" 
                                 [class.border-indigo-500]="selectedQuotePreviewId() === qid"
                                 [class.bg-indigo-50]="selectedQuotePreviewId() === qid"
                                 [class.text-indigo-700]="selectedQuotePreviewId() === qid"
                                 class="px-4 py-2 border-2 border-transparent rounded-lg text-sm font-medium transition-colors whitespace-nowrap outline-none">
                            Devis de: {{ getTenantName(qInfo?.tenantId) }}
                         </button>
                      }
                   </div>
                   }
                }

                @if (quote) {
                   <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      @if (req.acceptedQuoteId === quote.id) {
                         <div class="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-lg font-bold text-xs uppercase shadow">
                            Devis Choisi par le Client
                         </div>
                      }
                      
                      <!-- Header -->
                      <div class="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 mt-2">
                         <div>
                            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Garage Émetteur</div>
                            <h3 class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ getTenantName(quote.tenantId) }}</h3>
                            @if ((req.status === 'CONVERTED' || req.status === 'COMPLETED') && req.repairOrderId) {
                               <div class="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Ordre de Réparation: <span class="font-bold text-slate-900 dark:text-white">OR #{{ req.repairOrderId.substring(0, 6) }}</span>
                               </div>
                            }
                         </div>
                          <div class="text-right">
                             <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Devis N°</div>
                             <div class="font-mono font-bold text-slate-900 dark:text-white">{{ quote.number }}</div>
                             <div class="text-xs text-slate-500 mb-2">{{ quote.date | date:'dd/MM/yyyy' }}</div>
                             
                             @if (quote.restitutionDate) {
                                <div class="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-0.5">Restitution prévue</div>
                                <div class="text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded inline-block">{{ quote.restitutionDate | date:'dd/MM/yyyy' }}</div>
                             }
                          </div>
                       </div>

                      <!-- Items -->
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

                      <!-- Totals -->
                      <div class="flex justify-end">
                         <div class="w-1/2 md:w-1/3 space-y-2">
                            <div class="flex justify-between text-sm text-slate-500">
                               <span>Total HT</span>
                               <span>{{ formatMoney(quote.totalHT) }}</span>
                            </div>
                            <div class="flex justify-between text-sm text-slate-500">
                               <span>TVA</span>
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
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p>Devis introuvable ou non généré.</p>
                   </div>
                }
             </div>

                 <!-- DISCUSSION & REVISION DES DEVIS -->
                 <div class="mt-6 mx-6 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div class="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                       <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          Discussion & Demande de Révision
                       </h4>
                       <label class="flex items-center gap-3 cursor-pointer group">
                          <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                             Autoriser le garage à modifier
                          </span>
                           <div class="relative flex items-center">
                              <input type="checkbox" [checked]="!!req.unlockedTenantIds?.includes(quote?.tenantId || '')" (change)="toggleQuoteUnlock(req.id, quote?.tenantId, $event)" class="sr-only peer">
                              <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/50 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500 shadow-inner"></div>
                           </div>
                       </label>
                    </div>
                    
                    <div class="p-4 bg-slate-50 dark:bg-slate-950/30 max-h-64 overflow-y-auto flex flex-col gap-3">
                       @let filteredMessages = getFilteredMessages(req.messages, quote?.tenantId);
                       @if (filteredMessages.length === 0) {
                          <div class="text-center text-slate-400 text-xs py-4 italic">Aucun message échangé avec ce garage pour le moment.</div>
                       } @else {
                          @for (msg of filteredMessages; track msg.id) {
                             <div class="flex flex-col max-w-[85%]" [ngClass]="msg.senderId === 'SUPERADMIN' ? 'self-end items-end' : 'self-start items-start'">
                                <span class="text-[10px] text-slate-500 mb-0.5 ml-1 mr-1">{{ msg.senderName }} • {{ msg.date | date:'dd/MM HH:mm' }}</span>
                                <div class="px-3 py-2 rounded-lg text-sm" [ngClass]="msg.senderId === 'SUPERADMIN' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-none'">
                                   {{ msg.message }}
                                </div>
                             </div>
                          }
                       }
                    </div>

                    <div class="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                       <input type="text" [ngModel]="newQuoteMessage()" (ngModelChange)="newQuoteMessage.set($event)" (keyup.enter)="sendQuoteMessage(req.id, quote?.tenantId)" placeholder="Écrire au garage pour demander une révision..." class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" [disabled]="!quote">
                       <button (click)="sendQuoteMessage(req.id, quote?.tenantId)" [disabled]="!newQuoteMessage().trim() || !quote" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                          Envoyer
                       </button>
                    </div>
                 </div>

             <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap justify-between items-center gap-3 shrink-0">
                @if ((!quote && req.status !== 'REJECTED') || (quote && quote.status !== 'REFUSE' && quote.status !== 'ENVOYE' && quote.status !== 'ACCEPTE')) {
                   <button (click)="openRejectModal(req, quote?.id)" class="px-4 py-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors">{{ quote ? 'Refuser ce devis' : 'Refuser la demande' }}</button>
                } @else {
                   <div></div>
                }
                <div class="flex gap-3 ml-auto">
                   <button (click)="closeQuotePreview()" class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium transition-colors">Fermer</button>
                   @if (req.proposedQuotes && req.proposedQuotes.length > 1 && !getHasRefusedQuotes(req) && !getHasTransmittedOrAcceptedQuotes(req)) {
                      <button (click)="dataService.validateQuoteRequest(req.id); closeQuotePreview(); toastService.show('Tous les devis ont été transmis au client', 'success')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-transform active:scale-95">Tout Transmettre</button>
                   }
                   @if (quote && quote.status === 'REFUSE') {
                      <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">Devis Refusé ✕</div>
                   } @else if (quote && quote.status !== 'ENVOYE' && quote.status !== 'ACCEPTE') {
                      <button (click)="dataService.transmitQuoteToClient(req.id, quote.id); toastService.show('Devis transmis au client avec succès !', 'success')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-transform active:scale-95">Transmettre ce devis</button>
                   } @else if (quote && (quote.status === 'ENVOYE' || quote.status === 'ACCEPTE')) {
                      <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">Déjà transmis ✓</div>
                   }
                </div>
             </div>
          </div>
       </div>
    }

    <!-- REJECT MODAL -->
    @if (showRejectModal()) {
       <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
             <h3 class="font-bold text-lg mb-4 text-slate-900 dark:text-white">Motif du refus</h3>
             <textarea [ngModel]="rejectionReason()" (ngModelChange)="rejectionReason.set($event)" rows="4" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 mb-4 outline-none" placeholder="Expliquez pourquoi ce dossier ou ce devis est refusé..."></textarea>
             <div class="flex justify-end gap-3">
                <button (click)="closeRejectModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                <button (click)="confirmRejection()" [disabled]="!rejectionReason()" class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">Confirmer Refus</button>
             </div>
          </div>
       </div>
    }

    <!-- DISPATCH MODAL -->
    @if (showRequestModal() && selectedRequest(); as req) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center bg-white dark:bg-slate-900 shrink-0 rounded-t-xl">
                <span>Dispatcher la demande</span>
                <button (click)="closeRequestModal()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
                <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 mb-6">
                   <div class="flex items-center gap-2 mb-1">
                       <div class="font-bold text-slate-900 dark:text-white">{{ req.vehicleBrand }} {{ req.vehicleModel }}</div>
                       <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">Réf: {{ getRef(req.id) }}</span>
                    </div>
                   <div class="text-sm text-slate-500 italic mb-2">"{{ req.description }}"</div>
                   <div class="flex gap-2 text-xs mb-4">
                      <span class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">{{ req.locationCity }}</span>
                      @if(req.locationCommune) { <span class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{{ req.locationCommune }}</span> }
                   </div>

                   <!-- ADMIN DESCRIPTION OVERRIDE -->
                   <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                         Description Superadmin officielle (Optionnel)
                      </label>
                      <textarea
                         [ngModel]="dispatchAdminDescription()"
                         (ngModelChange)="dispatchAdminDescription.set($event)"
                         placeholder="Saisissez une description corrigée ou plus détaillée. C'est celle-ci qui sera envoyée aux garages au lieu de l'originale..."
                         class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                         rows="3"></textarea>
                   </div>
                </div>
                
                <div class="flex flex-col gap-3 mb-4 sticky top-0 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm z-10">
                   <h4 class="font-bold text-xs text-slate-500 uppercase tracking-wide">Filtres Garages</h4>
                   <div class="flex gap-2">
                      <input type="text" [value]="dispatchSearchTerm()" (input)="dispatchSearchTerm.set($any($event.target).value)" placeholder="Nom..." class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm">
                      <select [value]="dispatchCityFilter()" (change)="dispatchCityFilter.set($any($event.target).value); dispatchCommuneFilter.set('')" class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm">
                         <option value="">Toutes Villes</option>
                         @for(city of cities; track city) { <option [value]="city">{{ city }}</option> }
                      </select>
                      <select [value]="dispatchCommuneFilter()" (change)="dispatchCommuneFilter.set($any($event.target).value)" class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm" [disabled]="!dispatchCityFilter()">
                         <option value="">Toutes Communes</option>
                         @for(c of dispatchCommunes(); track c) { <option [value]="c">{{ c }}</option> }
                      </select>
                   </div>
                </div>
                <div class="space-y-2">
                   @for (t of filteredDispatchTenants(); track t.id) {
                      <label class="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                             [class.ring-2]="isTenantSelected(t.id)" [class.ring-indigo-500]="isTenantSelected(t.id)">
                         <input type="checkbox" [checked]="isTenantSelected(t.id)" (change)="toggleTenantSelection(t.id)" class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                         <div class="flex-1">
                            <div class="font-bold text-slate-900 dark:text-white">{{ t.name }}</div>
                            <div class="text-xs text-slate-500">{{ t.city }} {{ t.commune ? '- '+t.commune : '' }}</div>
                         </div>
                         @if(t.rating) {
                            <div class="text-amber-400 text-xs font-bold">★ {{ t.rating }}</div>
                         }
                      </label>
                   }
                   @if (filteredDispatchTenants().length === 0) {
                      <div class="text-center py-4 text-slate-500 text-sm">Aucun garage trouvé avec ces filtres.</div>
                   }
                </div>
             </div>
             <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0 rounded-b-xl">
                <button (click)="closeRequestModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                <button (click)="submitDispatch(req)" [disabled]="selectedDispatchTenants().length === 0" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg disabled:opacity-50 transition-all">
                   Envoyer à {{ selectedDispatchTenants().length }} garage(s)
                </button>
             </div>
          </div>
       </div>
    }

    <!-- REQUEST DETAIL MODAL -->
    @if (showRequestDetailModal() && selectedRequestDetail(); as req) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
             
             <!-- Header -->
             <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex justify-between items-start">
                <div>
                   <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-3">
                      Détail Demande
                       <span class="px-2 py-0.5 rounded text-[14px] font-bold font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 leading-none">Réf: {{ getRef(req.id) }}</span>
                       <span class="text-xs px-2 py-0.5 rounded-full border uppercase tracking-wide bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 mt-1 md:mt-0">
                          {{ req.status }}
                       </span>
                   </h2>
                   <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                      Reçue le {{ req.date | date:'dd/MM/yyyy à HH:mm' }}
                   </p>
                </div>
                <button (click)="closeRequestDetails()" class="text-slate-500 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 p-2 rounded-full transition-colors border border-slate-200 dark:border-slate-700">✕</button>
             </div>

             <!-- Body -->
             <div class="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                   <div class="space-y-4">
                      <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-2">Automobiliste</h3>
                      <div class="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-sm space-y-3">
                         <div class="flex justify-between"><span class="text-slate-500">Nom</span> <span class="font-bold text-slate-900 dark:text-white">{{ req.motoristName }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Téléphone</span> <span class="text-slate-900 dark:text-white font-mono">{{ req.motoristPhone }}</span></div>
                         @if(req.motoristEmail) { <div class="flex justify-between"><span class="text-slate-500">Email</span> <span class="text-slate-900 dark:text-white">{{ req.motoristEmail }}</span></div> }
                         <div class="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                            <span class="block text-xs text-slate-500 mb-1">Localisation</span>
                            <div class="font-bold text-slate-900 dark:text-white">{{ req.locationCity }} @if(req.locationCommune){ - {{req.locationCommune}} }</div>
                         </div>
                      </div>
                   </div>
                   <!-- ... -->
                   <div class="space-y-4">
                      <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-2">Véhicule</h3>
                      <div class="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-sm space-y-3">
                         <div class="flex justify-between"><span class="text-slate-500">Marque/Modèle</span> <span class="font-bold text-slate-900 dark:text-white">{{ req.vehicleBrand }} {{ req.vehicleModel }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Année</span> <span class="text-slate-900 dark:text-white">{{ req.vehicleYear }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Carburant</span> <span class="text-slate-900 dark:text-white">{{ req.fuel || '-' }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Kilométrage</span> <span class="text-slate-900 dark:text-white">{{ req.mileage ? req.mileage + ' km' : '-' }}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">VIN (Série)</span> <span class="text-slate-900 dark:text-white font-mono break-all">{{ req.vehicleVin || '-' }}</span></div>
                      </div>
                   </div>
                </div>
                <!-- ... -->
                <div class="mb-8">
                   <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1 mb-3">Panne / Demande</h3>
                   <!-- Diagnosis Details -->
                   <div class="mb-8">
                      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Panne Enregistrée</h3>
                      @if (req.adminDescription) {
                         <div class="mb-3">
                            <h4 class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Description (Corrigée par Superadmin)</h4>
                            <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 p-3 rounded-lg">
                               <p class="text-slate-800 dark:text-slate-200 italic whitespace-pre-wrap text-sm">"{{ req.adminDescription }}"</p>
                            </div>
                         </div>
                         <div>
                            <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description Initiale (Automobiliste)</h4>
                            <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                               <p class="text-slate-500 dark:text-slate-400 italic text-sm whitespace-pre-wrap">"{{ getCleanDescription(req.description) }}"</p>
                            </div>
                         </div>
                      } @else {
                         <div class="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30">
                            <p class="text-slate-800 dark:text-slate-200 italic whitespace-pre-wrap">"{{ getCleanDescription(req.description) }}"</p>
                         </div>
                      }
                   </div>
                   
                   @if (req.diagnosticHistory && req.diagnosticHistory.length > 0) {
                      <div class="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                         <div class="bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                            Diagnostic Détaillé
                         </div>
                         <div class="divide-y divide-slate-100 dark:divide-slate-800">
                            @for (step of req.diagnosticHistory; track $index) {
                               <div class="p-3 text-sm">
                                  <div class="text-slate-500 dark:text-slate-400 text-xs mb-1">{{ step.question }}</div>
                                  <div class="text-slate-900 dark:text-white font-medium">{{ step.answer }}</div>
                               </div>
                            }
                         </div>
                      </div>
                   }
                </div>

                <!-- Preferences Section (NEW) -->
                <div class="mb-8">
                   <h3 class="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1 mb-3">Préférences d'Intervention</h3>
                   <div class="grid grid-cols-2 gap-4">
                      
                      <!-- Desired Specific Date -->
                      <div class="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                         <span class="block text-xs text-slate-500 mb-1">Date préférentielle</span>
                         <span class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>📅</span> {{ (req.interventionDate | date:'dd/MM/yyyy') || 'Non précisé' }}
                         </span>
                      </div>

                      <!-- Removed Preferred Location card as it is no longer relevant -->
                   </div>
                </div>

                <!-- Photos -->
                @if (req.photos && req.photos.length > 0) {
                   <div class="mb-8">
                      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Photos Jointes ({{ req.photos.length }}) <span class="text-[10px] font-normal text-slate-400 normal-case">— cliquez pour agrandir</span></h3>
                      <div class="flex gap-4 overflow-x-auto pb-2">
                         @for (photo of req.photos; track $index) {
                            <div (click)="openLightbox(req.photos, $index)" class="relative h-32 w-32 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer group transition-all hover:ring-2 hover:ring-indigo-500 hover:shadow-lg">
                               <img [src]="photo" class="w-full h-full object-cover transition-transform group-hover:scale-105">
                               <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                               </div>
                            </div>
                         }
                      </div>
                   </div>
                }

                <!-- Status History / Context -->
                <div>
                   <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Contexte & Suivi</h3>
                   <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div class="flex items-center p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                         <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mr-3">1</div>
                         <div class="flex-1">
                            <div class="text-sm font-bold text-slate-900 dark:text-white">Création Demande</div>
                            <div class="text-xs text-slate-500">{{ req.date | date:'dd/MM/yyyy HH:mm' }}</div>
                         </div>
                         <div class="text-emerald-500">✓</div>
                      </div>
                      
                      @if (req.status !== 'NEW') {
                         <div class="flex items-center p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mr-3">2</div>
                            <div class="flex-1">
                               <div class="text-sm font-bold text-slate-900 dark:text-white">Dispatching</div>
                               <div class="text-xs text-slate-500">
                                  @if (req.assignedTenantIds && req.assignedTenantIds.length > 0) {
                                     Envoyé à {{ req.assignedTenantIds.length }} garage(s) : {{ getTenantNames(req.assignedTenantIds) }}
                                  } @else {
                                     Non dispatché
                                  }
                               </div>
                            </div>
                            <div class="text-emerald-500">✓</div>
                         </div>
                      }

                      @if (req.garageQuoteId || (req.proposedQuotes && req.proposedQuotes.length > 0)) {
                         <div class="flex items-center p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mr-3">3</div>
                            <div class="flex-1">
                               <div class="text-sm font-bold text-slate-900 dark:text-white">Devis Proposé</div>
                               <div class="text-xs text-slate-500">
                                  Devis reçu d'un garage.
                                  @if(req.status === 'QUOTE_SUBMITTED') { <span class="text-amber-500 font-bold ml-1">En attente validation Admin</span> }
                               </div>
                            </div>
                            <div [class]="req.status === 'QUOTE_SUBMITTED' ? 'text-amber-500' : 'text-emerald-500'">{{ req.status === 'QUOTE_SUBMITTED' ? '●' : '✓' }}</div>
                         </div>
                      }

                      @if (req.status === 'CONVERTED') {
                         @let repair = getRepair(req.repairOrderId);
                         
                         <!-- Step 4: Conversion -->
                         <div class="flex items-center p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 bg-emerald-50 dark:bg-emerald-900/10">
                            <div class="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mr-3 font-bold">4</div>
                            <div class="flex-1">
                               <div class="text-sm font-bold text-slate-900 dark:text-white">Devis Validé & Envoyé au Garage</div>
                               <div class="text-xs text-slate-500">Le client a accepté le devis.</div>
                            </div>
                            <div class="text-emerald-500">✓</div>
                         </div>
                         
                         <!-- Step 5: Repair Status -->
                         @if (repair) {
                            <div class="flex items-center p-3 last:border-0">
                               <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mr-3">5</div>
                               <div class="flex-1">
                                  <div class="text-sm font-bold text-slate-900 dark:text-white">Statut Atelier : {{ repair.status }}</div>
                                  <div class="text-xs text-slate-500">Suivi des travaux en cours.</div>
                               </div>
                               <div><!-- icon depending on status --></div>
                            </div>
                         }
                      } @else if (req.status === 'REJECTED') {
                         <div class="flex items-center p-3 bg-red-50 dark:bg-red-900/10">
                            <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center text-red-600 dark:text-red-400 mr-3 font-bold">!</div>
                            <div class="flex-1">
                               <div class="text-sm font-bold text-red-700 dark:text-red-400">Refusé</div>
                               <div class="text-xs text-red-600/70 dark:text-red-400/70">{{ req.rejectionReason }}</div>
                            </div>
                         </div>
                      }
                   </div>
                </div>
             </div>
          </div>
       </div>
    }

    <!-- ADMIN MODAL (SUPERADMIN DELEGATES) -->
    @if (showAdminModal()) {
       <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center bg-white dark:bg-slate-900 shrink-0 rounded-t-xl">
                <span>
                   @if (selectedAdminId()) { Modifier Administrateur } @else { Nouvel Administrateur }
                </span>
                <button (click)="closeAdminModal()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <form [formGroup]="adminForm" (ngSubmit)="submitAdmin()" class="p-6 flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Prénom</label>
                      <input formControlName="firstName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div>
                      <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nom</label>
                      <input formControlName="lastName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                </div>
                
                <div>
                   <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email (Identifiant de connexion)</label>
                   <input formControlName="email" type="email" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
                </div>
                
                <div>
                   <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Mot de passe 
                      @if (selectedAdminId()) { <span class="text-xs text-orange-500">(Laisser vide pour ne pas modifier)</span> }
                   </label>
                   <input formControlName="password" type="password" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
                </div>

                <div class="mt-4">
                   <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-3">Permissions Déléguées</h4>
                   <div class="space-y-3">
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_view_dashboard" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Vue d'ensemble</div>
                            <div class="text-xs text-slate-500">Accès au tableau de bord des statistiques.</div>
                         </div>
                      </label>
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_manage_moderation" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Pro Devis Auto</div>
                            <div class="text-xs text-slate-500">Examiner, valider et rejeter les devis.</div>
                         </div>
                      </label>
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_view_tenants" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Garages (Lecture Seule)</div>
                            <div class="text-xs text-slate-500">Voir la liste des garages locataires sans pouvoir modifier.</div>
                         </div>
                      </label>
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_manage_tenants" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Garages (Modification)</div>
                            <div class="text-xs text-slate-500">Créer, éditer, et suspendre les garages locataires.</div>
                         </div>
                      </label>
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_manage_leads" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Prospects (Leads)</div>
                            <div class="text-xs text-slate-500">Gérer les inscriptions et prises de contact.</div>
                         </div>
                      </label>
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_manage_config" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Configuration Plateforme</div>
                            <div class="text-xs text-slate-500">Modifier les réglages globaux et l'identité.</div>
                         </div>
                      </label>
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_view_logs" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Incidents & Logs</div>
                            <div class="text-xs text-slate-500">Accéder au journal technique des crashs.</div>
                         </div>
                      </label>
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_manage_scans" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Scans ICE</div>
                            <div class="text-xs text-slate-500">Consulter l'historique des codes QR scannés.</div>
                         </div>
                      </label>
                      <label class="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" formControlName="perms_view_mobile_users" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                         <div>
                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Utilisateurs Mobile (ICE)</div>
                            <div class="text-xs text-slate-500">Accéder à la base de données des automobilistes Inscrits.</div>
                         </div>
                      </label>
                   </div>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                   <button type="button" (click)="closeAdminModal()" class="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">Annuler</button>
                   <button type="submit" [disabled]="adminForm.invalid" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">
                      @if (selectedAdminId()) { Mettre à jour } @else { Créer Administrateur }
                   </button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- TENANT MODAL -->
    @if (showTenantModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center bg-white dark:bg-slate-900 shrink-0 rounded-t-xl">
                <span>{{ editingTenantId() ? 'Modifier Garage' : 'Nouveau Garage' }}</span>
                <button (click)="closeTenantModal()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <form [formGroup]="tenantForm" (ngSubmit)="submitTenant()" class="flex-1 flex flex-col min-h-0">
                <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50 space-y-6">
                   <!-- INFO GENERALES -->
                   <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                      <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Informations Générales</h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nom du Garage</label>
                            <input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         </div>
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email Admin</label>
                            <input formControlName="adminEmail" type="email" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         </div>
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Mot de passe</label>
                            <input formControlName="password" type="text" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         </div>
                         <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Plan</label>
                                <select formControlName="plan" (change)="onPlanChange($event)" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all">
                                   <option value="ICE Light">ICE Light</option>
                                   <option value="ICE Full">ICE Full</option>
                                </select>
                             </div>
                            <div>
                               <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Statut</label>
                               <select formControlName="status" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                                  <option value="Active">Actif</option>
                                  <option value="Suspended">Suspendu</option>
                                  <option value="Cancelled">Annulé</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   </div>

                   <!-- LOCALISATION -->
                   <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div class="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                         <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Localisation</h4>
                         <label class="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                            <input type="checkbox" formControlName="lockedGps" class="rounded text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500">
                            <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Verrouiller Localisation</span>
                         </label>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ville</label>
                            <select formControlName="city" (change)="onTenantCityChange($event)" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                               <option value="">Sélectionner...</option>
                               @for(city of cities; track city) { <option [value]="city">{{ city }}</option> }
                            </select>
                         </div>
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Commune</label>
                            <select formControlName="commune" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white" [attr.disabled]="!tenantForm.get('city')?.value ? true : null">
                               <option value="">Sélectionner...</option>
                               @for(commune of availableTenantCommunes(); track commune) { <option [value]="commune">{{ commune }}</option> }
                            </select>
                         </div>
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Code Postal</label>
                            <input formControlName="zip" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         </div>
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Adresse</label>
                            <input formControlName="address" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         </div>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Latitude</label>
                            <input type="number" step="any" formControlName="lat" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         </div>
                         <div>
                            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Longitude</label>
                            <input type="number" step="any" formControlName="lng" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         </div>
                      </div>
                   </div>

                   <!-- MODULES / PERMISSIONS -->
                   <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                      <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Modules & Permissions</h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         @for (cat of permissionCategories; track cat) {
                            <div>
                               <h5 class="font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase mb-2">{{ cat }}</h5>
                               <div class="space-y-1">
                                  @for (perm of getPermissionsByCategory(cat); track perm.id) {
                                     <label class="flex items-start gap-2 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors">
                                        <input type="checkbox" 
                                               [checked]="selectedFeatures().includes(perm.id)" 
                                               (change)="toggleFeature(perm.id)"
                                               class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900">
                                        <span class="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{{ perm.label }}</span>
                                     </label>
                                  }
                               </div>
                            </div>
                         }
                      </div>
                   </div>
                </div>

                <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0 rounded-b-xl">
                   <button type="button" (click)="closeTenantModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button type="submit" [disabled]="tenantForm.invalid" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-medium disabled:opacity-50 shadow-md">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
     }

     @if (lightboxPhotos().length > 0) {
        <div class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center" (click)="closeLightbox()">
           <button (click)="closeLightbox()" class="absolute top-4 right-4 z-10 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           <div class="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-mono bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">{{ lightboxIndex() + 1 }} / {{ lightboxPhotos().length }}</div>
           <div class="flex-1 flex items-center justify-center w-full px-16 py-16" (click)="$event.stopPropagation()">
              <img [src]="lightboxPhotos()[lightboxIndex()]" class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
           </div>
           @if (lightboxPhotos().length > 1) {
              <button (click)="prevLightbox(); $event.stopPropagation()" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors backdrop-blur-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button (click)="nextLightbox(); $event.stopPropagation()" class="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors backdrop-blur-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </button>
           }
        </div>
     }
   `
})
export class SuperAdminComponent {
   // Services with explicit types to resolve 'unknown'
   dataService: DataService = inject(DataService);
   toastService: ToastService = inject(ToastService);
   fb: FormBuilder = inject(FormBuilder);
   router: Router = inject(Router);
   route: ActivatedRoute = inject(ActivatedRoute);

   activeTab = signal<'dashboard' | 'tenants' | 'leads' | 'logs' | 'config' | 'moderation' | 'scans' | 'customers' | 'admins' | 'audit'>('dashboard');

   // Scans Search Logic
   scanSearchTerm = signal('');
   filteredScans = computed(() => {
      const term = this.scanSearchTerm().toLowerCase().trim();
      const allScans = this.dataService.qrScans();
      if (!term) return allScans;
      return allScans.filter(s =>
         s.scannedUserName.toLowerCase().includes(term) ||
         (s.scannedUserPhone && s.scannedUserPhone.includes(term)) ||
         s.scannerName.toLowerCase().includes(term) ||
         this.getTenantName(s.scannerTenantId).toLowerCase().includes(term)
      );
   });

   // Dashboard logic
   errorLogsCount = computed(() => this.dataService.systemLogs().filter(l => l.level === 'ERROR').length);

   // ICE Mobile Logic
   mobileUsersSearchTerm = signal('');
   mobileUsers = computed(() => {
      const term = this.mobileUsersSearchTerm().toLowerCase().trim();
      const allMobileClients = this.dataService.clients().filter(c => c.type === 'Particulier');
      
      let filtered = allMobileClients;
      if (term) {
         filtered = allMobileClients.filter(c => 
            (c.firstName + ' ' + (c.lastName || '')).toLowerCase().includes(term) ||
            (c.phone && c.phone.includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term)) ||
            (c.address?.city && c.address.city.toLowerCase().includes(term))
         );
      }
      
      // Map to include vehicle count
      return filtered.map(c => {
         const vehicleCount = this.dataService.mobileVehicles().filter(v => v.ownerPhone === c.phone).length;
         return {
            ...c,
            vehicleCount
         };
      });
   });

   // Moderation Logic
   moderationFilter = signal<'MODERATE' | 'VALIDATE' | 'TRACKING' | 'REJECTED' | 'HISTORY' | 'DIRECT'>('MODERATE');
   moderationSearchTerm = signal<string>('');

   // -- Modals --
   showRequestModal = signal(false);
   selectedRequest = signal<QuoteRequest | null>(null);

   showRejectModal = signal(false);
   selectedRequestIdForAction = signal<string | null>(null);
   selectedRequestForAction = computed(() => {
      const id = this.selectedRequestIdForAction();
      if (!id) return null;
      return this.dataService.quoteRequests().find(r => r.id === id) || null;
   });
   rejectionReason = signal('');

   showQuotePreviewModal = signal(false);

   showRequestDetailModal = signal(false);
   selectedRequestDetail = signal<QuoteRequest | null>(null);

   // Photo Lightbox
   lightboxPhotos = signal<string[]>([]);
   lightboxIndex = signal(0);

   // Dispatch logic
   dispatchSearchTerm = signal('');
   dispatchCityFilter = signal('');
   dispatchCommuneFilter = signal('');
   dispatchAdminDescription = signal('');
   selectedDispatchTenants = signal<string[]>([]);

   // Tenant CRUD
   showTenantModal = signal(false);
   editingTenantId = signal<string | null>(null);
   tenantSearchTerm = signal('');
   tenantStatusFilter = signal('');
   tenantCityFilter = signal('');

   // Tenant Permissions Logic
   selectedFeatures = signal<string[]>([]);
   permissionCategories = [...new Set(ALL_PERMISSIONS.map(p => p.category))];

   // Forms
   configForm: FormGroup;
   tenantForm: FormGroup;
   adminForm: FormGroup;

   cities = CITIES;
   dispatchCommunes = computed(() => {
      const city = this.dispatchCityFilter();
      if (!city) return [];
      return IVORY_COAST_LOCATIONS[city] || [];
   });

   canManageTenants = computed(() => {
      const u = this.dataService.currentUser();
      if (!u) return false;
      if (u.role === 'Root') return true;
      return (u.superAdminPerms || []).includes('MANAGE_TENANTS');
   });

   selectedTenantCity = signal<string>('');

   availableTenantCommunes = computed(() => {
      const city = this.selectedTenantCity();
      if (!city) return [];
      return IVORY_COAST_LOCATIONS[city] || [];
   });

   // Logos preview
   appLogoPreview = signal<string | null>(null);
   adminLogoPreview = signal<string | null>(null);

   constructor() {
      this.configForm = this.fb.group({
         appName: [''],
         superAdminName: [''],
         maintenanceMode: [false],
         // Logos handled separately via file input
      });

      this.tenantForm = this.fb.group({
         name: ['', Validators.required],
         adminEmail: ['', [Validators.required, Validators.email]],
         password: ['', Validators.required],
         plan: ['ICE Light', Validators.required],
         status: ['Active', Validators.required],
         city: [''],
         commune: [''],
         zip: [''],
         address: [''],
         lat: [''],
         lng: [''],
         lockedGps: [false]
      });

      this.adminForm = this.fb.group({
         firstName: ['', Validators.required],
         lastName: ['', Validators.required],
         email: ['', [Validators.required, Validators.email]],
         password: ['', Validators.required],
         role: ['SuperAdmin', Validators.required],
         perms_view_dashboard: [false],
         perms_manage_moderation: [false],
         perms_view_tenants: [false],
         perms_manage_tenants: [false],
         perms_manage_leads: [false],
         perms_manage_config: [false],
         perms_view_logs: [false],
         perms_manage_scans: [false],
         perms_view_mobile_users: [false]
      });

      // Sync Route Params to Tab
      this.route.params.subscribe(params => {
         const tabId = params['tabId'];
         if (tabId && ['dashboard', 'tenants', 'leads', 'logs', 'config', 'moderation', 'scans', 'customers', 'admins', 'audit'].includes(tabId)) {

            const user = this.dataService.currentUser();
            if (user && user.role === 'SuperAdmin') {
               const perms = user.superAdminPerms || [];
               let canAccess = false;

               if (tabId === 'dashboard') canAccess = perms.includes('VIEW_DASHBOARD');
               else if (tabId === 'moderation') canAccess = perms.includes('MANAGE_MODERATION');
               else if (tabId === 'tenants') canAccess = perms.includes('MANAGE_TENANTS') || perms.includes('VIEW_TENANTS');
               else if (tabId === 'customers') canAccess = perms.includes('VIEW_MOBILE_USERS');
               else if (tabId === 'leads') canAccess = perms.includes('MANAGE_LEADS');
               else if (tabId === 'config') canAccess = perms.includes('MANAGE_CONFIG');
               else if (tabId === 'logs') canAccess = perms.includes('VIEW_LOGS');
               else if (tabId === 'scans') canAccess = perms.includes('MANAGE_SCANS');
               else if (tabId === 'admins' || tabId === 'audit') canAccess = false; // Only Root

               if (!canAccess) {
                  // Redirect to the first available permitted tab if trying to access a blocked one
                  if (perms.includes('VIEW_DASHBOARD')) this.router.navigate(['/super-admin/dashboard']);
                  else if (perms.includes('MANAGE_MODERATION')) this.router.navigate(['/super-admin/moderation']);
                  else if (perms.includes('MANAGE_TENANTS') || perms.includes('VIEW_TENANTS')) this.router.navigate(['/super-admin/tenants']);
                  else if (perms.includes('VIEW_MOBILE_USERS')) this.router.navigate(['/super-admin/customers']);
                  else if (perms.includes('MANAGE_LEADS')) this.router.navigate(['/super-admin/leads']);
                  else if (perms.includes('MANAGE_CONFIG')) this.router.navigate(['/super-admin/config']);
                  else if (perms.includes('VIEW_LOGS')) this.router.navigate(['/super-admin/logs']);
                  else if (perms.includes('MANAGE_SCANS')) this.router.navigate(['/super-admin/scans']);
                  else this.router.navigate(['/login']); // Fallback
                  return;
               }
            } else if (user && user.role !== 'Root') {
               this.router.navigate(['/login']);
               return;
            }

            this.activeTab.set(tabId as any);

            // Fetch relevant data based on tab
            if (tabId === 'admins') {
               this.dataService.fetchAdmins();
            } else if (tabId === 'audit') {
               this.dataService.fetchAuditLogs();
            }
         }
      });

      // Effect to load config
      effect(() => {
         const config = this.dataService.platformConfig();
         this.configForm.patchValue(config);
         this.appLogoPreview.set(config.logoUrl || null);
         this.adminLogoPreview.set(config.superAdminLogoUrl || null);
      });
   }

   pageTitle = computed(() => {
      switch (this.activeTab()) {
         case 'dashboard': return 'Tableau de Bord Super-Admin';
         case 'tenants': return 'Gestion des Garages';
         case 'leads': return 'Prospects Commerciaux';
         case 'logs': return 'Journaux Système';
         case 'config': return 'Configuration Plateforme';
         case 'moderation': return 'Pro Devis Auto (Modération)';
         case 'scans': return 'Historique des Scans ICE';
         case 'customers': return 'Utilisateurs ICE Mobile';
         case 'admins': return 'Administration Complète';
         case 'audit': return 'Traçabilité et Sécurité';
         default: return 'Administration';
      }
   });

   pageDescription = computed(() => {
      switch (this.activeTab()) {
         case 'dashboard': return 'Vue d\'ensemble de la plateforme SaaS.';
         case 'tenants': return 'Gérez les abonnements et les comptes des garages partenaires.';
         case 'leads': return 'Suivi des garages intéressés par la solution.';
         case 'logs': return 'Audit de sécurité et erreurs techniques.';
         case 'config': return 'Paramètres globaux de l\'application.';
         case 'moderation': return 'Gérez les demandes de devis des automobilistes.';
         case 'scans': return 'Traçabilité de tous les scans physiques de QR Codes en garage.';
         case 'customers': return 'Base de données des automobilistes inscrits sur l\'application.';
         case 'admins': return 'Gestion des rôles et accès des administrateurs de la console ICE.';
         case 'audit': return 'Historique des actions critiques effectuées sur la console.';
         default: return '';
      }
   });

   // --- MODERATION LOGIC ---

   filteredRequests = computed(() => {
      const filter = this.moderationFilter();
      const search = this.moderationSearchTerm().toLowerCase().trim();
      const all = this.dataService.quoteRequests().filter(r => {
         if (!search) return true;
         const refMatch = this.getRef(r.id).toLowerCase().includes(search);
         const nameMatch = r.motoristName?.toLowerCase().includes(search);
         const phoneMatch = r.motoristPhone?.toLowerCase().includes(search);
         return refMatch || nameMatch || phoneMatch;
      });

      if (filter === 'MODERATE') {
         // NEW requests needing dispatch, ignoring direct requests
         return all.filter(r => r.status === 'NEW' && !r.isDirectRequest).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      if (filter === 'DIRECT') {
         return all.filter(r => r.isDirectRequest && r.status !== 'REJECTED' && r.status !== 'CONVERTED').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      if (filter === 'VALIDATE') {
         // Requests dispatched but waiting (DISPATCHED) or Quote Submitted needing review (QUOTE_SUBMITTED)
         // Also COMPLETED is when quotes are sent to client but client hasn't chosen yet
         return all.filter(r => (r.status === 'DISPATCHED' || r.status === 'QUOTE_SUBMITTED' || r.status === 'COMPLETED') && !r.isDirectRequest).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      if (filter === 'REJECTED') {
         // Show globally rejected requests OR requests where at least one quote was refused
         return all.filter(r => r.status === 'REJECTED' || (r.proposedQuotes && r.proposedQuotes.some(qid => this.dataService.getInvoiceById(qid)?.status === 'REFUSE'))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      if (filter === 'HISTORY') {
         // Everything finished (Converted or Canceled)
         return all.filter(r => r.status === 'CONVERTED' || r.status === 'CANCELED').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      // TRACKING is handled separately in trackedWorks
      return [];
   });

   // For Tracking View: Shows Converted Requests with Repair Progress
   trackedWorks = computed(() => {
      const search = this.moderationSearchTerm().toLowerCase().trim();
      const converted = this.dataService.quoteRequests().filter(r => {
         if (r.status !== 'CONVERTED') return false;
         if (!search) return true;
         const refMatch = this.getRef(r.id).toLowerCase().includes(search);
         const nameMatch = r.motoristName?.toLowerCase().includes(search);
         const phoneMatch = r.motoristPhone?.toLowerCase().includes(search);
         return refMatch || nameMatch || phoneMatch;
      });

      return converted.map(req => {
         let progress = 0;
         let repairStatus = 'En attente';
         let totalAmount = 0;
         let repairDate: string | undefined = undefined;

         if (req.acceptedQuoteId || req.garageQuoteId || (req.proposedQuotes && req.proposedQuotes.length > 0)) {
            const quoteId = req.acceptedQuoteId || req.garageQuoteId || (req.proposedQuotes ? req.proposedQuotes[0] : null);
            if (quoteId) {
               const quote = this.dataService.getInvoiceById(quoteId);
               if (quote) totalAmount = quote.totalTTC;
            }
         }

         if (req.repairOrderId) {
            const repair = this.dataService.repairs().find(r => r.id === req.repairOrderId);
            if (repair) {
               repairStatus = repair.status;
               repairDate = repair.entryDate; // Capture the repair date (which is updated when scheduled)
               if (repair.status === 'En attente') progress = 10;
               else if (repair.status === 'Diagnostic') progress = 30;
               else if (repair.status === 'Devis') progress = 40;
               else if (repair.status === 'En cours') progress = 60;
               else if (repair.status === 'Terminé') progress = 90;
               else if (repair.status === 'Clôturé') progress = 100;
            }
         }
         return { req, progress, repairStatus, totalAmount, repairDate };
      }).sort((a, b) => b.progress - a.progress); // Most active first? Or recently converted?
   });

   countByFilter(filter: 'MODERATE' | 'VALIDATE' | 'REJECTED' | 'DIRECT' | 'HISTORY') {
      const all = this.dataService.quoteRequests();
      if (filter === 'MODERATE') return all.filter(r => r.status === 'NEW' && !r.isDirectRequest).length;
      if (filter === 'DIRECT') return all.filter(r => r.isDirectRequest && r.status !== 'REJECTED' && r.status !== 'CONVERTED').length;
      if (filter === 'VALIDATE') return all.filter(r => (r.status === 'DISPATCHED' || r.status === 'QUOTE_SUBMITTED' || r.status === 'COMPLETED') && !r.isDirectRequest).length;
      if (filter === 'REJECTED') return all.filter(r => r.status === 'REJECTED').length;
      if (filter === 'HISTORY') return all.filter(r => r.status === 'CONVERTED' || r.status === 'CANCELED').length;
      return 0;
   }

   // --- DISPATCH ---

   openRequestModal(req: QuoteRequest) {
      this.selectedRequest.set(req);
      this.selectedDispatchTenants.set([]);
      this.dispatchSearchTerm.set('');

      // FIX: Set to empty by default to show ALL cities, not the request city
      this.dispatchCityFilter.set('');
      this.dispatchCommuneFilter.set('');
      this.dispatchAdminDescription.set(req.adminDescription || '');

      this.showRequestModal.set(true);
   }

   closeRequestModal() {
      this.showRequestModal.set(false);
      this.selectedRequest.set(null);
   }

   filteredDispatchTenants = computed(() => {
      const term = this.dispatchSearchTerm().toLowerCase();
      const city = this.dispatchCityFilter();
      const commune = this.dispatchCommuneFilter();

      return this.dataService.tenants().filter(t => {
         const matchesSearch = !term || t.name.toLowerCase().includes(term);
         const matchesCity = !city || t.city === city;
         const matchesCommune = !commune || t.commune === commune;
         const hasAccess = t.features?.includes('access_opportunities');
         return matchesSearch && matchesCity && matchesCommune && t.status === 'Active' && hasAccess;
      });
   });

   isTenantSelected(id: string) { return this.selectedDispatchTenants().includes(id); }
   toggleTenantSelection(id: string) {
      this.selectedDispatchTenants.update(list => {
         if (list.includes(id)) return list.filter(x => x !== id);
         return [...list, id];
      });
   }

   submitDispatch(req: QuoteRequest) {
      const selected = this.selectedDispatchTenants();
      if (selected.length === 0) return;

      this.dataService.dispatchQuoteRequest(req.id, selected, this.dispatchAdminDescription());
      this.toastService.show(`Demande dispatchée à ${selected.length} garage(s).`, 'success');
      this.closeRequestModal();
   }

   // --- REJECT ---

   selectedQuoteIdForAction = signal<string | null>(null);

   openRejectModal(req: QuoteRequest, quoteId?: string) {
      this.selectedRequestIdForAction.set(req.id);
      this.selectedQuoteIdForAction.set(quoteId || null);
      this.rejectionReason.set('');
      this.showRejectModal.set(true);
   }

   closeRejectModal() {
      this.showRejectModal.set(false);
   }

   confirmRejection() {
      const req = this.selectedRequestForAction();
      const quoteId = this.selectedQuoteIdForAction();
      if (req) {
         if (quoteId) {
            this.dataService.rejectSpecificQuote(req.id, quoteId, this.rejectionReason());
            this.toastService.show('Ce devis a été refusé.', 'info');
         } else {
            this.dataService.rejectQuoteRequest(req.id, this.rejectionReason());
            this.toastService.show('Demande globale refusée.', 'info');
         }
      }
      this.closeRejectModal();
      if (!quoteId) {
         this.closeQuotePreview();
      }
   }

   // --- QUOTE PREVIEW ---
   getGarageQuote(quoteId?: string) {
      if (!quoteId) return undefined;
      return this.dataService.invoices().find(i => i.id === quoteId);
   }

   getVisibleQuotes(req: QuoteRequest): string[] {
      if (!req.proposedQuotes) return [];
      if (this.moderationFilter() === 'REJECTED' && req.status !== 'REJECTED') {
         return req.proposedQuotes.filter(qid => this.getGarageQuote(qid)?.status === 'REFUSE');
      }
      return req.proposedQuotes;
   }

   getHasRefusedQuotes(req: QuoteRequest): boolean {
      if (!req.proposedQuotes) return false;
      return req.proposedQuotes.some(qid => this.getGarageQuote(qid)?.status === 'REFUSE');
   }

   getHasTransmittedOrAcceptedQuotes(req: QuoteRequest): boolean {
      if (!req.proposedQuotes) return false;
      return req.proposedQuotes.some(qid => {
         const status = this.getGarageQuote(qid)?.status;
         return status === 'ENVOYE' || status === 'ACCEPTE';
      });
   }

   selectedQuotePreviewId = signal<string | null>(null);

   openQuotePreview(req: QuoteRequest) {
      if (!req.proposedQuotes?.length && !req.garageQuoteId && !req.acceptedQuoteId) return;
      this.dataService.markMessagesAsRead(req.id, 'ADMIN');

      this.selectedRequestIdForAction.set(req.id);
      this.selectedRequestDetail.set(req); // To power selectedRequestForAction computed

      // Auto-select first quote
      if (this.moderationFilter() === 'REJECTED' && req.status !== 'REJECTED' && req.proposedQuotes) {
         const rejectedQid = req.proposedQuotes.find(qid => this.getGarageQuote(qid)?.status === 'REFUSE');
         if (rejectedQid) {
            this.selectedQuotePreviewId.set(rejectedQid);
         } else {
            this.selectedQuotePreviewId.set(req.proposedQuotes[0]);
         }
      } else if (req.proposedQuotes && req.proposedQuotes.length > 0) {
         this.selectedQuotePreviewId.set(req.proposedQuotes[0]);
      } else if (req.garageQuoteId) {
         this.selectedQuotePreviewId.set(req.garageQuoteId);
      }

      this.showQuotePreviewModal.set(true);
   }

   closeQuotePreview() {
      this.showQuotePreviewModal.set(false);
      this.selectedRequestIdForAction.set(null);
      this.selectedQuotePreviewId.set(null);
      this.selectedRequestDetail.set(null);
   }

   // --- REQUEST DETAILS ---
   openRequestDetails(req: QuoteRequest) {
      this.selectedRequestDetail.set(req);
      this.showRequestDetailModal.set(true);
   }
   closeRequestDetails() {
      this.showRequestDetailModal.set(false);
      this.selectedRequestDetail.set(null);
   }
   getRepair(id?: string) {
      if (!id) return undefined;
      return this.dataService.repairs().find(r => r.id === id);
   }

   // --- HELPER ---
   getTenantName(id?: string) {
      if (!id) return 'Inconnu';
      const t = this.dataService.tenants().find(x => x.id === id);
      return t ? t.name : 'Inconnu';
   }

   getRef(id?: string): string { return id ? id.substring(0,8).toUpperCase() : ''; }

   getTenantNames(ids?: string[]) {
      if (!ids || ids.length === 0) return '-';
      return ids.map(id => this.getTenantName(id)).join(', ');
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

   getWinnerTenantName(req: QuoteRequest) {
      const quoteId = req.acceptedQuoteId || req.garageQuoteId;
      if (!quoteId) return null;
      const invoice = this.dataService.getInvoiceById(quoteId);
      if (!invoice) return null;
      return this.getTenantName(req.assignedTenantIds?.[0]);
   }

   // --- ADMIN CRUD ---

   showAdminModal = signal(false);
   selectedAdminId = signal<string | null>(null);

   openAdminModal(admin?: AppUser) {
      if (admin) {
         this.selectedAdminId.set(admin.id);
         const perms = admin.superAdminPerms || [];

         this.adminForm.get('password')?.clearValidators();
         this.adminForm.get('password')?.updateValueAndValidity();

         this.adminForm.patchValue({
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            password: '',
            role: admin.role,
            perms_view_dashboard: perms.includes('VIEW_DASHBOARD'),
            perms_manage_moderation: perms.includes('MANAGE_MODERATION'),
            perms_view_tenants: perms.includes('VIEW_TENANTS'),
            perms_manage_tenants: perms.includes('MANAGE_TENANTS'),
            perms_manage_leads: perms.includes('MANAGE_LEADS'),
            perms_manage_config: perms.includes('MANAGE_CONFIG'),
            perms_view_logs: perms.includes('VIEW_LOGS'),
            perms_manage_scans: perms.includes('MANAGE_SCANS')
         });
      } else {
         this.selectedAdminId.set(null);

         this.adminForm.get('password')?.setValidators([Validators.required]);
         this.adminForm.get('password')?.updateValueAndValidity();

         this.adminForm.reset({
            role: 'SuperAdmin',
            perms_view_dashboard: false,
            perms_manage_moderation: false,
            perms_view_tenants: false,
            perms_manage_tenants: false,
            perms_manage_leads: false,
            perms_manage_config: false,
            perms_view_logs: false,
            perms_manage_scans: false
         });
      }
      this.showAdminModal.set(true);
   }

   closeAdminModal() { this.showAdminModal.set(false); }

   getCleanDescription(desc?: string): string {
      if (!desc) return '';
      if (desc.includes('Véhicule roulant') && desc.includes(' | ')) {
         const parts = desc.split('\n');
         if (parts.length > 1) return parts.slice(1).join('\n');
         return 'Détails de la demande';
      }
      return desc;
   }

   // --- INITIALIZATION ---
   submitAdmin() {
      if (this.adminForm.invalid) return;
      const val = this.adminForm.value;
      const currentUser = this.dataService.currentUser();

      const mappedPerms: string[] = [];
      if (val.perms_view_dashboard) mappedPerms.push('VIEW_DASHBOARD');
      if (val.perms_manage_moderation) mappedPerms.push('MANAGE_MODERATION');
      if (val.perms_view_tenants) mappedPerms.push('VIEW_TENANTS');
      if (val.perms_manage_tenants) mappedPerms.push('MANAGE_TENANTS');
      if (val.perms_manage_leads) mappedPerms.push('MANAGE_LEADS');
      if (val.perms_manage_config) mappedPerms.push('MANAGE_CONFIG');
      if (val.perms_view_logs) mappedPerms.push('VIEW_LOGS');
      if (val.perms_manage_scans) mappedPerms.push('MANAGE_SCANS');

      const adminData: any = {
         firstName: val.firstName,
         lastName: val.lastName,
         email: val.email,
         role: val.role,
         superAdminPerms: mappedPerms
      };

      if (val.password && val.password.trim() !== '') {
         adminData.password = val.password;
      }

      if (this.selectedAdminId()) {
         const id = this.selectedAdminId()!;
         this.dataService.updateAdmin(id, adminData);
         this.closeAdminModal();
      } else {
         const newAdmin: AppUser = {
            id: crypto.randomUUID(),
            ...adminData,
            active: true,
            createdBy: currentUser?.email
         };
         this.dataService.createAdmin(newAdmin);
         this.closeAdminModal();
      }
   }

   // --- TENANT CRUD ---

   // Permissions Helpers
   getPermissionsByCategory(category: string) {
      return ALL_PERMISSIONS.filter(p => p.category === category);
   }

   isFeatureSelected(permId: string) {
      return this.selectedFeatures().includes(permId);
   }

   toggleFeature(permId: string) {
      this.selectedFeatures.update(feats => {
         if (feats.includes(permId)) return feats.filter(f => f !== permId);
         return [...feats, permId];
      });
   }

   onPlanChange(event: any) {
      const selectedPlan = event.target.value as 'ICE Light' | 'ICE Full';
      if (selectedPlan && PLAN_DEFAULTS[selectedPlan]) {
         // Optionally, prompt user or directly overwrite
         this.selectedFeatures.set([...PLAN_DEFAULTS[selectedPlan]]);
      }
   }

   openTenantModal(tenant?: Tenant) {
      if (tenant) {
         this.editingTenantId.set(tenant.id);
         this.tenantForm.patchValue({
            name: tenant.name,
            adminEmail: tenant.adminEmail,
            password: tenant.password,
            plan: tenant.plan,
            status: tenant.status,
            address: tenant.address,
            city: tenant.city,
            commune: tenant.commune,
            zip: tenant.zip || '',
            lat: tenant.lat || '',
            lng: tenant.lng || '',
            lockedGps: tenant.lockedGps || false
         });
         this.selectedTenantCity.set(tenant.city || '');
         // Load features
         this.selectedFeatures.set([...(tenant.features || [])]);
      } else {
         this.editingTenantId.set(null);
         this.tenantForm.reset({
            plan: 'ICE Light',
            status: 'Active'
         });
         this.selectedTenantCity.set('');
         // Default features for starter
         this.selectedFeatures.set([...PLAN_DEFAULTS['ICE Light']]);
      }
      this.showTenantModal.set(true);
   }

   closeTenantModal() {
      this.showTenantModal.set(false);
   }

   onTenantCityChange(event: Event) {
      const city = (event.target as HTMLSelectElement).value;
      this.selectedTenantCity.set(city);
      this.tenantForm.patchValue({ commune: '' });
   }

   submitTenant() {
      if (this.tenantForm.invalid) return;
      const val = this.tenantForm.value;
      const features = this.selectedFeatures(); // Use custom selected features

      // Fix Prisma strict typing empty string to Float conversion errors
      const normalizedLat = val.lat !== '' && val.lat != null ? Number(val.lat) : undefined;
      const normalizedLng = val.lng !== '' && val.lng != null ? Number(val.lng) : undefined;

      if (this.editingTenantId()) {
         const original = this.dataService.tenants().find(t => t.id === this.editingTenantId());
         if (original) {
            this.dataService.updateTenant({
               ...original,
               ...val,
               lat: normalizedLat,
               lng: normalizedLng,
               features: features
            });
            this.toastService.show('Garage mis à jour', 'success');
         }
      } else {
         const newTenant: Tenant = {
            id: crypto.randomUUID(),
            name: val.name,
            adminEmail: val.adminEmail,
            password: val.password,
            plan: val.plan,
            status: val.status,
            city: val.city,
            commune: val.commune,
            zip: val.zip,
            address: val.address,
            features: features,
            userCount: 0,
            maxUsers: 9999,
            storageUsed: 0,
            storageLimit: 9999,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            mrr: 25000,
            lat: normalizedLat,
            lng: normalizedLng,
            lockedGps: val.lockedGps ?? false,
            rating: 0,
            reviewCount: 0
         };
         this.dataService.addTenant(newTenant);
         this.toastService.show('Nouveau garage créé', 'success');
      }
      this.closeTenantModal();
   }

   // --- PLATFORM CONFIG ---
   onAppLogoSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (e: any) => this.appLogoPreview.set(e.target.result);
         reader.readAsDataURL(file);
      }
   }
   removeAppLogo() { this.appLogoPreview.set(null); }

   onAdminLogoSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (e: any) => this.adminLogoPreview.set(e.target.result);
         reader.readAsDataURL(file);
      }
   }
   removeAdminLogo() { this.adminLogoPreview.set(null); }

   saveConfig() {
      const newConfig: PlatformConfig = {
         ...this.dataService.platformConfig(),
         ...this.configForm.value,
         logoUrl: this.appLogoPreview() || undefined,
         superAdminLogoUrl: this.adminLogoPreview() || undefined
      };
      this.dataService.savePlatformConfig(newConfig);
      this.toastService.show('Configuration mise à jour', 'success');
   }

   // --- FILTERS ---
   filteredTenants = computed(() => {
      const search = this.tenantSearchTerm().toLowerCase();
      const status = this.tenantStatusFilter();
      const city = this.tenantCityFilter();

      return this.dataService.tenants().filter(t => {
         const matchesSearch = !search || t.name.toLowerCase().includes(search) || t.adminEmail.toLowerCase().includes(search);
         const matchesStatus = !status || t.status === status;
         const matchesCity = !city || t.city === city;
         return matchesSearch && matchesStatus && matchesCity;
      });
   });

   updateTenantSearch(e: Event) { this.tenantSearchTerm.set((e.target as HTMLInputElement).value); }
   updateTenantCityFilter(e: Event) { this.tenantCityFilter.set((e.target as HTMLSelectElement).value); }

   impersonate(tenant: Tenant) {
      // Search for an existing user account for this tenant admin
      let user = this.dataService.staff().find(u => u.email === tenant.adminEmail);

      // If no user found in the current mock 'staff' list (which might be local to T1 in this demo),
      // create a temporary session user object to simulate the login.
      if (!user) {
         user = {
            id: 'temp_admin_' + tenant.id,
            firstName: 'Admin',
            lastName: tenant.name,
            email: tenant.adminEmail,
            role: 'Manager', // Assume Full Access
            active: true,
            // No specific tenant ID field on user in this simplified model, 
            // but 'loginAs' sets 'currentUser'. 
            // In a real app, this would fetch the user from backend.
         };
         // Note: Features are loaded from Tenant object in DataService via currentTenantFeatures logic.
      }

      this.dataService.loginAs(user);
      this.toastService.show(`Connexion en tant que ${tenant.name}...`, 'success');
      this.router.navigate(['/dashboard']);
   }

   toggleTenantStatus(tenant: Tenant) {
      const newStatus = tenant.status === 'Active' ? 'Suspended' : 'Active';
      this.dataService.updateTenant({ ...tenant, status: newStatus });
      this.toastService.show(`Statut garage ${newStatus === 'Active' ? 'activé' : 'suspendu'}`, 'info');
   }

   openEditTenant(tenant: Tenant) {
      this.openTenantModal(tenant);
   }

   // --- SYSTEM LOGS & BROADCAST ---
   sendBroadcast(message: string) {
      if (!message) return;
      this.dataService.addSystemLog('INFO', `BROADCAST: ${message}`, 'Global');
      this.dataService.setGlobalAnnouncement(message);
      this.toastService.show('Message envoyé à tous les utilisateurs', 'success');
   }

   formatMoney(val: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(val); }
   getStatusColor(status: string) {
      switch (status) {
         case 'En attente': return 'text-slate-500 font-bold';
         case 'Diagnostic': return 'text-amber-500 font-bold';
         case 'En cours': return 'text-blue-500 font-bold';
         case 'Terminé': return 'text-emerald-500 font-bold';
         case 'Clôturé': return 'text-slate-400 font-bold';
         default: return 'text-slate-500';
      }
   }

   // Helper methods for preference labels
   getPeriodLabel(val?: string): string {
      switch (val) {
         case 'Urgent': return 'Au plus vite';
         case 'Week': return 'Cette semaine';
         case 'NextWeek': return 'Semaine prochaine';
         case 'Month': return 'Dans le mois';
         default: return 'Indifférent';
      }
   }

   getInterventionLabel(val?: string): string {
      switch (val) {
         case 'Garage': return 'Dépôt au garage';
         case 'Home': return 'À domicile';
         case 'Work': return 'Sur lieu de travail';
         case 'Towing': return 'Remorquage requis';
         default: return 'Au garage';
      }
   }

   newQuoteMessage = signal('');

   sendQuoteMessage(reqId: string, tenantId?: string) {
      const msg = this.newQuoteMessage().trim();
      if (!msg || !tenantId) return;

      this.dataService.addMessageToQuoteRequest(reqId, {
         senderId: 'SUPERADMIN',
         senderName: 'SuperAdmin',
         tenantId: tenantId,
         message: msg
      });
      this.toastService.show('Message envoyé au garage', 'success');
      this.newQuoteMessage.set('');
   }

   getFilteredMessages(messages: any[] | undefined, tenantId: string | undefined): any[] {
      if (!messages || !tenantId) return [];
      return messages.filter(m => m.tenantId === tenantId);
   }

   toggleQuoteUnlock(reqId: string, tenantId: string | undefined, event: Event) {
      if (!tenantId) return;
      const isChecked = (event.target as HTMLInputElement).checked;
      this.dataService.toggleQuoteModification(reqId, isChecked, tenantId);
      if (isChecked) {
         this.toastService.show('Devis déverrouillé pour modification par ce garage', 'info');
      } else {
         this.toastService.show('Modification verrouillée pour ce garage', 'info');
      }
   }

   // Photo Lightbox Methods
   openLightbox(photos: string[], index: number) {
      this.lightboxPhotos.set(photos);
      this.lightboxIndex.set(index);
   }
   closeLightbox() {
      this.lightboxPhotos.set([]);
      this.lightboxIndex.set(0);
   }
   prevLightbox() {
      const total = this.lightboxPhotos().length;
      this.lightboxIndex.set((this.lightboxIndex() - 1 + total) % total);
   }
   nextLightbox() {
      const total = this.lightboxPhotos().length;
      this.lightboxIndex.set((this.lightboxIndex() + 1) % total);
   }
}
