
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService, AppUser, GarageSettings, Role, ALL_PERMISSIONS, CITIES, IVORY_COAST_LOCATIONS } from '../../services/data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
   selector: 'app-settings',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, RouterLink],
   template: `
    <div class="flex flex-col h-full">
      <div class="flex flex-col md:flex-row md:justify-between md:items-end mb-6 shrink-0 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Paramètres Garage</h1>
          <p class="text-slate-500 dark:text-slate-400">Administration du compte et personnalisation.</p>
        </div>
        
        <div class="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-auto overflow-x-auto">
           <button (click)="activeTab.set('company')" [class]="activeTab() === 'company' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-4 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Entreprise</button>
           <button (click)="activeTab.set('customization')" [class]="activeTab() === 'customization' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-4 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Personnalisation</button>
           <button (click)="activeTab.set('users')" [class]="activeTab() === 'users' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-4 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Utilisateurs</button>
           <button (click)="activeTab.set('roles')" [class]="activeTab() === 'roles' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" class="px-4 py-2 rounded text-sm font-medium transition-all whitespace-nowrap">Rôles & Permissions</button>
        </div>
        
        <a [routerLink]="['/workshop', dataService.currentTenantId()]" target="_blank" class="ml-auto mt-4 md:mt-0 md:ml-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center justify-center gap-2 shrink-0">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
           Portail Atelier
        </a>
      </div>

      <div class="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col p-4 md:p-6">
         
         <!-- TAB 1: COMPANY (General Info) -->
         @if (activeTab() === 'company') {
            <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="max-w-4xl mx-auto w-full space-y-8">
               
               <!-- Identity -->
               <div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Identité</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom du Garage</label>
                        <input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Contact</label>
                        <input formControlName="email" type="email" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                        <input formControlName="phone" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RCCM</label>
                        <input formControlName="rccm" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">N° Compte Contribuable</label>
                        <input formControlName="vatNumber" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Taux TVA (Défaut)</label>
                        <select formControlName="defaultVatRate" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                           @for(rate of vatRates; track rate) {
                              <option [ngValue]="rate">{{ rate }}%</option>
                           }
                        </select>
                     </div>
                  </div>
               </div>

               <!-- Address (With City/Commune Dropdowns) -->
               <div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Localisation</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse (Rue/Quartier)</label>
                        <input formControlName="address" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ville</label>
                        <select formControlName="city" (change)="onCityChange()" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed">
                           <option value="">Sélectionner...</option>
                           @for(city of cities; track city) { <option [value]="city">{{ city }}</option> }
                        </select>
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Commune</label>
                        <select formControlName="commune" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed">
                           <option value="">Sélectionner...</option>
                           @for(commune of availableCommunes(); track commune) { <option [value]="commune">{{ commune }}</option> }
                        </select>
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code Postal / BP</label>
                        <input formControlName="zip" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude (GPS)</label>
                        <input formControlName="lat" type="number" step="any" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude (GPS)</label>
                        <input formControlName="lng" type="number" step="any" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed">
                     </div>
                  </div>
               </div>

               <div class="flex justify-end pt-4">
                  <button type="submit" [disabled]="settingsForm.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors disabled:opacity-50">Enregistrer</button>
               </div>
            </form>
         }

         <!-- TAB 2: CUSTOMIZATION -->
         @if (activeTab() === 'customization') {
            <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="max-w-4xl mx-auto w-full space-y-8">
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <!-- Logo Section -->
                  <div class="flex flex-col gap-4">
                     <h3 class="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Logo & Apparence</h3>
                     <div class="flex items-start gap-4">
                        <div class="w-32 h-32 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                           @if (logoPreview()) {
                              <img [src]="logoPreview()" class="w-full h-full object-contain p-2">
                              <button type="button" (click)="removeLogo()" class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-bold text-xs">
                                 Supprimer
                              </button>
                           } @else {
                              <div class="text-slate-400 dark:text-slate-500 text-center">
                                 <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                 <span class="text-xs">Logo</span>
                              </div>
                           }
                           <input type="file" (change)="onLogoSelected($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer">
                        </div>
                        <div class="flex-1">
                           <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Couleur Principale</label>
                           <div class="flex gap-2">
                              <input type="color" formControlName="docColor" class="h-10 w-10 rounded cursor-pointer border-0 p-0">
                              <input type="text" formControlName="docColor" class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white uppercase font-mono">
                           </div>
                           <p class="text-xs text-slate-500 mt-2">Utilisée pour les titres et bordures des documents PDF.</p>
                        </div>
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Visible sur App Mobile)</label>
                        <textarea formControlName="description" rows="3" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"></textarea>
                     </div>
                  </div>

                  <!-- Documents Section -->
                  <div class="flex flex-col gap-4">
                     <h3 class="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Documents (Devis/Factures)</h3>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Devise</label>
                        <input formControlName="currency" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Validité Devis (Jours)</label>
                        <input type="number" formControlName="quoteValidity" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pied de page (Mentions Légales)</label>
                        <textarea formControlName="invoiceFooter" rows="4" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"></textarea>
                     </div>
                  </div>
               </div>

               <!-- Letterhead / Background Image Section -->
               <div class="border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                  <div class="flex items-center justify-between mb-4">
                     <div>
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Papier Entête Personnalisé</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Utiliser une image de fond (A4) pour vos documents PDF. L'entête et le pied de page par défaut seront masqués.</p>
                     </div>
                     <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" formControlName="useBackgroundImage" class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                     </label>
                  </div>

                  @if (settingsForm.get('useBackgroundImage')?.value) {
                     <div class="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 relative transition-all animate-fade-in">
                        @if (backgroundPreview()) {
                           <div class="relative w-40 aspect-[210/297] shadow-lg rounded overflow-hidden bg-white border border-slate-200">
                              <img [src]="backgroundPreview()" class="w-full h-full object-cover">
                              <button type="button" (click)="removeBackground()" class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-bold text-xs">
                                 Supprimer
                              </button>
                           </div>
                           <p class="text-xs text-emerald-600 font-bold mt-1">Image chargée</p>
                        } @else {
                           <div class="text-center py-4">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <p class="text-sm text-slate-500 font-medium">Cliquez pour sélectionner une image (A4)</p>
                              <p class="text-xs text-slate-400 mt-1">Format recommandé : JPG/PNG, 2480x3508px</p>
                           </div>
                        }
                        
                        <input type="file" (change)="onBackgroundSelected($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" [class.pointer-events-none]="backgroundPreview()">
                        
                        @if (backgroundPreview()) {
                           <div class="relative z-10 mt-2">
                              <input #bgInput type="file" (change)="onBackgroundSelected($event)" accept="image/*" class="hidden">
                              <button type="button" (click)="bgInput.click()" class="text-xs text-brand-600 hover:text-brand-500 underline">Changer l'image</button>
                           </div>
                        }
                     </div>
                  }
               </div>

               <div class="flex justify-end pt-4">
                  <button type="button" (click)="activeTab.set('company')" class="mr-3 px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">Précédent</button>
                  <button type="submit" [disabled]="settingsForm.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-colors disabled:opacity-50">Enregistrer</button>
               </div>
            </form>
         }

         <!-- TAB 3: USERS -->
         @if (activeTab() === 'users') {
            <div class="flex flex-col h-full">
               <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white">Liste du personnel</h3>
                  <button (click)="openUserModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                     Ajouter
                  </button>
               </div>
               
               <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left">
                     <thead class="bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                           <th class="px-6 py-3">Utilisateur</th>
                           <th class="px-6 py-3">Email</th>
                           <th class="px-6 py-3">Rôle</th>
                           <th class="px-6 py-3 text-center">Statut</th>
                           <th class="px-6 py-3 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        @for (user of garageStaff(); track user.id) {
                           <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                 <div>{{ user.firstName }} {{ user.lastName }}</div>
                              </td>
                              <td class="px-6 py-4 text-slate-600 dark:text-slate-400">{{ user.email }}</td>
                              <td class="px-6 py-4">
                                 <span class="px-2 py-1 rounded-full text-xs font-bold border" 
                                    [class.bg-purple-100]="user.role==='Admin'" [class.text-purple-700]="user.role==='Admin'"
                                    [class.bg-blue-100]="user.role==='Manager'" [class.text-blue-700]="user.role==='Manager'"
                                    [class.bg-emerald-100]="user.role==='Mecanicien'" [class.text-emerald-700]="user.role==='Mecanicien'"
                                    [class.bg-slate-100]="user.role==='Secretaire'" [class.text-slate-700]="user.role==='Secretaire'">
                                    {{ user.role }}
                                 </span>
                              </td>
                              <td class="px-6 py-4 text-center">
                                 @if (user.active) {
                                    <span class="text-emerald-500">● Actif</span>
                                 } @else {
                                    <span class="text-red-500">● Inactif</span>
                                 }
                              </td>
                              <td class="px-6 py-4 text-right">
                                 <div class="flex justify-end gap-2">
                                    <button (click)="openUserModal(user)" class="text-slate-400 hover:text-blue-500 transition-colors">Modifier</button>
                                    <button (click)="toggleUserActive(user)" class="text-slate-400 hover:text-amber-500 transition-colors">{{ user.active ? 'Désactiver' : 'Activer' }}</button>
                                 </div>
                              </td>
                           </tr>
                        }
                     </tbody>
                  </table>
               </div>
            </div>
         }

         <!-- TAB 4: ROLES (EDITABLE) -->
         @if (activeTab() === 'roles') {
            <div class="flex flex-col h-full">
               <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white">Rôles & Permissions</h3>
                  <button (click)="openRoleModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                     Créer Rôle
                  </button>
               </div>
               
               <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  @for (role of dataService.roles(); track role.id) {
                     <div class="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col h-full">
                        <div class="flex justify-between items-start mb-3">
                           <h4 class="font-bold text-slate-900 dark:text-white text-lg">{{ role.name }}</h4>
                           <div class="flex gap-2">
                              @if(role.isSystem) {
                                 <span class="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">Système</span>
                              } @else {
                                 <button (click)="openRoleModal(role)" class="text-slate-400 hover:text-blue-500 p-1" title="Modifier">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                 </button>
                                 <button (click)="deleteRole(role)" class="text-slate-400 hover:text-red-500 p-1" title="Supprimer">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                 </button>
                              }
                           </div>
                        </div>
                        
                        <div class="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">{{ role.permissions.length }} permissions actives</div>
                        
                        <div class="flex flex-wrap gap-1 flex-1 content-start">
                           @for (perm of role.permissions.slice(0, 10); track perm) {
                              <span class="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-400">{{ perm }}</span>
                           }
                           @if(role.permissions.length > 10) {
                              <span class="px-2 py-0.5 text-[10px] text-slate-400">...+{{ role.permissions.length - 10 }} autres</span>
                           }
                        </div>
                     </div>
                  }
               </div>
            </div>
         }
      </div>
    </div>

    <!-- USER MODAL -->
    @if (showUserModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center">
                <span>{{ editingUserId() ? 'Modifier Utilisateur' : 'Nouvel Utilisateur' }}</span>
                <button (click)="closeUserModal()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             <form [formGroup]="userForm" (ngSubmit)="submitUser()" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Prénom</label>
                      <input formControlName="firstName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Nom</label>
                      <input formControlName="lastName" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                </div>
                <div>
                   <label class="block text-xs font-medium text-slate-500 mb-1">Email (Connexion)</label>
                   <input formControlName="email" type="email" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                </div>
                <div class="grid grid-cols-2 gap-4">
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Rôle</label>
                      <select formControlName="role" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                         @for (r of dataService.roles(); track r.id) { <option [value]="r.name">{{ r.name }}</option> }
                      </select>
                   </div>
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Mot de passe</label>
                      <input formControlName="password" type="password" placeholder="••••••" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white">
                   </div>
                </div>
                <!-- Pin Code for Mechanics -->
                @if (userForm.get('role')?.value === 'Mecanicien') {
                   <div>
                      <label class="block text-xs font-medium text-slate-500 mb-1">Code PIN (Atelier)</label>
                      <input formControlName="pinCode" maxlength="4" placeholder="0000" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white font-mono tracking-widest text-center">
                   </div>
                }

                <div class="flex justify-end gap-3 pt-2">
                   <button type="button" (click)="closeUserModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button type="submit" [disabled]="userForm.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded font-medium disabled:opacity-50">Enregistrer</button>
                </div>
             </form>
          </div>
       </div>
    }

    <!-- ROLE MODAL (EDITABLE PERMISSIONS) -->
    @if (showRoleModal()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
             <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex justify-between items-center shrink-0">
                <span>{{ editingRoleId() ? 'Modifier Rôle' : 'Nouveau Rôle' }}</span>
                <button (click)="closeRoleModal()" class="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <form [formGroup]="roleForm" (ngSubmit)="submitRole()" class="flex-1 flex flex-col min-h-0">
                <div class="p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                   <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Nom du Rôle</label>
                   <input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white font-bold">
                </div>

                <div class="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/30">
                   <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Permissions</h3>
                   
                   <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      @for (cat of permissionCategories; track cat) {
                         <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                            <h4 class="font-bold text-brand-600 dark:text-brand-400 text-xs uppercase mb-3 border-b border-slate-100 dark:border-slate-800 pb-1">{{ cat }}</h4>
                            <div class="space-y-2">
                               @for (perm of getPermissionsByCategory(cat); track perm.id) {
                                  <label class="flex items-start gap-2 cursor-pointer group">
                                     <input type="checkbox" 
                                            [checked]="isPermissionSelected(perm.id)" 
                                            (change)="togglePermission(perm.id)"
                                            class="mt-0.5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                                     <span class="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{{ perm.label }}</span>
                                  </label>
                               }
                            </div>
                         </div>
                      }
                   </div>
                </div>

                <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                   <button type="button" (click)="closeRoleModal()" class="px-4 py-2 text-slate-500">Annuler</button>
                   <button type="submit" [disabled]="roleForm.invalid" class="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium shadow-md">Enregistrer Rôle</button>
                </div>
             </form>
          </div>
       </div>
    }
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
export class SettingsComponent {
   dataService: DataService = inject(DataService);
   toastService: ToastService = inject(ToastService);
   fb: FormBuilder = inject(FormBuilder);

   activeTab = signal<'company' | 'users' | 'roles' | 'customization'>('company');

   settingsForm: FormGroup;
   logoPreview = signal<string | null>(null);
   backgroundPreview = signal<string | null>(null);

   // Users tab
   showUserModal = signal(false);
   userForm: FormGroup;
   editingUserId = signal<string | null>(null);

   // Roles tab
   showRoleModal = signal(false);
   roleForm: FormGroup;
   editingRoleId = signal<string | null>(null);
   selectedPermissions = signal<string[]>([]); // Store selected permissions IDs locally for the modal

   cities = CITIES;
   vatRates = [0, 5.5, 10, 18, 20];

   availableCommunes = computed(() => {
      const city = this.settingsForm.get('city')?.value;
      if (!city) return [];
      return IVORY_COAST_LOCATIONS[city] || [];
   });

   // Get distinct permission categories
   permissionCategories = [...new Set(ALL_PERMISSIONS.map(p => p.category))];

   garageStaff = computed(() => {
      const currentTId = this.dataService.currentTenantId();
      return this.dataService.staff().filter(u => u.tenantId === currentTId);
   });

   constructor() {
      // Settings Form (Covers Company & Customization)
      this.settingsForm = this.fb.group({
         name: ['', Validators.required],
         description: [''],
         address: [''],
         city: [''],
         commune: [''],
         zip: [''],
         lat: [null],
         lng: [null],
         phone: [''],
         email: ['', Validators.email],
         rccm: [''],
         vatNumber: [''],
         defaultVatRate: [18],
         currency: ['XOF'],
         invoiceFooter: [''],
         quoteValidity: [30],
         docColor: ['#2563eb'],
         useBackgroundImage: [false]
      });

      // User Form
      this.userForm = this.fb.group({
         firstName: ['', Validators.required],
         lastName: ['', Validators.required],
         email: ['', [Validators.required, Validators.email]],
         password: [''],
         role: ['Mecanicien', Validators.required],
         pinCode: ['']
      });

      // Role Form
      this.roleForm = this.fb.group({
         name: ['', Validators.required]
      });

      effect(() => {
         const settings = this.dataService.currentSettings();
         const tenant = this.dataService.tenants().find(t => t.id === this.dataService.currentTenantId());

         this.settingsForm.patchValue(settings);
         this.logoPreview.set(settings.logoUrl || null);
         this.backgroundPreview.set(settings.backgroundImageUrl || null);

         if (tenant?.lockedGps) {
            this.settingsForm.get('address')?.disable();
            this.settingsForm.get('city')?.disable();
            this.settingsForm.get('commune')?.disable();
            this.settingsForm.get('zip')?.disable();
            this.settingsForm.get('lat')?.disable();
            this.settingsForm.get('lng')?.disable();
         } else {
            this.settingsForm.get('address')?.enable();
            this.settingsForm.get('city')?.enable();
            this.settingsForm.get('commune')?.enable();
            this.settingsForm.get('zip')?.enable();
            this.settingsForm.get('lat')?.enable();
            this.settingsForm.get('lng')?.enable();
         }
      });
   }

   // --- SETTINGS LOGIC ---

   onCityChange() {
      this.settingsForm.patchValue({ commune: '' });
   }

   onLogoSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (e: any) => this.logoPreview.set(e.target.result);
         reader.readAsDataURL(file);
      }
   }

   removeLogo() {
      this.logoPreview.set(null);
   }

   onBackgroundSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (e: any) => this.backgroundPreview.set(e.target.result);
         reader.readAsDataURL(file);
      }
   }

   removeBackground() {
      this.backgroundPreview.set(null);
      this.settingsForm.patchValue({ useBackgroundImage: false });
   }

   saveSettings() {
      if (this.settingsForm.invalid) {
         this.toastService.show('Formulaire invalide', 'error');
         return;
      }

      const updatedSettings: GarageSettings = {
         ...this.dataService.currentSettings(),
         ...this.settingsForm.value,
         logoUrl: this.logoPreview() || undefined,
         backgroundImageUrl: this.backgroundPreview() || undefined
      };

      this.dataService.updateGarageSettings(updatedSettings);
      this.toastService.show('Paramètres enregistrés', 'success');
   }

   // --- USER LOGIC ---

   openUserModal(user?: AppUser) {
      if (user) {
         this.editingUserId.set(user.id);
         this.userForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            role: user.role,
            pinCode: user.pinCode
         });
      } else {
         this.editingUserId.set(null);
         this.userForm.reset({ role: 'Mecanicien' });
      }
      this.showUserModal.set(true);
   }

   closeUserModal() {
      this.showUserModal.set(false);
   }

   submitUser() {
      if (this.userForm.invalid) return;
      const val = this.userForm.value;

      if (this.editingUserId()) {
         const original = this.dataService.staff().find(u => u.id === this.editingUserId());
         if (original) {
            this.dataService.updateStaff({ ...original, ...val });
            this.toastService.show('Utilisateur mis à jour', 'success');
         }
      } else {
         const newUser: AppUser = {
            id: crypto.randomUUID(),
            active: true,
            tenantId: this.dataService.currentTenantId() || undefined,
            ...val
         };
         this.dataService.addStaff(newUser);
         this.toastService.show('Utilisateur créé', 'success');
      }
      this.closeUserModal();
   }

   toggleUserActive(user: AppUser) {
      if (user.id === this.dataService.currentUser().id) {
         this.toastService.show("Vous ne pouvez pas désactiver votre propre compte.", 'error');
         return;
      }
      this.dataService.toggleStaffStatus(user.id);
      this.toastService.show(`Statut utilisateur ${user.active ? 'activé' : 'désactivé'}`, 'info');
   }

   // --- ROLE LOGIC ---

   getPermissionsByCategory(category: string) {
      return ALL_PERMISSIONS.filter(p => p.category === category);
   }

   isPermissionSelected(permId: string) {
      return this.selectedPermissions().includes(permId);
   }

   togglePermission(permId: string) {
      this.selectedPermissions.update(perms => {
         if (perms.includes(permId)) return perms.filter(p => p !== permId);
         return [...perms, permId];
      });
   }

   openRoleModal(role?: Role) {
      if (role) {
         this.editingRoleId.set(role.id);
         this.roleForm.patchValue({ name: role.name });
         this.selectedPermissions.set([...role.permissions]);
      } else {
         this.editingRoleId.set(null);
         this.roleForm.reset();
         this.selectedPermissions.set([]);
      }
      this.showRoleModal.set(true);
   }

   closeRoleModal() {
      this.showRoleModal.set(false);
   }

   submitRole() {
      if (this.roleForm.invalid) return;
      const name = this.roleForm.get('name')?.value;
      const permissions = this.selectedPermissions();

      if (this.editingRoleId()) {
         const original = this.dataService.roles().find(r => r.id === this.editingRoleId());
         if (original) {
            this.dataService.updateRole({ ...original, name, permissions });
            this.toastService.show('Rôle mis à jour', 'success');
         }
      } else {
         const newRole: Role = {
            id: crypto.randomUUID(),
            name,
            isSystem: false,
            permissions
         };
         this.dataService.addRole(newRole);
         this.toastService.show('Nouveau rôle créé', 'success');
      }
      this.closeRoleModal();
   }

   deleteRole(role: Role) {
      if (confirm(`Supprimer le rôle "${role.name}" ?`)) {
         this.dataService.deleteRole(role.id);
         this.toastService.show('Rôle supprimé', 'info');
      }
   }
}
