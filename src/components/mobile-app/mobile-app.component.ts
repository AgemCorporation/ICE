
import { Component, inject, signal, computed, effect, ChangeDetectorRef, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { DataService, QuoteRequest, Tenant, Invoice, RepairOrder, MotoristVehicle, CITIES, IVORY_COAST_LOCATIONS } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface WizardNode {
   id: string;
   question: string;
   type?: 'CHOICE' | 'ICON_GRID' | 'TEXT_INPUT' | 'PHOTO_REQ' | 'END';
   options?: { label: string; icon?: string; svgKey?: string; nextId: string; diagnosis?: string; color?: string }[];
   diagnosis?: string;
}

@Component({
   selector: 'app-mobile-app',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, FormsModule],
   template: `
    <div class="h-[100dvh] bg-slate-100 dark:bg-slate-950 flex justify-center overflow-hidden font-sans transition-colors duration-300 w-full fixed inset-0">
       <div class="w-full h-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col relative overflow-hidden">
          
          <!-- HEADER -->
          @if (currentUser()) {
             <header class="bg-indigo-600 dark:bg-indigo-700 text-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-md z-20 flex justify-between items-center shrink-0">
                <div class="flex items-center gap-2">
                   <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                   </div>
                   <h1 class="font-bold text-lg">MonAuto</h1>
                </div>
                <button (click)="logout()" class="text-white/80 hover:text-white text-xs font-medium">Déconnexion</button>
             </header>
          }

          <!-- CONTENT -->
          <main class="flex-1 overflow-y-auto scrollbar-hide relative bg-slate-50 dark:bg-slate-950 scroll-smooth touch-pan-y pb-[calc(6rem+env(safe-area-inset-bottom))]">
             
             <!-- 1. AUTH SCREEN -->
             @if (!currentUser()) {
                <div class="absolute inset-0 z-30 bg-gradient-to-br from-indigo-600 to-indigo-800 flex flex-col p-8 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] text-white overflow-y-auto scrollbar-hide h-full w-full">
                   <div class="flex-1 flex flex-col items-center justify-center text-center min-h-0">
                      <div class="w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-900/50 shrink-0">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      </div>
                      <h2 class="text-2xl font-bold mb-2">MonAuto</h2>
                      <p class="text-indigo-200 text-xs mb-8 max-w-[200px]">Votre réparateur idéal, au meilleur prix, où que vous soyez.</p>
                      
                      <div class="flex bg-black/20 p-1 rounded-xl mb-6 w-full max-w-xs shrink-0">
                         <button (click)="authMode.set('login')" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all" [class.bg-white]="authMode() === 'login'" [class.text-indigo-600]="authMode() === 'login'" [class.text-indigo-200]="authMode() !== 'login'">Connexion</button>
                         <button (click)="authMode.set('signup')" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all" [class.bg-white]="authMode() === 'signup'" [class.text-indigo-600]="authMode() === 'signup'" [class.text-indigo-200]="authMode() !== 'signup'">Inscription</button>
                      </div>

                      <form [formGroup]="loginForm" class="w-full space-y-3">
                         @if (authMode() === 'signup') {
                            <!-- Type de compte -->
                            <div class="flex p-1 bg-white/10 border border-indigo-400/30 rounded-xl mb-3 animate-slide-in">
                               <button type="button" (click)="loginForm.patchValue({type: 'Particulier'})" 
                                       class="flex-1 py-2 text-sm font-bold rounded-lg transition-colors"
                                       [class.bg-white]="loginForm.value.type === 'Particulier'" [class.text-indigo-600]="loginForm.value.type === 'Particulier'" [class.text-white]="loginForm.value.type !== 'Particulier'">
                                  Particulier
                               </button>
                               <button type="button" (click)="loginForm.patchValue({type: 'Entreprise'})" 
                                       class="flex-1 py-2 text-sm font-bold rounded-lg transition-colors"
                                       [class.bg-white]="loginForm.value.type === 'Entreprise'" [class.text-indigo-600]="loginForm.value.type === 'Entreprise'" [class.text-white]="loginForm.value.type !== 'Entreprise'">
                                  Entreprise
                               </button>
                            </div>

                            <!-- Nom complet / Raison sociale -->
                            <div class="relative group animate-slide-in">
                               <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                               <input formControlName="name" [placeholder]="loginForm.value.type === 'Entreprise' ? 'Nom de l\\'entreprise' : 'Nom Complet'" class="w-full bg-white/10 border border-indigo-400/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-indigo-300 focus:bg-white/20 focus:border-white/50 focus:ring-0 outline-none transition-all text-sm">
                            </div>
                            <!-- Numéro de téléphone -->
                            <div class="relative group animate-slide-in">
                               <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
                               <input formControlName="phone" type="tel" placeholder="Numéro de téléphone" class="w-full bg-white/10 border border-indigo-400/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-indigo-300 focus:bg-white/20 focus:border-white/50 focus:ring-0 outline-none transition-all text-sm">
                            </div>
                            <!-- Ville -->
                            <div class="relative group animate-slide-in">
                               <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                               <input formControlName="city" placeholder="Ville" class="w-full bg-white/10 border border-indigo-400/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-indigo-300 focus:bg-white/20 focus:border-white/50 focus:ring-0 outline-none transition-all text-sm">
                            </div>
                            <!-- Adresse -->
                            <div class="relative group animate-slide-in">
                               <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></div>
                               <input formControlName="address" placeholder="Adresse complète" class="w-full bg-white/10 border border-indigo-400/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-indigo-300 focus:bg-white/20 focus:border-white/50 focus:ring-0 outline-none transition-all text-sm">
                            </div>
                         }
                         <!-- Email (login/signup) -->
                         <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg></div>
                            <input formControlName="email" type="email" placeholder="Email" class="w-full bg-white/10 border border-indigo-400/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-indigo-300 focus:bg-white/20 focus:border-white/50 focus:ring-0 outline-none transition-all text-sm">
                         </div>
                         <!-- Password (login/signup) -->
                         <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                            <input formControlName="password" type="password" placeholder="Mot de passe" class="w-full bg-white/10 border border-indigo-400/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-indigo-300 focus:bg-white/20 focus:border-white/50 focus:ring-0 outline-none transition-all text-sm">
                         </div>
                         
                         <!-- Disable submit dynamically -> will adjust the condition in ts -->
                         <button type="button" (click)="submitAuth()" class="w-full bg-white text-indigo-600 font-bold py-3.5 rounded-xl shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {{ authMode() === 'login' ? 'Se connecter' : 'Créer mon compte' }}
                         </button>
                         @if (authMode() === 'login') {
                            <button type="button" (click)="forgotPasswordMode.set(true)" class="w-full text-center text-indigo-200 hover:text-white text-xs mt-3 transition-colors underline underline-offset-4">
                               Mot de passe oublié ?
                            </button>
                         }
                      </form>
                   </div>
                </div>
             }

             <!-- FORGOT PASSWORD MODAL -->
             @if (forgotPasswordMode()) {
                <div class="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
                   <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in">
                      <!-- Header -->
                      <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-center relative">
                         <button (click)="closeForgotPassword()" class="absolute top-3 right-3 text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                         <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                         </div>
                         <h3 class="text-white font-bold text-lg">Réinitialisation</h3>
                         <p class="text-indigo-100 text-xs mt-1">Récupérez l'accès à votre compte</p>
                      </div>
                      <div class="p-6">
                         @if (!forgotPasswordResult()) {
                            <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">Saisissez votre adresse email pour recevoir un nouveau mot de passe temporaire.</p>
                            <div class="relative group mb-4">
                               <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg></div>
                               <input [ngModel]="forgotPasswordEmail()" (ngModelChange)="forgotPasswordEmail.set($event)" type="email" placeholder="Votre adresse email" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                            </div>
                            <button (click)="submitForgotPassword()" [disabled]="forgotPasswordLoading()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                               @if (forgotPasswordLoading()) {
                                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  Réinitialisation...
                               } @else {
                                  Réinitialiser mon mot de passe
                               }
                            </button>
                         } @else {
                            <div class="text-center">
                               <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </div>
                               <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1">Mot de passe réinitialisé</h4>
                               <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ forgotPasswordResult()!.firstName }}, voici votre nouveau mot de passe temporaire :</p>
                               <div class="bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl p-4 mb-4">
                                  <span class="text-2xl font-mono font-bold tracking-[0.3em] text-indigo-600 dark:text-indigo-400 select-all">{{ forgotPasswordResult()!.tempPassword }}</span>
                               </div>
                               <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                                  <p class="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                     Notez ce mot de passe et utilisez-le pour vous connecter. Pensez à le changer dans votre profil.
                                  </p>
                               </div>
                               <button (click)="closeForgotPassword()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-all">
                                  Retour à la connexion
                               </button>
                            </div>
                         }
                      </div>
                   </div>
                </div>
             }

             <!-- 2. HOME TAB -->
             @if (currentUser() && activeTab() === 'home') {
                <div class="min-h-full flex flex-col">
                   <!-- MAP -->
                   <div class="sticky top-0 h-80 bg-slate-200 w-full shrink-0 overflow-hidden group z-0">
                      <div id="leaflet-map" class="absolute inset-0 w-full h-full z-0"></div>
                      @if (!userLocation()) {
                         <div class="absolute inset-x-0 top-3 flex justify-center z-10 pointer-events-none">
                            <div class="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                               <span class="animate-pulse">📍</span>
                               <span>Recherche de votre position...</span>
                            </div>
                         </div>
                      }
                   </div>

                   <!-- ACTIONS & INFO -->
                   <div class="flex-1 p-6 -mt-6 bg-white dark:bg-slate-900 rounded-t-3xl relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col gap-6 min-h-[calc(100vh-100px)]">
                      <div class="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto"></div>
                      
                      <!-- Greeting Section -->
                      <div class="text-center">
                         <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-1">Bonjour {{ firstName() }} 👋</h2>
                         <p class="text-slate-500 dark:text-slate-400 text-sm">Prêt pour la route ? Trouvez le meilleur garage autour de vous.</p>
                      </div>
                      
                      <button (click)="activeTab.set('create')" class="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-between group transition-all active:scale-[0.98]">
                         <div class="text-left"><div class="font-bold text-lg">Demander Devis</div><div class="text-xs text-indigo-100 opacity-80">Gratuit & Sans engagement</div></div>
                         <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">➜</div>
                      </button>

                      <!-- Nearby Garages List -->
                      <div class="flex flex-col gap-3">
                         <div class="flex justify-between items-center">
                            <h3 class="font-bold text-slate-900 dark:text-white text-lg">Nos Garages Partenaires</h3>
                         </div>
                         <!-- Filters -->
                         <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <select [ngModel]="cityFilter()" (ngModelChange)="updateCityFilter($event)" class="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-xs px-2 py-1 text-slate-900 dark:text-white">
                               <option value="">Toutes villes</option>
                               @for(c of cities; track c) { <option [value]="c">{{ c }}</option> }
                            </select>
                            <select [ngModel]="communeFilter()" (ngModelChange)="communeFilter.set($event)" class="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-xs px-2 py-1 text-slate-900 dark:text-white">
                               <option value="">Toutes communes</option>
                               @for(c of filterCommunes(); track c) { <option [value]="c">{{ c }}</option> }
                            </select>
                            <select [ngModel]="minRatingFilter()" (ngModelChange)="minRatingFilter.set($event)" class="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-xs px-2 py-1 text-slate-900 dark:text-white">
                               <option [ngValue]="0">Toutes notes</option>
                               <option [ngValue]="3">3+ Étoiles</option>
                               <option [ngValue]="4">4+ Étoiles</option>
                               <option [ngValue]="4.5">4.5+ Étoiles</option>
                            </select>
                         </div>

                         <!-- List -->
                         <div class="space-y-3">
                            @for (garage of nearbyGarages(); track garage.id) {
                               <div class="bg-white dark:bg-slate-900 p-3 rounded-xl border shadow-sm flex items-center justify-between group cursor-pointer transition-colors relative overflow-hidden"
                                    [class.border-amber-300]="garage.plan === 'ICE Full'"
                                    [class.dark:border-amber-700_50]="garage.plan === 'ICE Full'"
                                    [class.border-slate-200]="garage.plan !== 'ICE Full'"
                                    [class.dark:border-slate-800]="garage.plan !== 'ICE Full'"
                                    [class.hover:border-amber-400]="garage.plan === 'ICE Full'"
                                    [class.hover:border-indigo-400]="garage.plan !== 'ICE Full'"
                                    (click)="centerMapOnGarage(garage)">
                                  
                                  @if (garage.plan === 'ICE Full') {
                                     <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-xl"></div>
                                  }

                                  <div class="overflow-hidden pl-1">
                                     <div class="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-1">
                                        {{ garage.name }}
                                        @if (garage.plan === 'ICE Full') {
                                           <span class="text-xs">⭐</span>
                                        }
                                     </div>
                                     <div class="text-[10px] text-slate-500 truncate w-full">{{ garage.address || garage.city + (garage.commune ? ', ' + garage.commune : '') }}</div>
                                     @if (garage.plan === 'ICE Full') {
                                        <div class="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">Recommandé par Mécatech</div>
                                     }
                                     @if(garage.rating) {
                                        <div class="flex text-[10px] text-amber-400 mt-1">
                                           @for(i of [1,2,3,4,5]; track i) { <span [class.text-slate-300]="i > garage.rating!">★</span> }
                                           <span class="ml-1 text-slate-400 font-medium">({{ garage.rating }})</span>
                                        </div>
                                     }
                                  </div>
                                  <div class="flex items-center gap-2 shrink-0 z-10">
                                     <div class="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1.5 rounded-lg whitespace-nowrap">
                                        {{ garage.distance | number:'1.1-1' }} km
                                     </div>
                                     <button (click)="openGarageInfo(garage, $event)" class="p-1.5 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg transition-colors relative z-20" title="Voir les infos du garage">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                     </button>
                                  </div>
                               </div>
                            }
                            @if (nearbyGarages().length === 0) {
                               <div class="text-center py-4 text-slate-500 text-sm">Bientôt disponible.</div>
                            }
                         </div>
                      </div>
                   </div>
                </div>
             }

              <!-- 3. CREATE REQUEST TAB (STEP-BY-STEP WIZARD) -->
              @if (currentUser() && activeTab() === 'create') {
                 <div class="p-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
                    <div class="flex items-center gap-2 mb-4">
                       <button (click)="cancelRequestWizard()" class="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button>
                       <h2 class="text-xl font-bold text-slate-900 dark:text-white">Nouvelle Demande</h2>
                    </div>

                    <!-- Progress Bar -->
                    <div class="flex items-center gap-1 mb-6">
                       @for (s of [1,2,3,4,5,6,7,8]; track s) {
                          <div class="flex-1 h-1.5 rounded-full transition-all duration-300"
                               [class.bg-indigo-600]="s <= requestWizardStep()"
                               [class.dark:bg-indigo-500]="s <= requestWizardStep()"
                               [class.bg-slate-200]="s > requestWizardStep()"
                               [class.dark:bg-slate-700]="s > requestWizardStep()"></div>
                       }
                    </div>

                    <form [formGroup]="requestForm" class="space-y-6">

                       <!-- ===== STEP 1: Vehicle Selection ===== -->
                       @if (requestWizardStep() === 1) {
                          <div class="animate-fade-in">
                             <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Étape 1</h3>
                             <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Sélectionnez le véhicule concerné</p>
                             <div class="space-y-2">
                                <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                   @for (v of myVehicles(); track v.id) {
                                      <div (click)="selectVehicleForRequest(v)" class="min-w-[140px] p-3 rounded-xl border-2 cursor-pointer transition-all"
                                           [class.border-indigo-500]="requestForm.get('selectedVehicleId')?.value === v.id"
                                           [class.bg-indigo-50]="requestForm.get('selectedVehicleId')?.value === v.id"
                                           [class.dark:bg-indigo-900_20]="requestForm.get('selectedVehicleId')?.value === v.id"
                                           [class.border-slate-200]="requestForm.get('selectedVehicleId')?.value !== v.id"
                                           [class.bg-white]="requestForm.get('selectedVehicleId')?.value !== v.id"
                                           [class.dark:bg-slate-800]="requestForm.get('selectedVehicleId')?.value !== v.id"
                                           [class.dark:border-slate-700]="requestForm.get('selectedVehicleId')?.value !== v.id">
                                         <div class="font-bold text-sm text-slate-900 dark:text-white truncate">{{ v.brand }} {{ v.model }}</div>
                                         <div class="text-xs text-slate-500 dark:text-slate-400">{{ v.plate }}</div>
                                      </div>
                                   }
                                   <button type="button" (click)="openAddVehicleForm()" class="min-w-[50px] flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">+</button>
                                </div>
                             </div>
                             <button type="button" (click)="goToNextRequestStep()" [disabled]="!requestForm.get('selectedVehicleId')?.value" class="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-colors active:scale-[0.98]">Suivant</button>
                          </div>
                       }

                       <!-- ===== STEP 2: Type de besoin ===== -->
                       @if (requestWizardStep() === 2) {
                          <div class="animate-fade-in">
                             <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Étape 2</h3>
                             <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Que se passe-t-il avec votre véhicule ?</p>
                             <div class="grid grid-cols-2 gap-3">
                                @for (need of ['Ne démarre pas', 'Bruit / anomalie', 'Voyant allumé', 'Entretien', 'Accident', 'Autre']; track need) {
                                   <button type="button" (click)="toggleNeedType(need)" class="p-3 rounded-xl border-2 text-left transition-all active:scale-95 flex items-center gap-2" [class.border-indigo-500]="requestNeedType().includes(need)" [class.bg-indigo-50]="requestNeedType().includes(need)" [class.text-indigo-700]="requestNeedType().includes(need)" [class.border-slate-200]="!requestNeedType().includes(need)" [class.bg-white]="!requestNeedType().includes(need)" [class.text-slate-700]="!requestNeedType().includes(need)" [class.dark:bg-slate-800]="!requestNeedType().includes(need)" [class.dark:text-slate-300]="!requestNeedType().includes(need)" [class.dark:border-slate-700]="!requestNeedType().includes(need)">
                                      <div class="w-3 h-3 rounded-[3px] shrink-0" [class.bg-indigo-500]="requestNeedType().includes(need)" [class.bg-slate-200]="!requestNeedType().includes(need)" [class.dark:bg-slate-700]="!requestNeedType().includes(need)"></div>
                                      <span class="font-bold text-[13px] leading-tight">{{ need }}</span>
                                   </button>
                                }
                             </div>
                             <div class="flex gap-3 mt-6">
                                <button type="button" (click)="goToPrevRequestStep()" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors">Retour</button>
                                <button type="button" (click)="goToNextRequestStep()" [disabled]="requestNeedType().length === 0" class="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-colors active:scale-[0.98]">Suivant</button>
                             </div>
                          </div>
                       }

                       <!-- ===== STEP 3: Is vehicle drivable? ===== -->
                       @if (requestWizardStep() === 3) {
                          <div class="animate-fade-in">
                             <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Étape 3</h3>
                             <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Pouvez-vous encore rouler avec votre véhicule ?</p>
                             <div class="grid grid-cols-2 gap-4">
                                <button type="button" (click)="setVehicleDrivable(true)" class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all active:scale-95" [class.border-emerald-500]="isVehicleDrivable() === true" [class.bg-emerald-50]="isVehicleDrivable() === true" [class.border-slate-200]="isVehicleDrivable() !== true" [class.bg-white]="isVehicleDrivable() !== true" [class.dark:bg-slate-800]="isVehicleDrivable() !== true" [class.dark:border-slate-700]="isVehicleDrivable() !== true">
                                   <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3" [class.bg-emerald-100]="isVehicleDrivable() === true" [class.bg-slate-100]="isVehicleDrivable() !== true"><svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" [class.text-emerald-600]="isVehicleDrivable() === true" [class.text-slate-400]="isVehicleDrivable() !== true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></div>
                                   <span class="font-bold text-slate-900 dark:text-white">Oui</span>
                                   <span class="text-[10px] text-slate-400 mt-1">Il roule normalement</span>
                                </button>
                                <button type="button" (click)="setVehicleDrivable(false)" class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all active:scale-95" [class.border-red-500]="isVehicleDrivable() === false" [class.bg-red-50]="isVehicleDrivable() === false" [class.border-slate-200]="isVehicleDrivable() !== false" [class.bg-white]="isVehicleDrivable() !== false" [class.dark:bg-slate-800]="isVehicleDrivable() !== false" [class.dark:border-slate-700]="isVehicleDrivable() !== false">
                                   <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3" [class.bg-red-100]="isVehicleDrivable() === false" [class.bg-slate-100]="isVehicleDrivable() !== false"><svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" [class.text-red-600]="isVehicleDrivable() === false" [class.text-slate-400]="isVehicleDrivable() !== false" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></div>
                                   <span class="font-bold text-slate-900 dark:text-white">Non</span>
                                   <span class="text-[10px] text-slate-400 mt-1">Il est en panne</span>
                                </button>
                             </div>
                             <div class="flex gap-3 mt-6">
                                <button type="button" (click)="goToPrevRequestStep()" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors">Retour</button>
                                <button type="button" (click)="goToNextRequestStep()" [disabled]="isVehicleDrivable() === null" class="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-colors active:scale-[0.98]">Suivant</button>
                             </div>
                          </div>
                       }

                       <!-- ===== STEP 4: Urgency ===== -->
                       @if (requestWizardStep() === 4) {
                          <div class="animate-fade-in">
                             <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Étape 4</h3>
                             <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Quel est le niveau d'urgence ?</p>
                             <div class="space-y-3">
                                <button type="button" (click)="setUrgency('urgency_immediate')" class="w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-95" [class.border-red-500]="requestUrgency() === 'urgency_immediate'" [class.bg-red-50]="requestUrgency() === 'urgency_immediate'" [class.border-slate-200]="requestUrgency() !== 'urgency_immediate'" [class.bg-white]="requestUrgency() !== 'urgency_immediate'" [class.dark:bg-slate-800]="requestUrgency() !== 'urgency_immediate'" [class.dark:border-slate-700]="requestUrgency() !== 'urgency_immediate'">
                                   <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">🔴</div>
                                   <div class="flex flex-col">
                                      <span class="font-bold text-slate-900 dark:text-white">Urgent (immédiat)</span>
                                      <span class="text-xs text-slate-500 leading-tight">Je suis bloqué, intervenez maintenant !</span>
                                   </div>
                                </button>
                                <button type="button" (click)="setUrgency('urgency_today')" class="w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-95" [class.border-amber-500]="requestUrgency() === 'urgency_today'" [class.bg-amber-50]="requestUrgency() === 'urgency_today'" [class.border-slate-200]="requestUrgency() !== 'urgency_today'" [class.bg-white]="requestUrgency() !== 'urgency_today'" [class.dark:bg-slate-800]="requestUrgency() !== 'urgency_today'" [class.dark:border-slate-700]="requestUrgency() !== 'urgency_today'">
                                   <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">🟡</div>
                                   <div class="flex flex-col">
                                      <span class="font-bold text-slate-900 dark:text-white">Aujourd'hui</span>
                                      <span class="text-xs text-slate-500 leading-tight">J'aimerais régler ça dans la journée.</span>
                                   </div>
                                </button>
                                <button type="button" (click)="setUrgency('urgency_flexible')" class="w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-95" [class.border-emerald-500]="requestUrgency() === 'urgency_flexible'" [class.bg-emerald-50]="requestUrgency() === 'urgency_flexible'" [class.border-slate-200]="requestUrgency() !== 'urgency_flexible'" [class.bg-white]="requestUrgency() !== 'urgency_flexible'" [class.dark:bg-slate-800]="requestUrgency() !== 'urgency_flexible'" [class.dark:border-slate-700]="requestUrgency() !== 'urgency_flexible'">
                                   <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">🟢</div>
                                   <div class="flex flex-col">
                                      <span class="font-bold text-slate-900 dark:text-white">Flexible</span>
                                      <span class="text-xs text-slate-500 leading-tight">Pas d'urgence extrême.</span>
                                   </div>
                                </button>
                             </div>
                             <div class="flex gap-3 mt-6">
                                <button type="button" (click)="goToPrevRequestStep()" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors">Retour</button>
                                <button type="button" (click)="goToNextRequestStep()" [disabled]="!requestUrgency()" class="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-colors active:scale-[0.98]">Suivant</button>
                             </div>
                          </div>
                       }

                       <!-- ===== STEP 5: Description & Photos ===== -->
                       @if (requestWizardStep() === 5) {
                          <div class="animate-fade-in">
                             <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Étape 5</h3>
                             <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Plus vous êtes précis, plus vos devis seront fiables.</p>
                             <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div>
                                   <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Description du problème</label>
                                   <textarea formControlName="description" rows="4" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white" placeholder="Décrivez le problème de votre véhicule... (bruits, voyants allumés, circonstances)"></textarea>
                                </div>
                                <div>
                                   <label class="text-xs font-bold text-slate-400 uppercase block mb-2">Photos (Optionnel)</label>
                                   <div class="flex gap-2 overflow-x-auto pb-2">
                                      <button type="button" (click)="takePhoto()" class="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg cursor-pointer bg-white dark:bg-slate-900 hover:bg-indigo-50 transition-colors shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span class="text-[10px] text-indigo-600 font-bold">Ajouter</span></button>
                                      <input type="file" id="mobilePhotoInput" accept="image/*" capture="environment" (change)="onRequestPhotoSelected($event)" class="hidden">
                                      @for (photo of requestPhotos(); track $index) {
                                         <div class="relative w-20 h-20 shrink-0">
                                            <img [src]="photo" class="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700">
                                            <button type="button" (click)="removeRequestPhoto($index)" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md w-6 h-6 flex items-center justify-center text-xs">✕</button>
                                         </div>
                                      }
                                   </div>
                                </div>
                             </div>
                             <div class="flex gap-3 mt-6">
                                <button type="button" (click)="goToPrevRequestStep()" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors">Retour</button>
                                <button type="button" (click)="goToNextRequestStep()" class="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors active:scale-[0.98]">Suivant</button>
                             </div>
                          </div>
                       }

                       <!-- ===== STEP 6: Service ===== -->
                       @if (requestWizardStep() === 6) {
                          <div class="animate-fade-in">
                             <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Étape 6</h3>
                             <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Comment souhaitez-vous être pris en charge ?</p>
                             <div class="space-y-3">
                                <button type="button" (click)="setServiceType('tech_home')" class="w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-95" [class.border-indigo-500]="requestServiceType() === 'tech_home'" [class.bg-indigo-50]="requestServiceType() === 'tech_home'" [class.border-slate-200]="requestServiceType() !== 'tech_home'" [class.bg-white]="requestServiceType() !== 'tech_home'" [class.dark:bg-slate-800]="requestServiceType() !== 'tech_home'" [class.dark:border-slate-700]="requestServiceType() !== 'tech_home'">
                                   <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                                   <div class="flex flex-col flex-1">
                                      <span class="font-bold text-slate-900 dark:text-white">Technicien à domicile</span>
                                      <span class="text-[11px] text-slate-500 leading-tight">Intervention sur place + diagnostic complet</span>
                                   </div>
                                </button>
                                <button type="button" (click)="setServiceType('towing')" class="w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-95" [class.border-amber-500]="requestServiceType() === 'towing'" [class.bg-amber-50]="requestServiceType() === 'towing'" [class.border-slate-200]="requestServiceType() !== 'towing'" [class.bg-white]="requestServiceType() !== 'towing'" [class.dark:bg-slate-800]="requestServiceType() !== 'towing'" [class.dark:border-slate-700]="requestServiceType() !== 'towing'">
                                   <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></div>
                                   <div class="flex flex-col flex-1">
                                      <span class="font-bold text-slate-900 dark:text-white">Remorquage</span>
                                      <span class="text-[11px] text-slate-500 leading-tight">Vers notre garage le plus proche</span>
                                   </div>
                                </button>
                                <button type="button" (click)="setServiceType('garage_drop')" class="w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-95" [class.border-emerald-500]="requestServiceType() === 'garage_drop'" [class.bg-emerald-50]="requestServiceType() === 'garage_drop'" [class.border-slate-200]="requestServiceType() !== 'garage_drop'" [class.bg-white]="requestServiceType() !== 'garage_drop'" [class.dark:bg-slate-800]="requestServiceType() !== 'garage_drop'" [class.dark:border-slate-700]="requestServiceType() !== 'garage_drop'">
                                   <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                                   <div class="flex flex-col flex-1">
                                      <span class="font-bold text-slate-900 dark:text-white">Dépôt garage</span>
                                      <span class="text-[11px] text-slate-500 leading-tight">Je peux me rendre au garage par moi-même</span>
                                   </div>
                                </button>
                             </div>
                             @if (requestServiceType() === 'tech_home') {
                                <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4 flex items-center gap-2 animate-fade-in">
                                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                   <div class="flex flex-col gap-0.5">
                                      <span class="text-xs text-amber-800 dark:text-amber-300 font-bold">Frais de déplacement : 5000F</span>
                                      <span class="text-xs text-amber-800 dark:text-amber-300 font-bold leading-tight">Frais de diagnostic : 10.000F <br><span class="font-medium italic">(Remboursé en cas de réparation dans le réseau)</span></span>
                                   </div>
                                </div>
                             }
                             <div class="flex gap-3 mt-6">
                                <button type="button" (click)="goToPrevRequestStep()" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors">Retour</button>
                                <button type="button" (click)="goToNextRequestStep()" [disabled]="!requestServiceType()" class="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-colors active:scale-[0.98]">Suivant</button>
                             </div>
                          </div>
                       }

                       <!-- ===== STEP 7: Localisation + Date ===== -->
                       @if (requestWizardStep() === 7) {
                          <div class="animate-fade-in">
                             <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Étape 7</h3>
                             <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Où et quand voulez-vous être pris en charge ?</p>
                             <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div>
                                   <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Localisation</label>
                                   <div class="flex gap-2">
                                      <select formControlName="locationCity" (change)="onRequestCityChange()" class="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm p-2 text-slate-900 dark:text-white"><option value="">Ville...</option>@for(c of requestWizardCities(); track c) { <option [value]="c">{{ c }}</option> }</select>
                                      <select formControlName="locationCommune" class="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm p-2 text-slate-900 dark:text-white"><option value="">Commune...</option>@for(c of requestCommunes(); track c) { <option [value]="c">{{ c }}</option> }</select>
                                   </div>
                                   <div class="mt-2">
                                      <input type="text" formControlName="locationQuarter" placeholder="Quartier (Ex: Zone 4, Riviera...)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm p-2 text-slate-900 dark:text-white">
                                   </div>
                                </div>
                                <div>
                                   <label class="text-xs font-bold text-slate-400 uppercase block mb-1">Date souhaitée</label>
                                   <input type="date" formControlName="interventionDate" [min]="minInterventionDate()" [max]="maxInterventionDate()" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white">
                                </div>
                             </div>
                             <div class="flex gap-3 mt-6">
                                <button type="button" (click)="goToPrevRequestStep()" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors">Retour</button>
                                <button type="button" (click)="goToNextRequestStep()" [disabled]="!requestForm.get('locationCity')?.value" class="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-colors active:scale-[0.98]">Suivant</button>
                             </div>
                          </div>
                       }

                       <!-- ===== STEP 8: Validation (Estimation) ===== -->
                       @if (requestWizardStep() === 8) {
                          <div class="animate-fade-in">
                             <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">Dernière vérification</h3>
                             <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Votre demande est prête à être envoyée :</p>
                             <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800 mb-6 shadow-sm">
                                <div class="space-y-4">
                                   <!-- Item 1: Garages Count -->
                                   <div class="flex items-start gap-3">
                                      <div class="shrink-0 mt-0.5">
                                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      </div>
                                      <div class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                         <span class="font-bold text-slate-900 dark:text-white">Plusieurs garages disponibles</span> autour de vous prêts à intervenir
                                      </div>
                                   </div>

                                   <!-- Item 3: Delai -->
                                   <div class="flex items-start gap-3 border-t border-indigo-100 dark:border-indigo-800/50 pt-3">
                                      <div class="shrink-0 mt-0.5">
                                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                      </div>
                                      <div class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                         Réponse rapide
                                         @if (requestUrgency() === 'urgency_immediate') {
                                            <span class="font-bold text-slate-900 dark:text-white">sous 2 heures</span>
                                         } @else if (requestUrgency() === 'urgency_today') {
                                            <span class="font-bold text-slate-900 dark:text-white">dans la journée</span>
                                         } @else {
                                            <span class="font-bold text-slate-900 dark:text-white">sous 24/48h</span>
                                         }
                                      </div>
                                   </div>

                                   <!-- Item 4: Gratuit -->
                                   <div class="flex items-start gap-3 border-t border-indigo-100 dark:border-indigo-800/50 pt-3">
                                      <div class="shrink-0 mt-0.5">
                                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                      </div>
                                      <div class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                         <span class="font-bold text-slate-900 dark:text-white">Devis gratuit</span> & sans engagement
                                      </div>
                                   </div>
                                </div>
                             </div>
                             <div class="flex gap-3">
                                <button type="button" (click)="goToPrevRequestStep()" class="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors">Retour</button>
                                <button type="button" (click)="submitRequest()" class="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors active:scale-[0.98]">Recevoir mes devis</button>
                             </div>
                          </div>
                       }

                       <!-- ===== STEP 9: Confirmation & Contact Info ===== -->
                       @if (requestWizardStep() === 9) {
                          <div class="animate-zoom-in text-center py-6">
                             <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                             </div>
                             <h3 class="font-bold text-2xl text-slate-900 dark:text-white mb-2">Demande Envoyée !</h3>
                             <p class="text-slate-500 dark:text-slate-400 mb-8">Votre demande d'intervention a été transmise avec succès aux garages partenaires ICE.</p>

                             <div class="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 text-left mb-8 shadow-sm">
                                <h4 class="font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                   Assistance Call Center ICE
                               </h4>
                                <div class="space-y-3">
                                   <div class="flex items-start gap-3">
                                      <div class="mt-0.5 w-6 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                      <div>
                                         <p class="text-sm font-medium text-slate-800 dark:text-slate-200">Horaires d'ouverture</p>
                                         <p class="text-xs text-slate-500 dark:text-slate-400">Lun-Ven : 08h00 - 18h00</p>
                                         <p class="text-xs text-slate-500 dark:text-slate-400">Samedi : 08h00 - 13h00</p>
                                      </div>
                                   </div>
                                   <div class="flex items-start gap-3">
                                      <div class="mt-0.5 w-6 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
                                      <div>
                                         <p class="text-sm font-medium text-slate-800 dark:text-slate-200">Nous contacter</p>
                                         <a href="tel:+2250576666601" class="block text-sm text-indigo-600 dark:text-indigo-400 font-bold mt-1">+225 05 76 66 66 01</a>
                                         <a href="tel:+2250748343440" class="block text-sm text-indigo-600 dark:text-indigo-400 font-bold mt-1">+225 07 48 34 34 40</a>
                                      </div>
                                   </div>
                                </div>
                             </div>

                             <button type="button" (click)="closeSuccessWizard()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Suivre mes demandes
                             </button>
                          </div>
                       }


                    </form>
                 </div>
              }
             <!-- 4. REQUESTS LIST TAB -->
             @if (currentUser() && activeTab() === 'requests') {
                <div class="p-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
                   <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Mon Suivi</h2>
                   
                   <!-- VIEW TOGGLE -->
                   <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
                      <button (click)="requestsView.set('demandes')" class="flex-1 py-1.5 text-xs font-bold rounded-md transition-all" [class.bg-white]="requestsView() === 'demandes'" [class.dark:bg-slate-700]="requestsView() === 'demandes'" [class.shadow]="requestsView() === 'demandes'" [class.text-indigo-600]="requestsView() === 'demandes'" [class.dark:text-indigo-400]="requestsView() === 'demandes'" [class.text-slate-500]="requestsView() !== 'demandes'">Mes demandes</button>
                      <button (click)="requestsView.set('factures')" class="flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1" [class.bg-white]="requestsView() === 'factures'" [class.dark:bg-slate-700]="requestsView() === 'factures'" [class.shadow]="requestsView() === 'factures'" [class.text-indigo-600]="requestsView() === 'factures'" [class.dark:text-indigo-400]="requestsView() === 'factures'" [class.text-slate-500]="requestsView() !== 'factures'">
                         Mes factures
                         @if (myInvoices().length > 0) {
                            <span class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[9px] px-1.5 py-0.5 rounded-full">{{ myInvoices().length }}</span>
                         }
                      </button>
                   </div>

                   @if (requestsView() === 'demandes') {
                      <!-- FILTERS -->
                      <div class="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        <select [ngModel]="requestsVehicleFilter()" (ngModelChange)="requestsVehicleFilter.set($event)" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Tous véhicules</option>
                            @for(v of myVehicles(); track v.id) { <option [value]="v.id">{{ v.brand }} {{ v.model }}</option> }
                        </select>
                        <select [ngModel]="requestsStatusFilter()" (ngModelChange)="requestsStatusFilter.set($event)" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Tous statuts</option>
                            <option value="NEW">En attente</option>
                            <option value="QUOTE_SUBMITTED">Demande Envoyée</option>
                            <option value="CONVERTED">Terminé/Validé</option>
                        </select>
                   </div>

                   <div class="space-y-4">
                      @for (req of filteredRequests(); track req.id) {
                         <div (click)="viewRequestInfo(req)" class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 cursor-pointer active:scale-[0.99] transition-transform">
                            <div class="flex items-center gap-2">
                               <div class="flex-1 min-w-0">
                                  <div class="flex justify-between items-start mb-2">
                               <div class="flex flex-col">
                                  <div class="flex items-center gap-2 mb-1">
                                     <div class="font-bold text-slate-900 dark:text-white leading-none">{{ req.vehicleBrand }} {{ req.vehicleModel }}</div>
                                     <span class="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Réf: {{ getRef(req.id) }}</span>
                                  </div>
                                  @if (req.isDirectRequest) {
                                     <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        Demande Directe: {{ getGarageName(req.directTenantId!) }}
                                     </span>
                                  }
                               </div>
                               <span class="text-[10px] px-2 py-1 rounded-full font-bold uppercase" 
                                  [class.bg-blue-100]="req.status === 'NEW' || req.status === 'DISPATCHED'" [class.text-blue-700]="req.status === 'NEW' || req.status === 'DISPATCHED'"
                                  [class.bg-emerald-100]="req.status === 'CONVERTED' || req.status === 'COMPLETED'" [class.text-emerald-700]="req.status === 'CONVERTED' || req.status === 'COMPLETED'">
                                  {{ translateStatus(req.status) }}
                               </span>
                            </div>
                            <!-- Tags -->
                            <div class="flex flex-wrap gap-1.5 mb-2 mt-1">
                               @if (hasTag(req, 'drivable')) { <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg> Roulant</span> }
                               @if (hasTag(req, 'not_drivable')) { <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> En panne</span> }
                               @if (hasTag(req, 'technician')) { <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Technicien</span> }
                               @if (hasTag(req, 'towing')) { <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> Remorquage</span> }
                            </div>
                            @if(getCleanDescription(req.adminDescription)) {
                               <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2"><span class="font-bold text-indigo-600 dark:text-indigo-400 mr-1">Diag ICE:</span>{{ getCleanDescription(req.adminDescription) }}</p>
                            } @else {
                               <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{{ getCleanDescription(req.description) }}</p>
                            }
                            
                            <!-- Display Proposed Quotes (Only if Validated by Admin) -->
                            @if (req.status === 'COMPLETED' || req.status === 'CONVERTED') {
                               @if (req.proposedQuotes && req.proposedQuotes.length > 0) {
                                   <div class="space-y-2">
                                      @let visibleQuotes = getVisibleQuotes(req);
                                      @for (quoteId of visibleQuotes; track quoteId) {
                                         @let quote = getQuote(quoteId);
                                         @let tenant = getTenantByQuoteId(quoteId);
                                         @if (quote) {
                                            <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border relative z-10 transition-all" 
                                                  [class.border-emerald-500]="req.acceptedQuoteId === quote.id"
                                                  [class.border-amber-400]="req.recommendedQuoteIds?.includes(quote.id) && req.acceptedQuoteId !== quote.id"
                                                  [class.border-slate-100]="req.acceptedQuoteId !== quote.id && !req.recommendedQuoteIds?.includes(quote.id)"
                                                  [class.dark:border-slate-800]="req.acceptedQuoteId !== quote.id && !req.recommendedQuoteIds?.includes(quote.id)"
                                                  [class.shadow-md]="req.recommendedQuoteIds?.includes(quote.id) && req.acceptedQuoteId !== quote.id">
                                                
                                                @if (req.recommendedQuoteIds?.includes(quote.id)) {
                                                   <div class="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full mb-2 border border-amber-200 dark:border-amber-800 shadow-sm">
                                                      ✨ RECOMMANDÉ PAR ICE
                                                   </div>
                                                }

                                               <div class="flex justify-between items-start mb-2">
                                                  <div class="overflow-hidden pr-2">
                                                     <div class="font-bold text-slate-900 dark:text-white text-xs truncate w-full">{{ tenant?.name }}</div>
                                                     <div class="text-[10px] text-slate-500 mb-1 truncate w-full">{{ tenant?.address || tenant?.city + (tenant?.commune ? ', ' + tenant?.commune : '') }}</div>
                                                     @if(tenant?.rating) {
                                                        <div class="flex text-[10px] text-amber-400">
                                                           @for(i of [1,2,3,4,5]; track i) { <span [class.text-slate-300]="i > tenant!.rating!">★</span> }
                                                           <span class="ml-1 text-slate-400 font-medium">({{ tenant!.rating }})</span>
                                                        </div>
                                                     }
                                                  </div>
                                                  <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{{ quote.totalTTC | number }} F</span>
                                               </div>
                                               
                                               @if (req.status === 'CONVERTED' && req.acceptedQuoteId === quote.id) {
                                                  <div class="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 py-1 rounded">Devis Accepté ✓</div>
                                                  @let repairStatus = req.repairStatus || getRepairStatus(req.repairOrderId);
                                                  @if (quote.restitutionDate && repairStatus !== 'Clôturé') {
                                                     <div class="mt-2 text-center text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 py-1 rounded">
                                                         Restitution prévue le : <b>{{ quote.restitutionDate | date:'dd/MM/yyyy' }}</b>
                                                     </div>
                                                  }
                                                  
                                                  @if(repairStatus) {
                                                      @if(req.repairOrderId) {
                                                         <div class="mt-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            Réf. Atelier : <span class="font-mono text-indigo-600 dark:text-indigo-400">OR #{{ req.repairOrderId.substring(0,6) }}</span>
                                                         </div>
                                                      }
                                                      <div class="mt-2 text-center text-xs font-bold px-2 py-1 rounded"
                                                          [ngClass]="{
                                                              'bg-amber-100 text-amber-700': repairStatus === 'En attente',
                                                              'bg-blue-100 text-blue-700': repairStatus === 'En cours',
                                                              'bg-purple-100 text-purple-700': repairStatus === 'Terminé',
                                                              'bg-emerald-100 text-emerald-700': repairStatus === 'Clôturé'
                                                          }">
                                                          Travaux : {{ repairStatus }}
                                                      </div>
                                                      @if(repairStatus === 'Clôturé' && !req.clientRating) {
                                                         <button (click)="$event.stopPropagation(); openRateModal(req)" class="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-1 z-20 relative">
                                                             <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                             Évaluer la prestation
                                                         </button>
                                                      }
                                                      @if(req.clientRating) {
                                                          <div class="mt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                                                             Avis laissé : <span class="text-amber-500 font-bold">{{ req.clientRating }} ★</span>
                                                          </div>
                                                      }
                                                  } @else {
                                                      <div class="mt-2 text-center text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 py-1 rounded">
                                                          En attente de prise en charge par l'atelier...
                                                      </div>
                                                  }
                                               } @else if (req.status !== 'CONVERTED') {
                                                  <button (click)="$event.stopPropagation(); viewQuoteDetails(req, quote)" class="w-full text-center text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2 rounded text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors z-20 relative">Voir détails</button>
                                               }
                                            </div>
                                         }
                                      }
                                      @if (visibleQuotes.length === 0) {
                                         <div class="text-center p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                                            <span class="text-xs text-slate-500 dark:text-slate-400 italic">Vos devis sont en cours de préparation par nos experts... De retour très vite !</span>
                                         </div>
                                      }
                                   </div>
                               } @else if (req.garageQuoteId) {
                                  <!-- Fallback for legacy / direct scan single quote -->
                                  @let quote = getQuote(req.garageQuoteId);
                                  @if (quote) {
                                     <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mb-3 relative z-10">
                                         <div class="flex justify-between items-center mb-1">
                                            <span class="font-bold text-slate-700 dark:text-slate-300 text-xs">Devis de {{ getTenantByQuoteId(req.garageQuoteId!)?.name || 'Garage Inconnu' }}</span>
                                           <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ quote.totalTTC | number }} CFA</span>
                                        </div>
                                        
                                        @if (req.status === 'CONVERTED' && req.acceptedQuoteId === quote.id) {
                                           <div class="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 py-1 rounded mt-2">Devis Accepté ✓</div>
                                           @let repairStatus = getRepairStatus(req.repairOrderId);
                                           @if(repairStatus) {
                                               @if(req.repairOrderId) {
                                                  <div class="mt-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                     Réf. Atelier : <span class="font-mono text-indigo-600 dark:text-indigo-400">OR #{{ req.repairOrderId.substring(0,6) }}</span>
                                                  </div>
                                               }
                                               <div class="mt-2 text-center text-xs font-bold px-2 py-1 rounded"
                                                   [ngClass]="{
                                                       'bg-amber-100 text-amber-700': repairStatus === 'En attente',
                                                       'bg-blue-100 text-blue-700': repairStatus === 'En cours',
                                                       'bg-purple-100 text-purple-700': repairStatus === 'Terminé',
                                                       'bg-emerald-100 text-emerald-700': repairStatus === 'Clôturé'
                                                   }">
                                                   Travaux : {{ repairStatus }}
                                               </div>
                                               @if(repairStatus === 'Clôturé' && !req.clientRating) {
                                                  <button (click)="$event.stopPropagation(); openRateModal(req)" class="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-1 z-20 relative">
                                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                      Évaluer la prestation
                                                  </button>
                                               }
                                               @if(req.clientRating) {
                                                   <div class="mt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                                                      Avis laissé : <span class="text-amber-500 font-bold">{{ req.clientRating }} ★</span>
                                                   </div>
                                               }
                                           } @else {
                                               <div class="mt-2 text-center text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 py-1 rounded">
                                                   En attente de prise en charge par l'atelier...
                                               </div>
                                           }
                                        } @else if (req.status !== 'CONVERTED') {
                                           <button (click)="$event.stopPropagation(); viewQuoteDetails(req, quote)" class="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline z-20 relative mt-2">Voir détails</button>
                                        }
                                     </div>
                                  }
                               }
                            } @else if (req.status === 'QUOTE_SUBMITTED') {
                               <div class="text-center p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                                  <span class="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center gap-1">
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                     Analyse en cours par nos experts...
                                  </span>
                               </div>
                            }
                            </div>
                               <div class="text-slate-300 dark:text-slate-600 shrink-0 ml-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                               </div>
                            </div>
                         </div>
                      }
                      @if (filteredRequests().length === 0) { <div class="text-center py-12 text-slate-400 text-sm">Aucune demande trouvée.</div> }
                   </div>
                   } @else {
                      <div class="space-y-4">
                         @if (myInvoices().length === 0) {
                            <div class="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                               <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                               </div>
                               <h4 class="font-bold text-slate-900 dark:text-white mb-2">Aucune facture</h4>
                               <p class="text-sm text-slate-500 dark:text-slate-400">Vos factures traitées par nos partenaires apparaîtront ici.</p>
                            </div>
                         } @else {
                            @for (invoice of myInvoices(); track invoice.id) {
                               <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-3">
                                  <div class="flex justify-between items-start">
                                     <div>
                                        <div class="flex items-center gap-2 mb-1">
                                           <span class="font-bold text-slate-900 dark:text-white">{{ invoice.number }}</span>
                                           <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                                              [class.bg-emerald-100]="invoice.status === 'PAYE'" [class.text-emerald-700]="invoice.status === 'PAYE'" [class.dark:bg-emerald-900/30]="invoice.status === 'PAYE'" [class.dark:text-emerald-400]="invoice.status === 'PAYE'"
                                              [class.bg-amber-100]="invoice.status === 'ENVOYE' || invoice.status === 'PARTIEL'" [class.text-amber-700]="invoice.status === 'ENVOYE' || invoice.status === 'PARTIEL'" [class.dark:bg-amber-900/30]="invoice.status === 'ENVOYE' || invoice.status === 'PARTIEL'" [class.dark:text-amber-400]="invoice.status === 'ENVOYE' || invoice.status === 'PARTIEL'">
                                              {{ invoice.status === 'ENVOYE' ? 'À RÉGLER' : (invoice.status === 'PAYE' ? 'PAYÉE' : invoice.status) }}
                                           </span>
                                        </div>
                                        <div class="text-xs text-slate-500 font-bold mb-0.5">{{ getGarageName(invoice.tenantId) }}</div>
                                        @if (invoice.repairId) {
                                           <div class="text-[10px] text-slate-400">Réf. Atelier : <span class="font-mono">OR #{{ invoice.repairId.substring(0,6) }}</span></div>
                                        }
                                     </div>
                                     <div class="text-right">
                                        <div class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ invoice.totalTTC | number }} F</div>
                                        <div class="text-[10px] text-slate-400">{{ invoice.date | date:'dd/MM/yyyy' }}</div>
                                     </div>
                                  </div>
                                  @if (invoice.vehicleDescription) {
                                     <div class="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                                        <span class="font-bold">Véhicule :</span> {{ invoice.vehicleDescription }}
                                     </div>
                                  }
                                  <div class="flex gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                     <button (click)="viewInvoice(invoice)" class="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 py-2 rounded-xl text-xs font-bold transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        Consulter
                                     </button>
                                     @if (invoice.status !== 'PAYE') {
                                        <button (click)="payInvoice(invoice)" class="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold transition-colors shadow-sm">
                                           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                           Payer en ligne
                                        </button>
                                     }
                                  </div>
                               </div>
                            }
                         }
                      </div>
                   }
                </div>
             }

             <!-- 5. NEW TAB: VEHICLES -->
             @if (currentUser() && activeTab() === 'vehicles') {
                <div class="p-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
                   <div class="flex justify-between items-center mb-4">
                      <h2 class="text-xl font-bold text-slate-900 dark:text-white">Mes Véhicules</h2>
                      <button (click)="openAddVehicleForm()" class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 p-2 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                      </button>
                   </div>
                   
                   <div class="space-y-4">
                      @for (v of myVehicles(); track v.id) {
                         <div (click)="editVehicle(v)" class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                            <div class="flex justify-between items-start mb-2">
                               <div class="font-bold text-lg text-slate-900 dark:text-white">{{ v.brand }} {{ v.model }}</div>
                               <span class="font-mono bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">{{ v.plate }}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                               <div>Année: <span class="font-medium text-slate-700 dark:text-slate-300">{{ v.year }}</span></div>
                               <div>Carburant: <span class="font-medium text-slate-700 dark:text-slate-300">{{ v.fuel }}</span></div>
                               <div>KM: <span class="font-medium text-slate-700 dark:text-slate-300">{{ v.mileage }}</span></div>
                               <div>VIN: <span class="font-mono text-slate-700 dark:text-slate-300">{{ v.vin || '-' }}</span></div>
                            </div>
                            @if(v.insuranceProvider) {
                               <div class="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                                  Assurance: {{ v.insuranceProvider }}
                               </div>
                            }
                         </div>
                      }
                      @if (myVehicles().length === 0) {
                         <div class="text-center py-12 flex flex-col items-center">
                            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400">
                               <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0" /></svg>
                            </div>
                            <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">Aucun véhicule enregistré.</p>
                            <button (click)="openAddVehicleForm()" class="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">Ajouter mon premier véhicule</button>
                         </div>
                      }
                   </div>
                </div>
             }

             <!-- 6. PROFILE TAB -->
             @if (currentUser() && activeTab() === 'profile') {
                <div class="p-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
                   <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-6">Mon Profil</h2>
                   <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center mb-6">
                      <div class="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold mb-3">{{ currentUser()?.charAt(0) }}</div>
                      <h3 class="font-bold text-lg text-slate-900 dark:text-white">{{ currentUser() }}</h3>
                      <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">{{ currentPhone() }}</p>

                      @if(qrCodeUrl()) {
                         <div class="p-2 bg-white rounded-xl border border-slate-200/60 shadow-sm mt-2">
                            <img [src]="qrCodeUrl()" alt="Mon QR Code ICE" class="w-32 h-32 object-contain mix-blend-multiply" />
                         </div>
                         <p class="text-[10px] text-slate-400 mt-2 text-center max-w-[200px] leading-tight">Présentez ce QR Code lors de votre passage en atelier pour être identifié rapidement.</p>
                      }
                   </div>
                   
                   @if (showInvoicesModal()) {
             <div class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col animate-fade-in">
                 <div class="flex-1 overflow-hidden flex flex-col mt-[calc(1rem+env(safe-area-inset-top))] rounded-t-2xl bg-slate-50 dark:bg-slate-950">
                   <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                      <h3 class="font-bold text-lg text-slate-900 dark:text-white">Mes Factures</h3>
                      <button (click)="closeInvoices()" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">✕</button>
                   </div>
                   
                   <div class="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] content-area space-y-4">
                      @if (myInvoices().length === 0) {
                         <div class="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                               <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                            </div>
                            <h4 class="font-bold text-slate-900 dark:text-white mb-2">Aucune facture</h4>
                            <p class="text-sm text-slate-500 dark:text-slate-400">Vos factures traitées par nos partenaires apparaîtront ici.</p>
                         </div>
                      } @else {
                         @for (invoice of myInvoices(); track invoice.id) {
                            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-3">
                               <div class="flex justify-between items-start">
                                  <div>
                                     <div class="flex items-center gap-2 mb-1">
                                        <span class="font-bold text-slate-900 dark:text-white">{{ invoice.number }}</span>
                                        <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                                           [class.bg-emerald-100]="invoice.status === 'PAYE'" [class.text-emerald-700]="invoice.status === 'PAYE'" [class.dark:bg-emerald-900/30]="invoice.status === 'PAYE'" [class.dark:text-emerald-400]="invoice.status === 'PAYE'"
                                           [class.bg-amber-100]="invoice.status === 'ENVOYE' || invoice.status === 'PARTIEL'" [class.text-amber-700]="invoice.status === 'ENVOYE' || invoice.status === 'PARTIEL'" [class.dark:bg-amber-900/30]="invoice.status === 'ENVOYE' || invoice.status === 'PARTIEL'" [class.dark:text-amber-400]="invoice.status === 'ENVOYE' || invoice.status === 'PARTIEL'">
                                           {{ invoice.status === 'ENVOYE' ? 'À RÉGLER' : (invoice.status === 'PAYE' ? 'PAYÉE' : invoice.status) }}
                                        </span>
                                     </div>
                                     <div class="text-xs text-slate-500 font-bold mb-0.5">{{ getGarageName(invoice.tenantId) }}</div>
                                     @if (invoice.repairId) {
                                        <div class="text-[10px] text-slate-400">Réf. Atelier : <span class="font-mono">OR #{{ invoice.repairId.substring(0,6) }}</span></div>
                                     }
                                  </div>
                                  <div class="text-right">
                                     <div class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ invoice.totalTTC | number }} F</div>
                                     <div class="text-[10px] text-slate-400">{{ invoice.date | date:'dd/MM/yyyy' }}</div>
                                  </div>
                               </div>
                               
                               @if (invoice.vehicleDescription) {
                                  <div class="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                                     <span class="font-bold">Véhicule :</span> {{ invoice.vehicleDescription }}
                                  </div>
                               }
                               
                               <div class="flex gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                  <button (click)="viewInvoice(invoice)" class="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 py-2 rounded-xl text-xs font-bold transition-colors">
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                     Télécharger
                                  </button>
                                  @if (invoice.status !== 'PAYE') {
                                     <button (click)="payInvoice(invoice)" class="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold transition-colors shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                        Payer en ligne
                                     </button>
                                  }
                               </div>
                            </div>
                         }
                      }
                   </div>
                </div>
             </div>
          }

                   <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <button (click)="openProfileInfo()" class="w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Mes Informations</button>
                      <button (click)="openInvoices()" class="w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                         <span>Mes factures</span>
                         @if (myInvoices().length > 0) {
                            <span class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{{ myInvoices().length }}</span>
                         }
                      </button>
                      <button (click)="showChangePasswordModal.set(true)" class="w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                         Modifier mon mot de passe
                      </button>
                      <button (click)="openSettings()" class="w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Paramètres</button>
                      <button (click)="logout()" class="w-full text-left p-4 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Déconnexion</button>
                   </div>

                   <!-- CHANGE PASSWORD MODAL -->
                   @if (showChangePasswordModal()) {
                      <div class="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
                         <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in">
                            <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-center relative">
                               <button (click)="closeChangePassword()" class="absolute top-3 right-3 text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                               </button>
                               <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                               </div>
                               <h3 class="text-white font-bold text-lg">Modifier le mot de passe</h3>
                               <p class="text-indigo-100 text-xs mt-1">Sécurisez votre compte</p>
                            </div>
                            <div class="p-6 space-y-4">
                               <div>
                                  <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ancien mot de passe</label>
                                  <input [ngModel]="changePasswordOld()" (ngModelChange)="changePasswordOld.set($event)" type="password" placeholder="••••••••" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                               </div>
                               <div>
                                  <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nouveau mot de passe</label>
                                  <input [ngModel]="changePasswordNew()" (ngModelChange)="changePasswordNew.set($event)" type="password" placeholder="Min. 6 caractères" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                               </div>
                               <div>
                                  <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Confirmer le nouveau mot de passe</label>
                                  <input [ngModel]="changePasswordConfirm()" (ngModelChange)="changePasswordConfirm.set($event)" type="password" placeholder="••••••••" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                               </div>
                               <button (click)="submitChangePassword()" [disabled]="changePasswordLoading()" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                                  @if (changePasswordLoading()) {
                                     <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                     Modification...
                                  } @else {
                                     Enregistrer
                                  }
                               </button>
                            </div>
                         </div>
                      </div>
                   }
                </div>
             }

          </main>

          <!-- BOTTOM NAV -->
          @if (currentUser()) {
             <nav class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 absolute bottom-0 w-full grid grid-cols-5 p-2 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button (click)="activeTab.set('home')" class="flex flex-col items-center justify-center p-1 transition-colors" [class.text-indigo-600]="activeTab() === 'home'" [class.dark:text-indigo-400]="activeTab() === 'home'" [class.text-slate-400]="activeTab() !== 'home'">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                   <span class="text-[9px] font-medium mt-1">Accueil</span>
                </button>
                <button (click)="activeTab.set('vehicles')" class="flex flex-col items-center justify-center p-1 transition-colors" [class.text-indigo-600]="activeTab() === 'vehicles'" [class.dark:text-indigo-400]="activeTab() === 'vehicles'" [class.text-slate-400]="activeTab() !== 'vehicles'">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                   <span class="text-[9px] font-medium mt-1">Véhicules</span>
                </button>
                
                <!-- Center Button -->
                <div class="relative -top-6 flex justify-center">
                   <button (click)="startRequest()" class="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 border-4 border-slate-100 dark:border-slate-900 active:scale-95 transition-transform" [class.bg-indigo-700]="activeTab() === 'create'">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                   </button>
                </div>

                <button (click)="activeTab.set('requests')" class="flex flex-col items-center justify-center p-1 transition-colors" [class.text-indigo-600]="activeTab() === 'requests'" [class.dark:text-indigo-400]="activeTab() === 'requests'" [class.text-slate-400]="activeTab() !== 'requests'">
                   <div class="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      @if (myRequests().length > 0) { <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900"></span> }
                   </div>
                   <span class="text-[9px] font-medium mt-1">Suivi</span>
                </button>
                <button (click)="activeTab.set('profile')" class="flex flex-col items-center justify-center p-1 transition-colors" [class.text-indigo-600]="activeTab() === 'profile'" [class.dark:text-indigo-400]="activeTab() === 'profile'" [class.text-slate-400]="activeTab() !== 'profile'">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                   <span class="text-[9px] font-medium mt-1">Profil</span>
                </button>
             </nav>
          }

          <!-- REQUEST INFO MODAL -->
          @if (selectedRequestInfo()) {
             @let reqInfo = selectedRequestInfo()!;
             <div class="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6 animate-fade-in" (click)="closeRequestInfo()">
                <div class="bg-slate-50 dark:bg-slate-900 w-full max-w-lg sm:rounded-2xl rounded-t-3xl h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col relative" (click)="$event.stopPropagation()">
                   
                   <!-- Header -->
                   <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sm:rounded-t-2xl rounded-t-3xl sticky top-0 z-10 shrink-0">
                      <div>
                         <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">Détails de la demande</h3>
                         <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">Réf: {{ getRef(reqInfo.id) }}</span>
                            <span class="text-xs text-slate-500 font-medium">• {{ reqInfo.date | date:'dd/MM/yyyy HH:mm' }}</span>
                         </div>
                      </div>
                      <button (click)="closeRequestInfo()" class="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">✕</button>
                   </div>

                   <!-- Scrollable Content -->
                   <div class="p-4 overflow-y-auto w-full">
                      <!-- Status Banner -->
                      <div class="mb-5 flex justify-between items-center bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                         <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Statut actuel</span>
                         <span class="text-xs px-2.5 py-1 rounded-full font-bold uppercase" 
                            [class.bg-blue-100]="reqInfo.status === 'NEW' || reqInfo.status === 'DISPATCHED'" [class.text-blue-700]="reqInfo.status === 'NEW' || reqInfo.status === 'DISPATCHED'"
                            [class.bg-emerald-100]="reqInfo.status === 'CONVERTED' || reqInfo.status === 'COMPLETED'" [class.text-emerald-700]="reqInfo.status === 'CONVERTED' || reqInfo.status === 'COMPLETED'">
                            {{ translateStatus(reqInfo.status) }}
                         </span>
                      </div>

                      <!-- Vehicle Info -->
                      <div class="mb-5">
                         <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Véhicule</h4>
                         <div class="bg-white dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div class="font-bold text-slate-900 dark:text-white text-lg mb-1">{{ reqInfo.vehicleBrand }} {{ reqInfo.vehicleModel }}</div>
                            <div class="text-xs text-slate-500 grid flex-col gap-1">
                               <div>Année : <span class="text-slate-700 dark:text-slate-300 font-medium">{{ reqInfo.vehicleYear }}</span></div>
                               <div>Immatriculation : <span class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700 dark:text-slate-300">{{ reqInfo.vehiclePlate }}</span></div>
                               @if(reqInfo.vehicleVin) { <div>VIN : <span class="font-mono">{{ reqInfo.vehicleVin }}</span></div> }
                            </div>
                         </div>
                      </div>

                      <!-- Preferences & Diagnosis -->
                      <div class="mb-5">
                         <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Diagnostic & Préférences</h4>
                         <div class="bg-white dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <!-- Tags Recap -->
                            <div class="flex flex-wrap gap-1.5 mb-3">
                               @if(reqInfo.preferredPeriod === 'Urgent') { <span class="text-[10px] font-bold px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 dark:border-red-800 dark:bg-red-900/40 dark:text-red-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Urgent</span> }
                               @if(reqInfo.interventionDate) { <span class="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 text-nowrap flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Le {{ reqInfo.interventionDate | date:'dd/MM/yyyy' }}</span> }
                               @if (hasTag(reqInfo, 'drivable')) { <span class="text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg> Roulant</span> }
                               @if (hasTag(reqInfo, 'not_drivable')) { <span class="text-[10px] font-bold px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 dark:border-red-800 dark:bg-red-900/40 dark:text-red-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> En panne</span> }
                               @if (hasTag(reqInfo, 'technician')) { <span class="text-[10px] font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Technicien désiré</span> }
                               @if (hasTag(reqInfo, 'towing')) { <span class="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-400 flex items-center gap-1 leading-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> Remorquage</span> }
                            </div>

                            @if (reqInfo.diagnosticHistory && reqInfo.diagnosticHistory.length > 0) {
                               <div class="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 pt-2">
                                  @for (step of reqInfo.diagnosticHistory; track $index) {
                                     <div class="py-2 text-sm flex justify-between items-center gap-2">
                                        <div class="text-slate-500 dark:text-slate-400 text-[11px] truncate flex-1">{{ step.question }}</div>
                                        <div class="text-slate-900 dark:text-white font-medium text-xs whitespace-nowrap">{{ step.answer }}</div>
                                     </div>
                                  }
                               </div>
                            }
                         </div>
                      </div>

                      <!-- Description / Diagnostics -->
                      @if (getCleanDescription(reqInfo.adminDescription)) {
                         <div class="mb-5">
                            <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                               Diagnostic validé (Équipe ICE)
                            </h4>
                            <div class="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/30 overflow-hidden relative">
                               <div class="absolute -right-6 -top-6 text-indigo-100 dark:text-indigo-900/20">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                               </div>
                               <p class="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap font-medium relative z-10">{{ getCleanDescription(reqInfo.adminDescription) }}</p>
                            </div>
                         </div>
                      }
                      
                      @if (getCleanDescription(reqInfo.description)) {
                         <div class="mb-5">
                            <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                               {{ getCleanDescription(reqInfo.adminDescription) ? 'Votre signalement initial' : 'Description / Note' }}
                            </h4>
                            <div class="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30">
                               <p class="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap italic">{{ getCleanDescription(reqInfo.description) }}</p>
                            </div>
                         </div>
                      }
                      
                      <!-- Photos -->
                      @if (reqInfo.photos && reqInfo.photos.length > 0) {
                         <div class="mb-5">
                            <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Photos jointes</h4>
                            <div class="grid grid-cols-3 gap-2">
                               @for (photo of reqInfo.photos; track $index) {
                                  <div class="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                     <img [src]="photo" class="w-full h-full object-cover">
                                  </div>
                               }
                            </div>
                         </div>
                      }

                      <!-- Actions (Annuler / Modifier) -->
                      @if (reqInfo.status === 'NEW' || reqInfo.status === 'DISPATCHED') {
                         <div class="mt-8 mb-4 border-t border-slate-200 dark:border-slate-800 pt-6">
                            @if (editingInterventionDate()) {
                               <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 mb-4 animate-fade-in">
                                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nouvelle date souhaitée</label>
                                  <input type="date" [ngModel]="newInterventionDate()" (ngModelChange)="newInterventionDate.set($event)" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 mb-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                                  <div class="flex gap-2">
                                     <button (click)="cancelEditingDate()" class="flex-1 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Annuler</button>
                                     <button (click)="saveInterventionDate(reqInfo)" [disabled]="!newInterventionDate()" class="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50">Enregistrer</button>
                                  </div>
                               </div>
                            } @else {
                               <div class="flex gap-3">
                                  <button (click)="cancelRequest(reqInfo)" class="flex-1 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                     Annuler
                                  </button>
                                  <button (click)="startEditingDate(reqInfo)" class="flex-1 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/30 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                     Modifier RDV
                                  </button>
                               </div>
                            }
                         </div>
                      }
                   </div>
                </div>
             </div>
          }

          <!-- CANCEL CONFIRMATION MODAL -->
          @if (requestToCancel()) {
             <div class="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" (click)="abortCancel()">
                <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl animate-zoom-in text-center" (click)="$event.stopPropagation()">
                   <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   </div>
                   <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Annuler la demande ?</h3>
                   <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Êtes-vous sûr de vouloir annuler cette demande d'intervention ?<br>
                      <strong class="text-slate-700 dark:text-slate-300">Cette action est irréversible.</strong>
                   </p>
                   
                   <div class="flex gap-3">
                      <button (click)="abortCancel()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">Non, garder</button>
                      <button (click)="confirmCancel()" class="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700">Oui, annuler</button>
                   </div>
                </div>
             </div>
          }

          <!-- RATING MODAL -->
          @if (showRatingModal() && ratingRequest()) {
             <div class="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl">
                   <button (click)="closeRatingModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
                   <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Évaluer la prestation</h3>
                   <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Comment s'est passée votre visite chez {{ getTenantByQuoteId(ratingRequest()!.acceptedQuoteId || ratingRequest()!.garageQuoteId || '')?.name || 'le garage' }} ?</p>
                   
                   <div class="flex justify-center gap-2 mb-6 cursor-pointer">
                      @for(i of [1,2,3,4,5]; track i) {
                         <svg (click)="setRating(i)" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 transition-colors duration-200" [ngClass]="i <= currentRating() ? 'text-amber-400 drop-shadow-md' : 'text-slate-200 dark:text-slate-800'" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      }
                   </div>
                   
                   <textarea [ngModel]="ratingComment()" (ngModelChange)="ratingComment.set($event)" placeholder="Racontez-nous votre expérience... (Optionnel)" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 mb-6" rows="3"></textarea>
                   
                   <button (click)="submitRating()" [disabled]="currentRating() === 0" class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl shadow-lg transition-colors">
                      Envoyer mon avis
                   </button>
                </div>
             </div>
          }          <!-- ADD/EDIT VEHICLE MODAL -->
          @if (showAddVehicleForm()) {
             <div class="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in p-0 sm:p-6" (click)="closeAddVehicleForm()">
                <div class="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] relative shadow-2xl animate-slide-up sm:animate-zoom-in" (click)="$event.stopPropagation()">
                   <div class="absolute top-4 inset-x-0 flex justify-center sm:hidden"><div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div></div>
                   <button (click)="closeAddVehicleForm()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
                   
                   <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-6 pr-8 mt-2">{{ editingVehicleId() ? 'Modifier le véhicule' : 'Nouveau véhicule' }}</h3>
                   
                   <form [formGroup]="vehicleForm" class="space-y-4">
                      <div class="grid grid-cols-2 gap-4">
                         <div>
                            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">N° Immatriculation</label>
                            <input formControlName="plate" placeholder="AB-123-CD" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono uppercase">
                            @if(vehicleForm.get('plate')?.invalid && vehicleForm.get('plate')?.touched) { <span class="text-red-500 text-xs mt-1 block">Requis</span> }
                         </div>
                         <div>
                            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">N° de Châssis (VIN)</label>
                            <input formControlName="vin" placeholder="17 caractères" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono uppercase">
                            @if(vehicleForm.get('vin')?.invalid && vehicleForm.get('vin')?.touched) { <span class="text-red-500 text-xs mt-1 block">Requis</span> }
                         </div>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-4">
                         <div>
                            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Marque</label>
                            <input formControlName="brand" placeholder="Ex: Toyota" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            @if(vehicleForm.get('brand')?.invalid && vehicleForm.get('brand')?.touched) { <span class="text-red-500 text-xs mt-1 block">Requis</span> }
                         </div>
                         <div>
                            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Modèle</label>
                            <input formControlName="model" placeholder="Ex: Yaris" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            @if(vehicleForm.get('model')?.invalid && vehicleForm.get('model')?.touched) { <span class="text-red-500 text-xs mt-1 block">Requis</span> }
                         </div>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                         <div>
                            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Année</label>
                            <input type="number" formControlName="year" placeholder="2020" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                         </div>
                         <div>
                            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Kilométrage</label>
                            <input type="number" formControlName="mileage" placeholder="45000" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                         </div>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-4 mb-6">
                          <div>
                             <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Carburant</label>
                             <select formControlName="fuel" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                                <option value="Essence">Essence</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Hybride">Hybride</option>
                                <option value="Electrique">Électrique</option>
                             </select>
                          </div>
                          <div>
                             <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Boîte</label>
                             <select formControlName="gearbox" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                                <option value="Manuelle">Manuelle</option>
                                <option value="Automatique">Automatique</option>
                             </select>
                          </div>
                      </div>

                      <div class="pt-4 flex flex-col gap-3">
                         <button type="button" (click)="saveVehicle()" [disabled]="vehicleForm.invalid" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all disabled:opacity-50 disabled:shadow-none active:scale-95 text-lg">
                            {{ editingVehicleId() ? 'Enregistrer' : 'Ajouter le véhicule' }}
                         </button>
                         @if (editingVehicleId()) {
                            <button type="button" (click)="deleteVehicle(editingVehicleId()!); closeAddVehicleForm()" class="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-500 font-bold py-4 rounded-xl transition-all active:scale-95 text-lg border border-red-200 dark:border-red-900/50 flex items-center justify-center gap-2">
                               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               Supprimer ce véhicule
                            </button>
                         }
                      </div>
                   </form>
                </div>
             </div>
          }

          <!-- TIP MODAL -->
          @if (showTipModal()) {
             <div class="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800">
                   <button (click)="closeTipModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
                   <div class="flex flex-col items-center text-center">
                      <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 text-amber-500">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
                      </div>
                      <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Conseil du jour</h3>
                      <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                         Pensez à vérifier la pression de vos pneus tous les mois pour économiser du carburant et améliorer votre sécurité. Un pneu sous-gonflé augmente la consommation de 5% à 10%.
                      </p>
                      <button (click)="closeTipModal()" class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-colors w-full">
                         J'ai compris
                      </button>
                   </div>
                </div>
             </div>
          }

          <!-- PROFILE INFO MODAL -->
          @if (showProfileInfoModal()) {
             <div class="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-slide-in">
                <div class="p-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b flex justify-between items-center bg-indigo-600 text-white shadow-md shrink-0">
                   <h2 class="font-bold text-lg">Mes Informations</h2>
                   <button (click)="closeProfileInfo()" class="text-white/80 hover:text-white">✕</button>
                </div>
                <div class="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex-1 overflow-y-auto">
                   <form [formGroup]="profileForm" class="space-y-4">
                      <div><label class="text-xs font-bold text-slate-400 uppercase">Nom Complet</label><input formControlName="name" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white"></div>
                      <div><label class="text-xs font-bold text-slate-400 uppercase">Téléphone</label><input formControlName="phone" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white"></div>
                      <div><label class="text-xs font-bold text-slate-400 uppercase">Email</label><input formControlName="email" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white"></div>
                      <div><label class="text-xs font-bold text-slate-400 uppercase">Ville</label><input formControlName="city" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white"></div>
                      <div><label class="text-xs font-bold text-slate-400 uppercase">Adresse</label><input formControlName="address" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white"></div>
                      
                      <button type="button" (click)="saveProfile()" [disabled]="profileForm.invalid" class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg mt-6 disabled:opacity-50">Sauvegarder</button>
                   </form>
                </div>
             </div>
          }

          <!-- SETTINGS MODAL -->
          @if (showSettingsModal()) {
             <div class="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-slide-in">
                <div class="p-4 border-b flex justify-between items-center bg-indigo-600 text-white shadow-md shrink-0">
                   <h2 class="font-bold text-lg">Paramètres</h2>
                   <button (click)="closeSettings()" class="text-white/80 hover:text-white">✕</button>
                </div>
                <div class="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex-1 overflow-y-auto">
                   <div class="space-y-6">
                      <div class="flex items-center justify-between">
                         <span class="text-slate-700 dark:text-slate-300 font-medium">Notifications Push</span>
                         <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked class="sr-only peer">
                            <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                         </label>
                      </div>
                      
                      <!-- Mode Sombre Toggle -->
                      <div (click)="themeService.toggle()" class="flex items-center justify-between cursor-pointer">
                         <span class="text-slate-700 dark:text-slate-300 font-medium">Mode Sombre</span>
                         <div class="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full transition-colors">
                            <div class="absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-all shadow-sm"
                                 [class.translate-x-full]="themeService.isDark()"
                                 [class.border-white]="themeService.isDark()"></div>
                         </div>
                      </div>
                      
                      <div class="pt-6 border-t border-slate-100 dark:border-slate-800">
                         <button class="w-full text-left py-3 text-red-500 font-medium">Supprimer mon compte</button>
                      </div>
                   </div>
                </div>
             </div>
          }

          <!-- CONFIRM QUOTE MODAL -->
          @if (showConfirmQuoteModal()) {
             <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" style="z-index: 60;">
                <div class="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-800 shadow-2xl">
                   <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400 text-2xl shadow-sm">✓</div>
                   <h3 class="font-bold text-lg mb-2 text-slate-900 dark:text-white">Confirmer le choix ?</h3>
                   <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Vous êtes sur le point de valider ce devis pour un montant de <span class="font-bold text-slate-900 dark:text-white">{{ quoteToConfirm()?.quote?.totalTTC | number }} CFA</span>.</p>
                   <div class="flex gap-3">
                      <button (click)="cancelQuoteChoice()" class="flex-1 py-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium transition-colors">Annuler</button>
                      <button (click)="confirmQuoteChoice()" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">Confirmer</button>
                   </div>
                </div>
             </div>
          }

          <!-- QUOTE DETAILS MODAL -->
          @if (selectedQuoteDetails()) {
             <div class="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative">
                   
                   <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                      <h3 class="font-bold text-slate-900 dark:text-white">Détail du Devis</h3>
                      <button (click)="closeQuoteDetails()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
                   </div>

                   <div class="flex-1 overflow-y-auto p-4">
                      <!-- Garage Info -->
                      @let tenant = getTenantByQuoteId(selectedQuoteDetails()?.id || '');
                      <div class="flex items-center gap-3 mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                         <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                         </div>
                         <div class="overflow-hidden">
                            <div class="font-bold text-sm text-slate-900 dark:text-white truncate w-full">{{ tenant?.name }}</div>
                            <div class="text-xs text-slate-500 truncate w-full mb-1">{{ tenant?.address || tenant?.city + (tenant?.commune ? ', ' + tenant?.commune : '') }}</div>
                            @if(tenant?.rating) {
                               <div class="flex text-amber-400 text-xs mt-1">
                                  @for(i of [1,2,3,4,5]; track i) { <span [class.text-slate-300]="i > tenant!.rating!">★</span> }
                                  <span class="ml-1 text-slate-400 text-[10px] font-medium">({{ tenant!.rating }})</span>
                               </div>
                            }
                         </div>
                      </div>

                      <!-- Items -->
                      <div class="space-y-3">
                         @for (item of selectedQuoteDetails()?.items; track $index) {
                            <div class="flex justify-between text-sm border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0">
                                <div class="flex-1 pr-2">
                                  <div class="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{{ item.description }}</div>
                                  <div class="text-xs text-slate-500 mt-0.5">Qté: {{ item.quantity }} x {{ item.unitPrice | number }}</div>
                               </div>
                               <div class="font-bold text-slate-900 dark:text-white shrink-0">
                                  {{ item.totalHT | number }}
                               </div>
                            </div>
                         }
                      </div>

                      <!-- Totals -->
                      <div class="mt-6 pt-4 border-t-2 border-slate-100 dark:border-slate-800 space-y-2">
                         @let repairStatusModal = selectedQuoteRequest()?.repairStatus || getRepairStatus(selectedQuoteRequest()?.repairOrderId);
                         @if (selectedQuoteDetails()?.restitutionDate && repairStatusModal !== 'Clôturé') {
                            <div class="flex justify-between items-center bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 mb-4">
                               <div class="flex items-center gap-2">
                                  <span class="text-amber-500">📅</span>
                                  <span class="text-xs font-bold text-amber-600 dark:text-amber-500">Restitution prévue le :</span>
                               </div>
                               <span class="text-sm font-bold text-slate-900 dark:text-white">{{ selectedQuoteDetails()?.restitutionDate | date:'dd/MM/yyyy' }}</span>
                            </div>
                         }
                         
                         <div class="flex justify-between text-sm text-slate-500">
                            <span>Total HT</span>
                            <span>{{ selectedQuoteDetails()?.totalHT | number }}</span>
                         </div>
                         <div class="flex justify-between text-sm text-slate-500">
                            <span>TVA</span>
                            <span>{{ selectedQuoteDetails()?.totalVAT | number }}</span>
                         </div>
                         <div class="flex justify-between text-xl font-bold text-indigo-600 dark:text-indigo-400 pt-2">
                            <span>Total TTC</span>
                            <span>{{ selectedQuoteDetails()?.totalTTC | number }} CFA</span>
                         </div>
                      </div>
                   </div>

                   <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex gap-3">
                      <button (click)="closeQuoteDetails()" class="flex-1 py-3 text-slate-500 font-medium text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Fermer</button>
                      @if (selectedQuoteRequest()?.status !== 'CONVERTED' && selectedQuoteRequest()?.status !== 'COMPLETED' && selectedQuoteRequest()?.status !== 'REJECTED') {
                         <button (click)="acceptQuote(selectedQuoteRequest(), selectedQuoteDetails())" class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg transition-colors">Accepter</button>
                      } @else if (selectedQuoteRequest()?.status === 'COMPLETED' && !selectedQuoteRequest()?.acceptedQuoteId) {
                         <button (click)="acceptQuote(selectedQuoteRequest(), selectedQuoteDetails())" class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg transition-colors">Accepter</button>
                      }
                   </div>
                </div>
             </div>
           }

           <!-- GARAGE INFO MODAL -->
           @if (selectedGarageForInfo(); as infoGarage) {
              <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
                 <div class="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up pb-[env(safe-area-inset-bottom)]">
                    
                    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                       <h3 class="font-bold text-slate-900 dark:text-white text-lg">Infos Garage</h3>
                       <button (click)="closeGarageInfo()" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">✕</button>
                    </div>

                    <div class="p-6 overflow-y-auto">
                       <div class="flex items-center gap-4 mb-6">
                          <div class="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                             @if (infoGarage.logoUrl) {
                                <img [src]="infoGarage.logoUrl" class="w-full h-full object-cover">
                             } @else {
                                <span class="text-2xl font-bold text-slate-400">{{ infoGarage.name.charAt(0) }}</span>
                             }
                          </div>
                          <div>
                             <h4 class="font-bold text-xl text-slate-900 dark:text-white leading-tight">{{ infoGarage.name }}</h4>
                             @if (infoGarage.plan === 'ICE Full') {
                                <span class="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/50 shadow-sm shadow-amber-500/10">
                                   <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                   Recommandé par Mécatech
                                </span>
                             }
                          </div>
                       </div>

                       <div class="space-y-4">
                          @if (infoGarage.description) {
                             <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">À propos</label>
                                <p class="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed max-w-none break-words whitespace-pre-wrap">{{ infoGarage.description }}</p>
                             </div>
                          }
                          
                          <div>
                             <label class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact & Accès</label>
                             <div class="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                <div class="p-3 flex items-start gap-3">
                                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                   <div class="text-sm text-slate-900 dark:text-white">
                                      {{ infoGarage.address || 'Adresse non renseignée' }}<br>
                                      <span class="text-slate-500">{{ infoGarage.commune ? infoGarage.commune + ', ' : '' }}{{ infoGarage.city }}</span>
                                   </div>
                                </div>
                                @if (infoGarage.phone) {
                                   <div class="p-3 flex items-center gap-3">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                      <a [href]="'tel:'+infoGarage.phone" class="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">{{ infoGarage.phone }}</a>
                                   </div>
                                }
                             </div>
                          </div>
                          
                          <div class="pt-4">
                              <button (click)="closeGarageInfo()" class="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-colors">Fermer</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           }

        </div>
     </div>

      <!-- NEW INVOICE PREVIEW MODAL -->
      @if (selectedInvoicePreview()) {
         <div class="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-left">
            <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative">
               
               <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                  <h3 class="font-bold text-slate-900 dark:text-white">Aperçu de la Facture</h3>
                  <button (click)="closeInvoicePreview()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
               </div>

               <div class="flex-1 overflow-y-auto p-4">
                  <!-- Garage Info -->
                  @let tenantName = getGarageName(selectedInvoicePreview()?.tenantId);
                  <div class="flex flex-col gap-1 mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                     <div class="font-bold text-sm text-slate-900 dark:text-white">{{ tenantName }}</div>
                     <div class="text-xs text-slate-500">
                       Facture : <span class="font-bold text-slate-700 dark:text-slate-300">{{ selectedInvoicePreview()?.number }}</span>
                     </div>
                     <div class="text-[10px] text-slate-400">Date : {{ selectedInvoicePreview()?.date | date:'dd/MM/yyyy' }}</div>
                  </div>

                  <!-- Vehicle Info if present -->
                  @if (selectedInvoicePreview()?.vehicleDescription) {
                     <div class="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mb-4">
                        <span class="font-bold">Véhicule :</span> {{ selectedInvoicePreview()?.vehicleDescription }}
                     </div>
                  }

                  <!-- Items List -->
                  <div class="space-y-3">
                     @for (item of selectedInvoicePreview()?.items; track $index) {
                        <div class="flex justify-between text-sm border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0">
                            <div class="flex-1 pr-2">
                              <div class="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{{ item.description }}</div>
                              <div class="text-xs text-slate-500 mt-0.5">Qté: {{ item.quantity }} x {{ item.unitPrice | number }} F</div>
                           </div>
                           <div class="font-bold text-slate-900 dark:text-white shrink-0">
                              {{ item.totalHT | number }} F
                           </div>
                        </div>
                     }
                  </div>

                  <!-- Totals -->
                  <div class="mt-6 pt-4 border-t-2 border-slate-100 dark:border-slate-800 space-y-2">
                     <div class="flex justify-between text-sm text-slate-500">
                        <span>Total HT</span>
                        <span>{{ selectedInvoicePreview()?.totalHT | number }} F</span>
                     </div>
                     <div class="flex justify-between text-sm text-slate-500">
                        <span>TVA</span>
                        <span>{{ selectedInvoicePreview()?.totalVAT | number }} F</span>
                     </div>
                     <div class="flex justify-between text-xl font-bold text-indigo-600 dark:text-indigo-400 pt-2">
                        <span>Total TTC</span>
                        <span>{{ selectedInvoicePreview()?.totalTTC | number }} CFA</span>
                     </div>
                  </div>
               </div>

               <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex gap-3">
                  <button (click)="closeInvoicePreview()" class="flex-1 py-3 text-slate-500 font-medium text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Fermer</button>
                  <button (click)="downloadInvoiceFromPreview()" class="flex-1 py-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     Télécharger
                  </button>
               </div>
            </div>
         </div>
      }
   `,
   styles: [`
    @keyframes slide-in { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .animate-slide-in { animation: slide-in 0.3s ease-out; }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class MobileAppComponent {
   dataService = inject(DataService);
   toastService = inject(ToastService);
   themeService = inject(ThemeService);
   fb = inject(FormBuilder);
   sanitizer = inject(DomSanitizer);
   private cdr = inject(ChangeDetectorRef);
   private zone = inject(NgZone);

   // Force Angular change detection on every user interaction (fixes Capacitor zoneless WebView bug)
   @HostListener('click') onHostClick() { this.cdr.markForCheck(); }
   @HostListener('touchend') onHostTouch() { this.cdr.markForCheck(); }

   // === SIGNALS ===
   currentUser = signal<string | null>(null);
   currentPhone = signal<string | null>(null);
   currentClientData = signal<any>(null);

   qrCodeUrl = computed(() => {
      const phone = this.currentPhone();
      if (!phone) return '';
      const data = JSON.stringify({ source: 'ICE_APP', phone: phone });
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&format=svg`;
   });
   activeTab = signal<'home' | 'create' | 'requests' | 'vehicles' | 'profile'>('home'); // Added 'vehicles'
   authMode = signal<'login' | 'signup'>('login');
   forgotPasswordMode = signal(false);
   forgotPasswordEmail = signal('');
   forgotPasswordResult = signal<{ tempPassword: string; firstName: string } | null>(null);
   forgotPasswordLoading = signal(false);

   showChangePasswordModal = signal(false);
   changePasswordOld = signal('');
   changePasswordNew = signal('');
   changePasswordConfirm = signal('');
   changePasswordLoading = signal(false);

   userLocation = signal<{ lat: number, lng: number } | null>(null);

   cityFilter = signal<string>('');
   communeFilter = signal<string>('');
   minRatingFilter = signal<number>(0);

   filterCommunes = computed(() => { const city = this.cityFilter(); return city ? IVORY_COAST_LOCATIONS[city] || [] : []; });

   requestCity = signal<string>('');

   showSubscriptionModal = signal(false);
   vehicleToSubscribe = signal<MotoristVehicle | null>(null);
   selectedPlan = signal<string>('PARTICULIER');

   showInterventionChoiceModal = signal(false);

   selectedQuoteRequest = signal<QuoteRequest | null>(null);
   selectedRequestInfo = signal<QuoteRequest | null>(null);
   editingInterventionDate = signal<boolean>(false);
   newInterventionDate = signal<string>('');
   requestToCancel = signal<QuoteRequest | null>(null);
   selectedQuoteDetails = signal<Invoice | null>(null);

   quoteToConfirm = signal<{ req: QuoteRequest, quote: Invoice } | null>(null);
   showConfirmQuoteModal = signal(false);

   selectedGarageProfile = signal<Tenant | null>(null);
   selectedGarageForInfo = signal<Tenant | null>(null);

   ratingRequest = signal<QuoteRequest | null>(null);
   showRatingModal = signal(false);
   currentRating = signal<number>(0);
   ratingComment = signal<string>('');

   tempPhotos = signal<string[]>([]);
   showAddVehicleForm = signal(false);
   editingVehicleId = signal<string | null>(null);

   selectedInvoicePreview = signal<any | null>(null);

   isEditingProfile = signal(false);
   showSchedulingModal = signal(false);
   schedulingData = signal<{ reqId: string, repairId: string } | null>(null);
   schedulingDate = signal('');
   minDate = new Date().toISOString().slice(0, 16);
   mobileRequestFilter = signal<'ALL' | 'PENDING' | 'CLOSED'>('ALL');

   // Requests Filters
   requestsVehicleFilter = signal<string>('');
   requestsStatusFilter = signal<string>('');

   // WIZARD SIGNALS
   selectedDashboardIcons = signal<string[]>([]);
   wizardStep = signal(0);
   wizardAnswers = signal<{ question: string, answer: string }[]>([]);
   requestPhotos = signal<string[]>([]);
   wizardStepId = signal('ROOT');
   wizardDiagnosis = signal<string>('');
   wizardHistory = signal<string[]>([]); // Track path for BACK functionality

   // NEW: Step-by-step request wizard signals
   // NEW: Step-by-step optimized request wizard signals
   requestWizardStep = signal<number>(1);
   requestNeedType = signal<string[]>([]);
   isVehicleDrivable = signal<boolean | null>(null);
   requestUrgency = signal<string | null>(null);
   requestServiceType = signal<string | null>(null);

   requestWizardCities = computed(() => {
      // Technician dispatch or towing => Abidjan only
      if (this.requestServiceType() === 'tech_home' || this.requestServiceType() === 'towing') return ['Abidjan'];
      return this.cities;
   });
   requestWizardNeedsForm = computed(() => true);
   requestWizardShowDescription = computed(() => true);

   // New Photo Logic
   wantToAddPhotos = signal(false);

   garageMarkers = new Map<string, any>();

   centerMapOnGarage(garage: any) {
      if (this.leafletMap && garage.lat && garage.lng) {
         this.leafletMap.invalidateSize();
         this.leafletMap.setView([garage.lat, garage.lng], 15, { animate: true });
         const marker = this.garageMarkers.get(garage.id);
         if (marker) {
            marker.openPopup();
         }
         const mainContainer = document.querySelector('app-mobile-app main');
         if (mainContainer) {
            mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
         } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
         }
      }
   }

   isBodyworkDiagnosis = computed(() => {
      const diag = this.wizardDiagnosis() || '';
      const keywords = ['Carrosserie', 'Choc', 'Peinture', 'Rayures', 'Pare-brise', 'Vitrage', 'Impact'];
      return keywords.some(k => diag.includes(k));
   });

   // New Modals State
   showTipModal = signal(false);
   showProfileInfoModal = signal(false);
   showInvoicesModal = signal(false);
   showSettingsModal = signal(false);

   // Requests Tab View Toggle
   requestsView = signal<'demandes' | 'factures'>('demandes');

   // Invoices Data
   myInvoices = computed(() => {
      const userPhone = this.currentPhone();
      if (!userPhone) return [];

      const clientIds = this.dataService.clients().filter(c => c.phone === userPhone).map(c => c.id);

      return this.dataService.invoices().filter(inv =>
         inv.type === 'FACTURE' && clientIds.includes(inv.clientId) && (inv.status === 'ENVOYE' || inv.status === 'PAYE' || inv.status === 'PARTIEL')
      );
   });

   // Date Constraints
   minDateStr = '';
   maxDateStr = '';

   // Computed Greeting
   firstName = computed(() => {
      const name = this.currentUser();
      return name ? name.split(' ')[0] : 'Conducteur';
   });

   WIZARD_TREE: { [key: string]: WizardNode } = {};

   loginForm: FormGroup;
   requestForm: FormGroup;
   vehicleForm: FormGroup;
   profileForm: FormGroup;

   cities = CITIES;

   DASHBOARD_ICONS: { [key: string]: string } = {
      'dash-oil': 'M18,10H10V18H18V10M20,10A2,2 0 0,1 22,12V18A2,2 0 0,1 20,20H10A2,2 0 0,1 8,18V12A2,2 0 0,1 10,10H2V5H4V8H20V10Z',
      'dash-temp': 'M15,13V5A3,3 0 0,0 9,5V13A5,5 0 1,0 15,13M12,4A1,1 0 0,1 13,5V8H11V5A1,1 0 0,1 12,4Z',
      'dash-battery': 'M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z',
      'dash-brake': 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H13V7H11M11,15V17H13V15H11Z',
      'dash-airbag': 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,15.25 18.06,18.04 15.34,19.33C15.34,19.33 15.33,19.33 15.33,19.33C14.33,19.76 13.2,20 12,20C10.8,20 9.67,19.76 8.67,19.33C8.67,19.33 8.66,19.33 8.66,19.33C5.94,18.04 4,15.25 4,12A8,8 0 0,1 12,4M12,7A3,3 0 0,0 9,10A3,3 0 0,0 12,13A3,3 0 0,0 15,10A3,3 0 0,0 12,7M7.5,15C7.5,15 9,14 12,14C15,14 16.5,15 16.5,15V16H7.5V15Z',
      'dash-steering': 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C14.07,4 15.96,4.8 17.37,6.09L13.84,9.63C13.31,9.24 12.68,9 12,9C10.34,9 9,10.34 9,12H4.08C4.55,8.03 7.63,4.82 11.5,4.11V4H12.5V4.11C12.33,4.07 12.17,4.04 12,4M18.92,12C18.96,12.33 19,12.66 19,13C19,15.29 17.89,17.34 16.15,18.6L12.5,13.5L14.77,11.23L18.92,12M5.08,12L9.23,11.23L11.5,13.5L7.85,18.6C6.11,17.34 5,15.29 5,13C5,12.66 5.04,12.33 5.08,12Z',
      'dash-engine': 'M14.9,5.4L13.5,4H10.5L9.1,5.4V8H14.9V5.4M19,10H17V7H16V10H8V7H7V10H5C3.9,10 3,10.9 3,12V18A2,2 0 0,0 5,20H19A2,2 0 0,0 21,18V12C21,10.9 20.1,10 19,10Z',
      'dash-tpms': 'M12,2C6.48,2 2,6.48 2,12S6.48,22 12,22S22,17.52 22,12S17.52,2 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H13V7H11M11,15V17H13V15H11Z',
      'dash-abs': 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M7,10V14H8V12.5H9V14H10V10H7M11,10V14H14V13H12V12.5H13V11.5H12V11H14V10H11M15,10V14H18V13H16V12.5H18V11.5H16V11H18V10H15Z',
      'dash-coil': 'M18,10H10V14H18V10M19,8H9V16H19V8Z',
      'dash-esp': 'M2,16H6V18H2V16M8,16H12V18H8V16M14,16H18V18H14V16M20,16H22V18H20V16M4,12H8V14H4V12M10,12H14V14H10V12M16,12H20V14H16V12M6,8H10V10H6V8M12,8H16V10H12V8M18,8H22V10H18V8M8,4H12V6H8V4M14,4H18V6H14V4Z',
      'dash-fap': 'M3,13H5V11H3V13M3,17H5V15H3V17M3,9H5V7H3V9M7,17H21V15H7V17M7,13H21V11H7V13M11,9H21V7H11V9Z',
      'dash-noise': 'M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.02C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z',
      'dash-smoke': 'M19.5,19.1C19.5,19.1 19.5,19.1 19.5,19.1C20.8,18.5 21.8,17.3 22.2,15.9C22.6,14.5 22.4,13 21.6,11.8C20.8,10.6 19.5,9.8 18.1,9.6C18,9.6 17.9,9.6 17.8,9.6C17.1,7.3 15.1,5.6 12.7,5.1C10.3,4.6 7.9,5.2 6.1,6.8C4.3,8.4 3.5,10.9 4,13.3C2.8,13.8 1.9,14.8 1.6,16C1.2,17.3 1.5,18.6 2.3,19.7C3.1,20.8 4.4,21.4 5.7,21.4H19.5V19.1Z',
      'dash-gear': 'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,13L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
      'dash-drop': 'M12,2C12,2 5,8.27 5,14A7,7 0 0,0 12,21A7,7 0 0,0 19,14C19,8.27 12,2 12,2Z',
      'dash-snow': 'M17,12L22,9V7L17,10L12,7L7,10L2,7V9L7,12L2,15V17L7,14L12,17L17,14L22,17V15L17,12M12,2L9,7H15L12,2M12,22L15,17H9L12,22Z',
      'dash-body': 'M19,6H16C16,4.34 14.66,3 13,3H11C9.34,3 8,4.34 8,6H5A3,3 0 0,0 2,9V18A3,3 0 0,0 5,21H19A3,3 0 0,0 22,18V9A3,3 0 0,0 19,6M10,6H14C14,5.45 13.55,5 13,5H11C10.45,5 10,5.45 10,6M20,18A1,1 0 0,1 19,19H5A1,1 0 0,1 4,18V9A1,1 0 0,1 5,8H19A1,1 0 0,1 20,9V18Z',
      'dash-tool': 'M21.7,14.4L20.7,15.4L18.6,13.3L19.6,12.3C20.3,11.6 20.3,10.4 19.6,9.7L18.2,8.3L15.3,11.2L12.8,8.7L15.7,5.8L14.3,4.4C13.6,3.7 12.4,3.7 11.7,4.4L10.7,5.4L8.6,3.3L9.6,2.3C10.8,1.1 12.7,1.1 13.9,2.3L16.4,4.8L19.2,2L22,4.8L19.2,7.6L21.7,10.1C22.9,11.3 22.9,13.2 21.7,14.4M6.9,19L14,11.9L12.1,10L5,17.1V19H6.9M2,22V17.9L11.7,8.2L15.8,12.3L6.1,22H2Z'
   };

   private leafletMap?: L.Map;
   private markersLayer?: L.LayerGroup;

   private generateUUID(): string {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
         return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
         const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
         return v.toString(16);
      });
   }

   constructor() {
      // Restore mobile user session from localStorage
      const savedUser = localStorage.getItem('mobileUserName');
      const savedPhone = localStorage.getItem('mobileUserPhone');
      if (savedUser && savedPhone) {
         this.currentUser.set(savedUser);
         this.currentPhone.set(savedPhone);
         this.activeTab.set('home');
         // Reload API data so quoteRequests, invoices, repairs are available
         this.dataService.loadApiData();
         this.initPushNotifications();
      }

      // Persist to localStorage whenever they change
      effect(() => {
         const user = this.currentUser();
         const phone = this.currentPhone();
         if (user && phone) {
            localStorage.setItem('mobileUserName', user);
            localStorage.setItem('mobileUserPhone', phone);
         } else {
            localStorage.removeItem('mobileUserName');
            localStorage.removeItem('mobileUserPhone');
         }
      });

      // Capacitor Native Sync Fix: auto-refresh API data every 15 seconds.
      // This ensures the mobile app stays up-to-date with Garage/SuperAdmin actions.
      setInterval(() => {
         if (this.currentUser() && localStorage.getItem('auth_token')) {
            this.zone.run(() => {
               this.dataService.loadApiData();
            });
         }
      }, 15000);

      // Tawk.to Mobile Integration & Dynamic Injection
      let mobileTawkInjected = false;
      effect(() => {
         const w = window as any;
         const tab = this.activeTab();
         const user = this.currentUser();
         const phone = this.currentPhone();

         const realEmail = this.currentClientData()?.email || this.profileForm?.value?.email;
         const finalEmail = realEmail && realEmail.trim() !== '' ? realEmail : `${phone?.replace(/\+/g, '')}@mobile.app`;
         const fullName = `${user} (App Mobile)`;

         // 1. Inject Automobiliste script dynamically if user requires it (defer to profile tab to avoid blocking Location prompt at app startup)
         if (user && tab === 'profile' && !mobileTawkInjected && Capacitor.isNativePlatform()) {
            mobileTawkInjected = true;

            w.Tawk_API = w.Tawk_API || {};
            w.Tawk_API.visitor = { name: fullName, email: finalEmail };
            w.Tawk_API.onLoad = () => {
               w.Tawk_API.setAttributes({ name: fullName, email: finalEmail }, function (e: any) { });
            };

            const s1 = document.createElement("script");
            const s0 = document.getElementsByTagName("script")[0];
            s1.async = true;
            s1.src = 'https://embed.tawk.to/69bfe4ba1f2eee1c3a8ffa1f/1jkapau46';
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');
            if (s0 && s0.parentNode) s0.parentNode.insertBefore(s1, s0);
            else document.head.appendChild(s1);
         }

         const syncAndToggleTawk = () => {
            if (!w.Tawk_API) return;

            // Manage Visibility & Size
            if (user && tab === 'profile') {
               if (typeof w.Tawk_API.showWidget === 'function') w.Tawk_API.showWidget();
               if (typeof w.Tawk_API.setAttributes === 'function') w.Tawk_API.setAttributes({ name: fullName, email: finalEmail }, function (e: any) { });

               setTimeout(() => {
                  const tawkIframe = document.querySelector('iframe[title="chat widget"]') as HTMLElement;
                  if (tawkIframe) {
                     tawkIframe.style.transform = 'scale(0.85)';
                     tawkIframe.style.transformOrigin = 'bottom right';
                     tawkIframe.style.marginBottom = '60px'; // Prevent hiding behind tab bar when minimized
                  }
               }, 500);
            } else {
               if (typeof w.Tawk_API.hideWidget === 'function') w.Tawk_API.hideWidget();
            }
         };

         syncAndToggleTawk();
         setTimeout(syncAndToggleTawk, 2000);
         setTimeout(syncAndToggleTawk, 4000);
      });

      // Leaflet Map Initialization Hook
      effect(() => {
         const tab = this.activeTab();
         const loc = this.userLocation() || { lat: 5.3599, lng: -4.0083 };
         const garages = this.nearbyGarages();

         if (tab === 'home') {
            setTimeout(() => {
               const mapEl = document.getElementById('leaflet-map');
               if (!mapEl) {
                  // If element doesn't exist but map does, clean it up so it can be recreated
                  if (this.leafletMap) {
                     this.leafletMap.remove();
                     this.leafletMap = undefined;
                  }
                  return;
               }

               if (!this.leafletMap) {
                  this.leafletMap = L.map('leaflet-map', { zoomControl: false, attributionControl: false }).setView([loc.lat, loc.lng], 15);
                  // Use CartoDB Positron for a cleaner, more premium look
                  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
                     subdomains: 'abcd',
                     maxZoom: 20
                  }).addTo(this.leafletMap);
                  this.markersLayer = L.layerGroup().addTo(this.leafletMap);
               } else {
                  this.leafletMap.setView([loc.lat, loc.lng], 15);
               }

               // Double invalidation to fix grey tiles on reconnection (DOM may not be fully painted yet at 100ms)
               this.leafletMap.invalidateSize();
               setTimeout(() => { if (this.leafletMap) this.leafletMap.invalidateSize(); }, 350);
               this.markersLayer!.clearLayers();

               // User Marker (Pulsing Dot style)
               const userIcon = L.divIcon({
                  className: 'bg-transparent border-0',
                  html: `<div class="relative flex h-5 w-5">
                            <span class="animate-ping shadow-lg absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75" style="box-shadow: 0 0 15px rgba(99, 102, 241, 0.8);"></span>
                            <span class="relative inline-flex rounded-full h-5 w-5 bg-indigo-600 border-2 border-white shadow-md"></span>
                         </div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
               });
               if (this.userLocation()) {
                  L.marker([loc.lat, loc.lng], { icon: userIcon }).addTo(this.markersLayer!).bindPopup('<div style="font-family: Inter, sans-serif; font-weight: bold; font-size: 12px;">Vous êtes ici</div>');
               }

               // Garage Markers
               garages.forEach((g: any) => {
                  if (g.lat && g.lng) {
                     const customIcon = L.divIcon({
                        className: 'custom-garage-icon',
                        html: `<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4); color: white;">
                                  <svg xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px; transform: rotate(45deg);" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>
                               </div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                     });
                     const star = g.plan === 'ICE Full' ? '⭐ ' : '';
                     const recommendedText = g.plan === 'ICE Full' ? `<div style="font-size: 9px; color: #d97706; font-weight: bold; margin-top: 2px;">Recommandé par Mécatech</div>` : '';
                     const marker = L.marker([g.lat, g.lng], { icon: customIcon }).addTo(this.markersLayer!)
                        .bindPopup(`<div style="font-family: Inter, sans-serif; text-align: center;"><b style="font-size: 14px; color: #1e293b;">${star}${g.name || 'Garage Inconnu'}</b><br><span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; margin-top: 2px;">${g.address || g.city}</span>${recommendedText}<span style="font-size: 11px; color: #4f46e5; font-weight: 600; background: #e0e7ff; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;">À ${g.distance.toFixed(1)} km</span></div>`, { closeButton: false, className: 'premium-popup' });
                     this.garageMarkers.set(g.id, marker);
                  }
               });
            }, 100);
         } else if (this.leafletMap) {
            // Destroy the map instance when we leave the home tab so it recreates safely
            this.leafletMap.remove();
            this.leafletMap = undefined;
         }
      });

      this.loginForm = this.fb.group({
         type: ['Particulier'],
         name: [''],
         email: ['', [Validators.required, Validators.email]],
         phone: [''],
         city: [''],
         address: [''],
         password: ['', Validators.required]
      });
      this.requestForm = this.fb.group({
         locationCity: [''],
         locationCommune: [''],
         locationQuarter: [''],
         locationPrecision: [''],
         gpsCoordinates: [''],
         selectedVehicleId: ['', Validators.required],
         preferredPeriod: [''],
         interventionType: [''],
         description: [''],
         preferredDate: [''],
         preferredSlot: [''],
         interventionDate: [''],
         interventionLocation: ['']
      });
      // Enhanced Vehicle Form - VIN Required
      this.vehicleForm = this.fb.group({
         plate: ['', Validators.required],
         brand: ['', Validators.required],
         model: ['', Validators.required],
         year: [2020, Validators.required],
         fuel: ['Essence'],
         gearbox: ['Automatique'],
         vin: ['', Validators.required],
         mileage: [0, Validators.required],
         color: [''],
         insuranceProvider: [''],
         lastRevisionDate: ['']
      });
      this.profileForm = this.fb.group({
         name: ['', Validators.required],
         phone: ['', Validators.required],
         email: ['', [Validators.required, Validators.email]],
         city: [''],
         address: ['']
      });

      // Calculate Date Constraints (Current Year Only)
      const today = new Date();
      this.minDateStr = today.toISOString().split('T')[0];
      // Limit to end of current year
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      this.maxDateStr = endOfYear.toISOString().split('T')[0];

      // Updated Wizard Tree using SVGs mainly
      this.WIZARD_TREE = {
         'ROOT': {
            id: 'ROOT', question: "Quel est le problème principal ?", type: 'ICON_GRID', options: [
               { label: 'Voyant allumé', svgKey: 'dash-engine', nextId: 'LIGHTS_COLOR' },
               { label: 'Bruit anormal', svgKey: 'dash-noise', nextId: 'NOISE_WHEN' },
               { label: 'Fumée / Odeur', svgKey: 'dash-smoke', nextId: 'SMOKE_TYPE' },
               { label: 'Conduite / Boîte', svgKey: 'dash-steering', nextId: 'DRIVE_SYMPTOM' },
               { label: 'Démarrage / Moteur', svgKey: 'dash-battery', nextId: 'START_SYMPTOM' },
               { label: 'Fuite liquide', svgKey: 'dash-drop', nextId: 'LEAK_COLOR' },
               { label: 'Clim / Visibilité', svgKey: 'dash-snow', nextId: 'CLIM_SYMPTOM' },
               { label: 'Carrosserie', svgKey: 'dash-body', nextId: 'BODY_TYPE' },
               { label: 'Autre / Entretien', svgKey: 'dash-tool', nextId: 'END', diagnosis: 'Demande Entretien / Autre' }
            ]
         },
         'LIGHTS_COLOR': {
            id: 'LIGHTS_COLOR', question: "Quelle est la couleur du voyant ?", type: 'CHOICE', options: [
               { label: 'Rouge (Danger / Arrêt)', color: '#ef4444', nextId: 'LIGHTS_RED_ICONS' },
               { label: 'Orange (Avertissement)', color: '#f59e0b', nextId: 'LIGHTS_ORANGE_ICONS' }
            ]
         },
         'LIGHTS_RED_ICONS': {
            id: 'LIGHTS_RED_ICONS', question: "Quel symbole (Rouge) ?", type: 'ICON_GRID', options: [
               { label: 'Pression Huile', svgKey: 'dash-oil', nextId: 'END', diagnosis: 'Pression Huile Insuffisante (Arrêt Immédiat)', color: '#ef4444' },
               { label: 'Température', svgKey: 'dash-temp', nextId: 'END', diagnosis: 'Surchauffe Moteur / Liquide Refroidissement', color: '#ef4444' },
               { label: 'Batterie', svgKey: 'dash-battery', nextId: 'END', diagnosis: 'Défaut Charge Alternateur', color: '#ef4444' },
               { label: 'Freins (!)', svgKey: 'dash-brake', nextId: 'END', diagnosis: 'Niveau Liquide Frein / Frein à main', color: '#ef4444' },
               { label: 'Airbag', svgKey: 'dash-airbag', nextId: 'END', diagnosis: 'Défaut Airbag / Ceinture', color: '#ef4444' },
               { label: 'Direction', svgKey: 'dash-steering', nextId: 'END', diagnosis: 'Panne Direction Assistée', color: '#ef4444' }
            ]
         },
         'LIGHTS_ORANGE_ICONS': {
            id: 'LIGHTS_ORANGE_ICONS', question: "Quel symbole (Orange) ?", type: 'ICON_GRID', options: [
               { label: 'Moteur', svgKey: 'dash-engine', nextId: 'LIGHTS_ENGINE_BLINK', color: '#f59e0b' },
               { label: 'Pression Pneu', svgKey: 'dash-tpms', nextId: 'END', diagnosis: 'Pression Pneus (TPMS)', color: '#f59e0b' },
               { label: 'ABS', svgKey: 'dash-abs', nextId: 'END', diagnosis: 'Système Antiblocage (ABS)', color: '#f59e0b' },
               { label: 'Préchauffage', svgKey: 'dash-coil', nextId: 'END', diagnosis: 'Préchauffage / Injection (Diesel)', color: '#f59e0b' },
               { label: 'ESP / Glissade', svgKey: 'dash-esp', nextId: 'END', diagnosis: 'Contrôle Trajectoire (ESP)', color: '#f59e0b' },
               { label: 'Direction', svgKey: 'dash-steering', nextId: 'END', diagnosis: 'Direction Assistée', color: '#f59e0b' },
               { label: 'FAP / Échapp.', svgKey: 'dash-fap', nextId: 'END', diagnosis: 'Filtre à Particules (FAP)', color: '#f59e0b' }
            ]
         },
         // ... (Rest of tree can remain similar but logic will handle SVG keys if present)
         'LIGHTS_ENGINE_BLINK': {
            id: 'LIGHTS_ENGINE_BLINK', question: "Le voyant moteur clignote-t-il ?", type: 'CHOICE', options: [
               { label: 'Oui, il clignote', nextId: 'END', diagnosis: 'Ratés Allumage (Danger Catalyseur)' },
               { label: 'Non, il est fixe', nextId: 'END', diagnosis: 'Système Antipollution / Sonde' }
            ]
         },
         'NOISE_WHEN': {
            id: 'NOISE_WHEN', question: "Quand entendez-vous ce bruit ?", type: 'CHOICE', options: [
               { label: 'Au freinage', nextId: 'NOISE_BRAKE' },
               { label: 'En roulant (vitesse)', nextId: 'NOISE_DRIVE' },
               { label: 'En tournant le volant', nextId: 'NOISE_TURN' },
               { label: 'Au démarrage (froid)', nextId: 'NOISE_START' }
            ]
         },
         'NOISE_BRAKE': {
            id: 'NOISE_BRAKE', question: "Type de bruit au freinage ?", type: 'CHOICE', options: [
               { label: 'Sifflement aigu', nextId: 'END', diagnosis: 'Plaquettes usées ou vitrifiées' },
               { label: 'Grognement (ferraille)', nextId: 'END', diagnosis: 'Plaquettes mortes (Disques touchés)' }
            ]
         },
         'NOISE_DRIVE': {
            id: 'NOISE_DRIVE', question: "Détails bruit en roulant", type: 'CHOICE', options: [
               { label: 'Ronronnement qui augmente avec vitesse', nextId: 'END', diagnosis: 'Roulement de roue HS' },
               { label: 'Bruit échappement fort', nextId: 'END', diagnosis: 'Pot échappement percé' },
               { label: 'Claquement sur bosses', nextId: 'END', diagnosis: 'Suspension / Train roulant' }
            ]
         },
         'NOISE_TURN': {
            id: 'NOISE_TURN', question: "Bruit en tournant", type: 'CHOICE', options: [
               { label: 'Clac-Clac régulier', nextId: 'END', diagnosis: 'Cardan HS' },
               { label: 'Grincement / Direction dure', nextId: 'END', diagnosis: 'Pompe Direction Assistée' }
            ]
         },
         'NOISE_START': {
            id: 'NOISE_START', question: "Bruit au démarrage", type: 'CHOICE', options: [
               { label: 'Sifflement strident', nextId: 'END', diagnosis: 'Courroie Accessoire détendue' },
               { label: 'Claquement moteur (disparaît à chaud)', nextId: 'END', diagnosis: 'Poussoirs hydrauliques / Jeu soupapes' }
            ]
         },
         'SMOKE_TYPE': {
            id: 'SMOKE_TYPE', question: "Symptôme principal ?", type: 'CHOICE', options: [
               { label: 'Fumée visible', nextId: 'SMOKE_COLOR' },
               { label: 'Odeur suspecte', nextId: 'SMELL_TYPE' }
            ]
         },
         'SMOKE_COLOR': {
            id: 'SMOKE_COLOR', question: "Couleur de la fumée ?", type: 'CHOICE', options: [
               { label: 'Blanche épaisse (à chaud)', nextId: 'END', diagnosis: 'Joint de Culasse (Eau)' },
               { label: 'Noire (accélération)', nextId: 'END', diagnosis: 'Mauvaise combustion / EGR / Injecteurs' },
               { label: 'Bleue', nextId: 'END', diagnosis: 'Consommation Huile (Turbo/Segmentation)' }
            ]
         },
         'SMELL_TYPE': {
            id: 'SMELL_TYPE', question: "Type d'odeur ?", type: 'CHOICE', options: [
               { label: 'Carburant', nextId: 'END', diagnosis: 'Fuite circuit carburant' },
               { label: 'Brûlé (Plastique/Caoutchouc)', nextId: 'END', diagnosis: 'Embrayage patine ou Frein bloqué' },
               { label: 'Chaud / Sucré (Habitacle)', nextId: 'END', diagnosis: 'Fuite Radiateur Chauffage' }
            ]
         },
         'DRIVE_SYMPTOM': {
            id: 'DRIVE_SYMPTOM', question: "Ressenti au volant ?", type: 'CHOICE', options: [
               { label: 'Boîte de vitesse / Embrayage', nextId: 'DRIVE_GEAR' },
               { label: 'Vibrations', nextId: 'DRIVE_VIBE' },
               { label: 'Tenue de route', nextId: 'DRIVE_ROAD' }
            ]
         },
         'DRIVE_GEAR': {
            id: 'DRIVE_GEAR', question: "Problème Boîte", type: 'CHOICE', options: [
               { label: 'Vitesses craquent', nextId: 'END', diagnosis: 'Synchros usés / Embrayage' },
               { label: 'Levier dur', nextId: 'END', diagnosis: 'Tringlerie / Manque huile boîte' },
               { label: 'Moteur tourne vite mais n\'avance pas', nextId: 'END', diagnosis: 'Embrayage HS (Patine)' }
            ]
         },
         'DRIVE_VIBE': {
            id: 'DRIVE_VIBE', question: "Quand ça vibre ?", type: 'CHOICE', options: [
               { label: 'Au freinage', nextId: 'END', diagnosis: 'Disques voilés' },
               { label: 'À haute vitesse (110+)', nextId: 'END', diagnosis: 'Équilibrage Roues' },
               { label: 'Au ralenti (arrêt)', nextId: 'END', diagnosis: 'Support Moteur HS' }
            ]
         },
         'DRIVE_ROAD': {
            id: 'DRIVE_ROAD', question: "Tenue de route", type: 'CHOICE', options: [
               { label: 'Tire d\'un côté', nextId: 'END', diagnosis: 'Parallélisme / Pneu' },
               { label: 'Flotte / Rebondit', nextId: 'END', diagnosis: 'Amortisseurs usés' }
            ]
         },
         'START_SYMPTOM': {
            id: 'START_SYMPTOM', question: "Que se passe-t-il (clé tournée) ?", type: 'CHOICE', options: [
               { label: 'Rien (Silence)', nextId: 'END', diagnosis: 'Batterie HS / Démarreur' },
               { label: 'Clic-Clic rapide', nextId: 'END', diagnosis: 'Batterie faible / Démarreur' },
               { label: 'Moteur tourne mais ne part pas', nextId: 'START_NO_IGNITION' },
               { label: 'Cale en roulant', nextId: 'END', diagnosis: 'Alternateur / Capteur PMH' }
            ]
         },
         'START_NO_IGNITION': {
            id: 'START_NO_IGNITION', question: "Quel carburant ?", type: 'CHOICE', options: [
               { label: 'Essence', nextId: 'END', diagnosis: 'Pompe essence / Allumage / Capteur' },
               { label: 'Diesel', nextId: 'END', diagnosis: 'Préchauffage / Injection / Désamorçage' }
            ]
         },
         'LEAK_COLOR': {
            id: 'LEAK_COLOR', question: "Couleur liquide au sol ?", type: 'CHOICE', options: [
               { label: 'Noir / Marron', nextId: 'END', diagnosis: 'Fuite Huile Moteur' },
               { label: 'Rouge / Rose (Huileux)', nextId: 'END', diagnosis: 'Fuite Boîte Auto / Direction Assistée' },
               { label: 'Rose / Vert / Jaune (Eau)', nextId: 'END', diagnosis: 'Fuite Liquide Refroidissement' },
               { label: 'Transparent (Odeur essence)', nextId: 'END', diagnosis: 'Fuite Carburant (DANGER)' },
               { label: 'Transparent (Eau pure)', nextId: 'END', diagnosis: 'Condensation Clim (Normal)' }
            ]
         },
         'CLIM_SYMPTOM': {
            id: 'CLIM_SYMPTOM', question: "Quel équipement ?", type: 'CHOICE', options: [
               { label: 'Climatisation', nextId: 'CLIM_AC' },
               { label: 'Essuie-glaces', nextId: 'CLIM_WIPER' },
               { label: 'Vitres', nextId: 'END', diagnosis: 'Lève-vitre HS' }
            ]
         },
         'CLIM_AC': {
            id: 'CLIM_AC', question: "Problème Clim", type: 'CHOICE', options: [
               { label: 'Pas de froid', nextId: 'END', diagnosis: 'Recharge Gaz / Compresseur' },
               { label: 'Ne souffle pas', nextId: 'END', diagnosis: 'Pulseur / Résistance' },
               { label: 'Buée grasse', nextId: 'END', diagnosis: 'Radiateur Chauffage Percé' }
            ]
         },
         'CLIM_WIPER': {
            id: 'CLIM_WIPER', question: "Problème Essuie-glace", type: 'CHOICE', options: [
               { label: 'Ne bougent plus', nextId: 'END', diagnosis: 'Moteur EG / Fusible' },
               { label: 'Pas de liquide', nextId: 'END', diagnosis: 'Pompe Lave-glace HS' }
            ]
         },
         'BODY_TYPE': {
            id: 'BODY_TYPE', question: "Type de dommage ?", type: 'ICON_GRID', options: [
               { label: 'Choc / Accident', icon: '💥', nextId: 'END', diagnosis: 'Carrosserie (Choc)' },
               { label: 'Rayures', icon: '🔑', nextId: 'END', diagnosis: 'Peinture / Rayures' },
               { label: 'Pare-brise', icon: '🕸️', nextId: 'BODY_GLASS' }
            ]
         },
         'BODY_GLASS': {
            id: 'BODY_GLASS', question: "Type bris de glace", type: 'CHOICE', options: [
               { label: 'Impact', nextId: 'END', diagnosis: 'Réparation Impact' },
               { label: 'Fissure / Cassé', nextId: 'END', diagnosis: 'Remplacement Vitrage' }
            ]
         },
         'END': { id: 'END', question: "Diagnostic terminé", type: 'END' }
      };

      effect(() => {
         if (this.currentUser() && this.activeTab() === 'home' && !this.userLocation()) {
            this.requestLocation();
         }
      });
   }

   private locationRetryCount = 0;

   async requestLocation() {
      try {
         if (Capacitor.isNativePlatform()) {
            const { Geolocation } = await import('@capacitor/geolocation');

            // Allow more time for Android to fully bind the Activity
            await new Promise(resolve => setTimeout(resolve, 1500));

            let perms = await Geolocation.checkPermissions();
            if (perms.location !== 'granted') {
               perms = await Geolocation.requestPermissions();
            }

            if (perms.location !== 'granted') {
               // Only show rejection toast if user explicitly denied it, not on system boot skip
               if (this.locationRetryCount > 0) {
                  this.toastService.show('Permission de localisation refusée', 'error');
               }
               return;
            }

            const pos = await Geolocation.getCurrentPosition({
               enableHighAccuracy: true,
               timeout: 10000,
               maximumAge: 3000
            });
            this.userLocation.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            this.requestForm.patchValue({ gpsCoordinates: `${pos.coords.latitude}, ${pos.coords.longitude}` });
         } else {
            if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(
                  (pos) => {
                     this.userLocation.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                     this.requestForm.patchValue({ gpsCoordinates: `${pos.coords.latitude}, ${pos.coords.longitude}` });
                  },
                  (err) => {
                     this.toastService.show('Impossible de récupérer la position sur ce navigateur', 'error');
                  }
               );
            } else {
               this.toastService.show('Géolocalisation non supportée', 'error');
            }
         }
      } catch (e: any) {
         // On Android, calling this too early can throw an internal plugin error.
         console.error('Geolocation Error:', e);
         if (this.locationRetryCount < 2) {
            this.locationRetryCount++;
            setTimeout(() => this.requestLocation(), 2500); // Retry silently
         } else {
            this.toastService.show('Erreur de localisation interne (' + (e?.message || 'Inconnue') + ')', 'error');
         }
      }
   }
   myRequests = computed(() => { if (!this.currentPhone()) return []; return this.dataService.quoteRequests().filter(r => r.motoristPhone === this.currentPhone()); });

   nearbyGarages = computed(() => {
      const tenants = this.dataService.tenants().filter(t => t.status === 'Active');
      const city = this.cityFilter();
      const commune = this.communeFilter();
      const minRating = this.minRatingFilter();
      let filtered = tenants;

      if (city) {
         filtered = filtered.filter(t => t.city === city);
         if (commune) filtered = filtered.filter(t => t.commune === commune);
      }
      if (minRating > 0) {
         filtered = filtered.filter(t => (t.rating || 0) >= minRating);
      }

      const userLoc = this.userLocation() || { lat: 5.3599, lng: -4.0083 };
      return filtered.map(t => {
         const tLat = t.lat || 5.3599;
         const tLng = t.lng || -4.0083;
         const distance = this.calculateDistance(userLoc.lat, userLoc.lng, tLat, tLng);
         return { ...t, distance };
      }).sort((a, b) => a.distance - b.distance);
   });

   // Date validation helpers
   minInterventionDate(): string {
      const today = new Date();
      return today.toISOString().split('T')[0];
   }

   maxInterventionDate(): string {
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      return maxDate.toISOString().split('T')[0];
   }

   requestCommunes = computed(() => { const city = this.requestCity(); return city ? IVORY_COAST_LOCATIONS[city] || [] : []; });
   calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number { const R = 6371; const dLat = this.deg2rad(lat2 - lat1); const dLon = this.deg2rad(lon2 - lon1); const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c; }
   deg2rad(deg: number) { return deg * (Math.PI / 180); }
   getMapUrl(lat: number, lng: number): SafeResourceUrl { return this.sanitizer.bypassSecurityTrustResourceUrl(`https://maps.google.com/maps?q=${lat},${lng}&z=13&output=embed`); }
   completedRequestsCount = computed(() => this.myRequests().filter(r => r.status === 'COMPLETED').length);
   setAuthMode(mode: any) { this.authMode.set(mode); }
   quickLogin(client: any) {
      const fullName = client.firstName + (client.lastName ? ' ' + client.lastName : '');
      this.currentUser.set(fullName);
      this.currentPhone.set(client.phone);
      this.currentClientData.set(client);
      this.activeTab.set('home');

      // Force update the profile form with actual server data
      this.profileForm.patchValue({
         name: fullName,
         phone: client.phone,
         email: client.email,
         city: client.address?.city || '',
         address: client.address?.street || ''
      });

      // Load all API data (quoteRequests, invoices, repairs, etc.)
      this.dataService.loadApiData();

      // Init Push Notifications for this logged-in user
      this.initPushNotifications();
   }

   private initPushNotifications() {
      setTimeout(async () => {
         if (!Capacitor.isNativePlatform()) return;

         const phone = this.currentPhone();
         if (!phone) return;

         let permStatus = await PushNotifications.checkPermissions();
         if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
         }

         if (permStatus.receive !== 'granted') {
            console.warn('Push permissions denied.');
            return;
         }

         await PushNotifications.register();

         PushNotifications.addListener('registration', (token) => {
            this.dataService.syncPushToken(phone, token.value);
         });

         PushNotifications.addListener('pushNotificationReceived', (notification) => {
            this.toastService.show(notification.title || 'Vous avez reçu une notification', 'success');
            // Refresh background data
            this.dataService.loadApiData();
         });

         PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            const type = notification.notification.data?.type;

            if (type === 'DEVIS' || type === 'FACTURE') {
               this.requestsView.set('factures');
               this.activeTab.set('requests');
            } else if (type === 'QUOTE_REQUEST' || type === 'REPAIR_ORDER') {
               this.requestsView.set('demandes');
               this.activeTab.set('requests');
            }
            this.dataService.loadApiData();
         });
      }, 6000);
   }

   submitForgotPassword() {
      const email = this.forgotPasswordEmail().trim().toLowerCase();
      if (!email) {
         this.toastService.show('Veuillez saisir votre adresse email.', 'error');
         return;
      }
      this.forgotPasswordLoading.set(true);
      this.dataService.forgotPasswordMobile(email).subscribe({
         next: (res) => {
            this.forgotPasswordResult.set({ tempPassword: res.tempPassword, firstName: res.firstName });
            this.forgotPasswordLoading.set(false);
         },
         error: (err) => {
            this.forgotPasswordLoading.set(false);
            if (err?.error?.message === 'CLIENT_NOT_FOUND') {
               this.toastService.show('Aucun compte trouvé avec cet email.', 'error');
            } else {
               this.toastService.show('Erreur lors de la réinitialisation.', 'error');
            }
         }
      });
   }

   closeForgotPassword() {
      this.forgotPasswordMode.set(false);
      this.forgotPasswordEmail.set('');
      this.forgotPasswordResult.set(null);
   }

   submitChangePassword() {
      const oldPwd = this.changePasswordOld();
      const newPwd = this.changePasswordNew();
      const confirmPwd = this.changePasswordConfirm();

      if (!oldPwd || !newPwd || !confirmPwd) {
         this.toastService.show('Veuillez remplir tous les champs.', 'error');
         return;
      }
      if (newPwd.length < 6) {
         this.toastService.show('Le nouveau mot de passe doit contenir au moins 6 caractères.', 'error');
         return;
      }
      if (newPwd !== confirmPwd) {
         this.toastService.show('Les mots de passe ne correspondent pas.', 'error');
         return;
      }

      let clientId = this.currentClientData()?.id;
      if (!clientId) {
         const phone = this.currentPhone();
         const found = this.dataService.clients().find(c => c.phone === phone);
         clientId = found?.id;
      }
      if (!clientId) {
         this.toastService.show('Erreur: utilisateur non identifié.', 'error');
         return;
      }

      this.changePasswordLoading.set(true);
      this.dataService.changePasswordMobile(clientId, oldPwd, newPwd).subscribe({
         next: () => {
            this.changePasswordLoading.set(false);
            this.closeChangePassword();
            this.toastService.show('Mot de passe modifié avec succès !', 'success');
         },
         error: (err) => {
            this.changePasswordLoading.set(false);
            if (err?.error?.message === 'WRONG_PASSWORD') {
               this.toastService.show('L\'ancien mot de passe est incorrect.', 'error');
            } else {
               this.toastService.show('Erreur lors de la modification.', 'error');
            }
         }
      });
   }

   closeChangePassword() {
      this.showChangePasswordModal.set(false);
      this.changePasswordOld.set('');
      this.changePasswordNew.set('');
      this.changePasswordConfirm.set('');
   }

   submitAuth() {
      const val = this.loginForm.value;
      if (this.authMode() === 'login') {
         if (!val.email || !val.password) return;

         // Bugfix: Mobile keyboards often auto-capitalize the first letter of the email.
         // Postgres findUnique is case sensitive, leading to "deleted account" bugs.
         const normalizedEmail = val.email.trim().toLowerCase();

         this.dataService.loginMobileClient({ email: normalizedEmail, password: val.password }).subscribe({
            next: (res: any) => {
               const client = res.user || res; if (res.token) localStorage.setItem("auth_token", res.token); this.quickLogin(client);
               this.toastService.show('Connexion réussie', 'success');
            },
            error: (err) => {
               this.toastService.show('Identifiants incorrects ou introuvables.', 'error');
            }
         });
      } else {
         if (!val.name || !val.email || !val.phone || !val.city || !val.address || !val.password) return;

         const normalizedEmail = val.email.trim().toLowerCase();

         // Split name into firstName/lastName for better DB consistency
         const nameParts = val.name.trim().split(' ');
         const firstName = nameParts[0];
         const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

         const newClientData = {
            firstName: firstName,
            lastName: lastName,
            phone: val.phone,
            email: normalizedEmail,
            password: val.password,
            type: val.type || 'Particulier',
            address: { street: val.address, city: val.city, zip: '' },
            vehicleIds: [],
            financial: { paymentMethod: 'Cash', paymentTerms: 'Comptant', discountPercent: 0, balance: 0 },
            history: []
         };

         this.dataService.registerMobileClient(newClientData).subscribe({
            next: (res: any) => {
               const client = res.user || res; if (res.token) localStorage.setItem("auth_token", res.token); this.quickLogin(client);
               this.toastService.show('Compte créé avec succès', 'success');
            },
            error: (err) => {
               if (err?.error?.message === 'DOCUMENT_EXISTS') {
                  this.toastService.show('Cette adresse e-mail possède déjà un compte ICE.', 'error');
               } else {
                  this.toastService.show('Erreur lors de la création du compte.', 'error');
               }
            }
         });
      }
   }

   logout() {
      this.currentUser.set(null);
      this.currentPhone.set(null);
      this.currentClientData.set(null);
      this.authMode.set('login');
      this.loginForm.reset(); // Clear old input
      localStorage.removeItem('mobileUserName');
      localStorage.removeItem('mobileUserPhone');
      localStorage.removeItem('auth_token');
      // Destroy the Leaflet map so it re-creates cleanly on next login
      // (avoids the grey map bug where invalidateSize is never called after reconnection)
      if (this.leafletMap) {
         this.leafletMap.remove();
         this.leafletMap = undefined;
      }
   }
   startRequest() {
      this.resetRequestWizard();
      this.activeTab.set('create');
      const v = this.myVehicles()[0];
      if (v) this.selectVehicleForRequest(v);
   }
   getVisibleQuotes(req: any): string[] { return (req.proposedQuotes || []).filter((qid: string) => { const q = this.getQuote(qid); return q && (q.status === 'ENVOYE' || q.status === 'ACCEPTE'); }); }
   getQuote(id: string) { return this.dataService.getPublicInvoiceById(id); }
   getRepair(id: string) { return this.dataService.getPublicRepairById(id); }
   getRepairStatus(id?: string) { return id ? this.dataService.getPublicRepairById(id)?.status : ''; }
   getStatusLabel(s: string) { return s; }
   getRef(id?: string): string { return id ? id.substring(0, 8).toUpperCase() : ''; }
   viewRequestInfo(req: QuoteRequest) { this.selectedRequestInfo.set(req); }
   closeRequestInfo() {
      this.selectedRequestInfo.set(null);
      this.editingInterventionDate.set(false);
   }

   startEditingDate(req: QuoteRequest) {
      this.editingInterventionDate.set(true);
      if (req.interventionDate) {
         try {
            this.newInterventionDate.set(new Date(req.interventionDate).toISOString().substring(0, 10));
         } catch {
            this.newInterventionDate.set(req.interventionDate.substring(0, 10));
         }
      } else {
         this.newInterventionDate.set('');
      }
   }

   saveInterventionDate(req: QuoteRequest) {
      if (this.newInterventionDate()) {
         try {
            const dateObj = new Date(this.newInterventionDate());
            const isoDate = dateObj.toISOString();
            this.dataService.syncQuoteRequestDB(req.id, { interventionDate: isoDate });
            this.selectedRequestInfo.set({ ...req, interventionDate: isoDate });
         } catch {
            this.dataService.syncQuoteRequestDB(req.id, { interventionDate: this.newInterventionDate() });
            this.selectedRequestInfo.set({ ...req, interventionDate: this.newInterventionDate() });
         }
      }
      this.editingInterventionDate.set(false);
   }

   cancelEditingDate() {
      this.editingInterventionDate.set(false);
   }

   closeSuccessWizard() {
      this.resetRequestWizard();
      this.resetWizard();
      this.activeTab.set('requests');
      this.cdr.detectChanges(); // Force UI update
   }

   cancelRequest(req: QuoteRequest) {
      this.requestToCancel.set(req);
   }

   confirmCancel() {
      const req = this.requestToCancel();
      if (req) {
         this.dataService.syncQuoteRequestDB(req.id, { status: 'CANCELED' });
         this.selectedRequestInfo.set({ ...req, status: 'CANCELED' });
         this.toastService.show('La demande a été annulée.', 'info');
      }
      this.requestToCancel.set(null);
   }

   abortCancel() {
      this.requestToCancel.set(null);
   }

   viewQuoteDetails(req: any, quote: any) { this.selectedQuoteRequest.set(req); this.selectedQuoteDetails.set(quote); }
   closeQuoteDetails() { this.selectedQuoteDetails.set(null); }
   acceptQuote(req: any, quote: any) { this.quoteToConfirm.set({ req, quote }); this.showConfirmQuoteModal.set(true); }
   cancelQuoteChoice() { this.showConfirmQuoteModal.set(false); }
   async confirmQuoteChoice() {
      const d = this.quoteToConfirm();
      if (d) {
         this.showConfirmQuoteModal.set(false);
         this.toastService.show('Initialisation du paiement des frais de gestion...', 'info');

         this.dataService.initQuotePayment(d.req.id, d.quote.id).subscribe({
            next: async (res) => {
               if (Capacitor.isNativePlatform()) {
                  const { Browser } = await import('@capacitor/browser');
                  await Browser.open({ url: res.paymentUrl });
                  await Browser.addListener('browserFinished', () => {
                     // When user closes the browser, check the backend for new status
                     this.dataService.loadApiData();
                     this.closeQuoteDetails();
                  });
               } else {
                  window.open(res.paymentUrl, '_blank');
                  this.closeQuoteDetails();
               }
            },
            error: (e) => {
               this.toastService.show(e?.error?.message || 'Erreur lors de l\'initialisation du paiement.', 'error');
               this.closeQuoteDetails();
            }
         });
      }
   }
   openGarageProfile(g: any) { this.selectedGarageProfile.set(g); }
   closeGarageProfile() { this.selectedGarageProfile.set(null); }
   openRateModal(req: any) { this.ratingRequest.set(req); this.currentRating.set(req.clientRating || 0); this.ratingComment.set(req.clientReview || ''); this.showRatingModal.set(true); }
   closeRatingModal() { this.showRatingModal.set(false); }
   setRating(n: number) { this.currentRating.set(n); }
   submitRating() {
      const req = this.ratingRequest();
      if (req) {
         this.dataService.submitReview(req.id, this.currentRating(), this.ratingComment());
         this.toastService.show('Merci pour votre avis !', 'success');
      }
      this.closeRatingModal();
      this.cdr.detectChanges(); // Force UI update
   }

   openAddVehicleForm() {
      this.editingVehicleId.set(null);
      this.vehicleForm.reset({ year: 2020, fuel: 'Essence', gearbox: 'Automatique', mileage: 0, vin: '' });
      this.tempPhotos.set([]);
      this.showAddVehicleForm.set(true);
   }
   closeAddVehicleForm() { this.showAddVehicleForm.set(false); }

   editVehicle(v: MotoristVehicle) {
      this.editingVehicleId.set(v.id);
      this.vehicleForm.patchValue({
         plate: v.plate,
         brand: v.brand,
         model: v.model,
         year: v.year,
         mileage: v.mileage,
         fuel: v.fuel,
         vin: v.vin,
         gearbox: v.gearbox || 'Automatique'
      });
      this.tempPhotos.set([...(v.photos || [])]);
      this.showAddVehicleForm.set(true);
   }

   saveVehicle() {
      if (this.vehicleForm.invalid) {
         this.vehicleForm.markAllAsTouched();
         this.toastService.show('Veuillez remplir tous les champs obligatoires.', 'error');
         return;
      }
      if (!this.currentUser()) return;

      const v = this.vehicleForm.value;
      const existingId = this.editingVehicleId();

      const newVehicle: MotoristVehicle = {
         id: existingId || this.generateUUID(),
         ownerPhone: this.currentPhone() || 'Inconnu',
         plate: v.plate.toUpperCase(),
         brand: v.brand,
         model: v.model,
         year: v.year,
         mileage: v.mileage,
         fuel: v.fuel,
         gearbox: v.gearbox,
         vin: v.vin?.toUpperCase() || '',
         photos: this.tempPhotos()
      };

      if (existingId) {
         this.dataService.updateMobileVehicle(newVehicle);
         this.dataService.syncMobileVehicleToCRM(newVehicle); // CRM Sync
         this.toastService.show('Véhicule mis à jour', 'success');
      } else {
         this.dataService.addMobileVehicle(newVehicle);
         this.toastService.show('Véhicule ajouté !', 'success');
      }
      this.closeAddVehicleForm();
      this.cdr.detectChanges(); // Force UI update
   }

   deleteVehicle(id: string) { this.dataService.deleteMobileVehicle(id); }
   enableEditProfile() { this.isEditingProfile.set(true); }
   cancelEditProfile() { this.isEditingProfile.set(false); }

   saveProfile() {
      if (this.profileForm.invalid) return;
      const oldPhone = this.currentPhone();
      this.currentUser.set(this.profileForm.value.name);

      // Sync to CRM
      if (oldPhone) {
         this.dataService.syncMobileProfileToCRM(oldPhone, this.profileForm.value);
      }

      this.toastService.show('Profil mis à jour', 'success');
      this.closeProfileInfo();
      this.cdr.detectChanges(); // Force UI update
   }

   openSchedulingModal(req: any) { this.showSchedulingModal.set(true); }
   closeSchedulingModal() { this.showSchedulingModal.set(false); }
   submitScheduling() { this.closeSchedulingModal(); }
   updateCityFilter(c: string) { this.cityFilter.set(c); }
   onRequestCityChange() { this.requestCity.set(this.requestForm.value.locationCity); }

   // WIZARD METHODS
   resetWizard() {
      this.wizardStep.set(0);
      this.wizardStepId.set('ROOT');
      this.wizardDiagnosis.set('');
      this.wizardAnswers.set([]);
      this.wizardHistory.set([]);
   }

   // NEW: Step-by-step request wizard methods
   resetRequestWizard() {
      this.requestWizardStep.set(1);
      this.requestNeedType.set([]);
      this.isVehicleDrivable.set(null);
      this.requestUrgency.set(null);
      this.requestServiceType.set(null);
      this.requestPhotos.set([]);
      this.requestForm.reset();
      this.requestForm.patchValue({ locationCity: '', locationCommune: '', locationQuarter: '', description: '' });
   }

   cancelRequestWizard() {
      this.resetRequestWizard();
      this.activeTab.set('home');
   }

   setVehicleDrivable(val: boolean) { this.isVehicleDrivable.set(val); }
   toggleNeedType(val: string) { 
      const current = this.requestNeedType();
      if (current.includes(val)) {
         this.requestNeedType.set(current.filter(n => n !== val));
      } else {
         this.requestNeedType.set([...current, val]);
      }
   }
   setUrgency(val: string) {
      this.requestUrgency.set(val);
      if (val === 'urgency_immediate' || val === 'urgency_today') {
         const tzOffset = (new Date()).getTimezoneOffset() * 60000;
         const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
         this.requestForm.patchValue({ interventionDate: localISOTime });
      }
   }
   setServiceType(val: string) { this.requestServiceType.set(val); }

   goToNextRequestStep() {
      const step = this.requestWizardStep();
      if (step === 1) {
         if (!this.requestForm.get('selectedVehicleId')?.value) return;
         this.requestWizardStep.set(2);
      } else if (step === 2) {
         if (this.requestNeedType().length === 0) return;
         this.requestWizardStep.set(3);
      } else if (step === 3) {
         if (this.isVehicleDrivable() === null) return;
         this.requestWizardStep.set(4);
      } else if (step === 4) {
         if (!this.requestUrgency()) return;
         this.requestWizardStep.set(5);
      } else if (step === 5) {
         this.requestWizardStep.set(6);
      } else if (step === 6) {
         if (!this.requestServiceType()) return;
         this.requestWizardStep.set(7);
      } else if (step === 7) {
         if (!this.requestForm.get('locationCity')?.value) {
            this.toastService.show('Veuillez spécifier un lieu.', 'error');
            return;
         }
         this.requestWizardStep.set(8);
      }
   }

   goToPrevRequestStep() {
      const step = this.requestWizardStep();
      if (step > 1 && step <= 8) {
         this.requestWizardStep.set(step - 1);
      }
   }

   currentNode(): WizardNode {
      return this.WIZARD_TREE[this.wizardStepId()] || this.WIZARD_TREE['ROOT'];
   }

   selectOption(opt: any) {
      // Record History (Question + Selected Answer)
      const currentQ = this.currentNode().question;
      this.wizardAnswers.update(history => [...history, { question: currentQ, answer: opt.label }]);

      // Save current step ID to history for BACK functionality
      this.wizardHistory.update(h => [...h, this.wizardStepId()]);

      if (opt.diagnosis) {
         this.wizardDiagnosis.set(opt.diagnosis);
      }
      if (opt.nextId === 'END') {
         // If no specific diagnosis but end reached, handle
         if (!opt.diagnosis) this.wizardDiagnosis.set(opt.label);
      } else {
         this.wizardStepId.set(opt.nextId);
         this.wizardStep.update(v => v + 1);
      }
   }

   // WIZARD BACK FUNCTIONALITY
   wizardBack() {
      const history = this.wizardHistory();
      if (history.length === 0) return; // Cannot go back further than root

      const prevStepId = history[history.length - 1];
      this.wizardHistory.update(h => h.slice(0, -1)); // Pop last
      this.wizardAnswers.update(a => a.slice(0, -1)); // Remove last answer

      this.wizardStepId.set(prevStepId);
      this.wizardDiagnosis.set(''); // Clear diagnosis if we go back
      this.wizardStep.update(v => Math.max(0, v - 1));
   }

   togglePhotoOption(e: any) {
      if (this.isBodyworkDiagnosis()) return; // Locked
      this.wantToAddPhotos.set(e.target.checked);
   }

   // New Modals Methods
   openTipModal() { this.showTipModal.set(true); }
   closeTipModal() { this.showTipModal.set(false); }

   getTenantNameByRepairId(repairId?: string): string {
      if (!repairId) return '';
      const repair = this.dataService.repairs().find(r => r.id === repairId);
      if (!repair) return '';
      const tenantId = repair.tenantId;
      const tenant = this.dataService.tenants().find(t => t.id === tenantId);
      return tenant?.name || '';
   }

   viewInvoice(docData: any) {
      this.selectedInvoicePreview.set(docData);
   }

   closeInvoicePreview() {
      this.selectedInvoicePreview.set(null);
   }

   downloadInvoiceFromPreview() {
      const docData = this.selectedInvoicePreview();
      if (!docData) return;
      this.downloadInvoice(docData);
   }

   async downloadInvoice(docData: any) {
      this.toastService.show(`Génération de la facture ${docData.number}...`, 'info');
      try {
         const doc = new jsPDF({ format: 'a4', unit: 'mm' });

         // --- Resolve garage (tenant) settings for this specific invoice ---
         const tenant = this.dataService.tenants().find(t => t.id === docData.tenantId);
         // Fall back to platform-level settings if tenant not found
         const globalSettings = this.dataService.currentSettings();
         const garageName = tenant?.name || globalSettings.name || 'Garage';
         const garageAddress = tenant?.address || globalSettings.address || '';
         const garageCity = tenant?.city || globalSettings.city || '';
         const garagePhone = tenant?.phone || globalSettings.phone || '';
         const garageLogoUrl = tenant?.settings?.logoUrl || globalSettings.logoUrl || '';
         const primaryColor = globalSettings.docColor || '#2563eb';
         const currency = globalSettings.currency || 'XOF';
         const footerText = globalSettings.invoiceFooter || '';

         // --- Build client data from invoice fields ---
         const clientInvoice = this.dataService.clients().find(c => c.id === docData.clientId);

         // --- Helper functions ---
         const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
               ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
               : { r: 37, g: 99, b: 235 };
         };
         const colorRgb = hexToRgb(primaryColor);
         const format = (n: number) => (n || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

         // --- Totals breakdown ---
         const items = docData.items || [];
         const positiveItems = items.filter((i: any) => i.totalHT >= 0);
         const discountItems = items.filter((i: any) => i.totalHT < 0);
         const grossHT = positiveItems.reduce((acc: number, i: any) => acc + i.totalHT, 0);
         const discountTotal = discountItems.reduce((acc: number, i: any) => acc + Math.abs(i.totalHT), 0);
         const computedVatRate = docData.totalHT > 0
            ? Math.round((docData.totalVAT / docData.totalHT) * 100)
            : 18;

         let y = 20;
         const margin = 20;
         const pageWidth = 210;
         const contentWidth = pageWidth - (margin * 2);

         // ── HEADER ──────────────────────────────────────────────────────────
         if (garageLogoUrl) {
            try { doc.addImage(garageLogoUrl, 'PNG', margin, y, 25, 25, undefined, 'FAST'); } catch (e) { }
         }

         const textLeftX = garageLogoUrl ? margin + 30 : margin;
         doc.setFontSize(16); doc.setTextColor(colorRgb.r, colorRgb.g, colorRgb.b); doc.setFont('helvetica', 'bold');
         doc.text(garageName.toUpperCase(), textLeftX, y + 8);

         doc.setFontSize(9); doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal');
         if (garageAddress) doc.text(garageAddress, textLeftX, y + 14);
         if (garageCity) doc.text(garageCity, textLeftX, y + 18);
         if (garagePhone) doc.text(garagePhone, textLeftX, y + 22);

         doc.setFontSize(24); doc.setTextColor(40, 40, 40); doc.setFont('helvetica', 'bold');
         doc.text(docData.type || 'FACTURE', pageWidth - margin, y + 8, { align: 'right' });

         doc.setFontSize(12); doc.setTextColor(100, 100, 100); doc.setFont('courier', 'normal');
         doc.text(`#${docData.number}`, pageWidth - margin, y + 14, { align: 'right' });

         doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40);
         doc.text(`Date : ${new Date(docData.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, y + 24, { align: 'right' });

         if (docData.dueDate) {
            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
            const dateLabel = docData.type === 'DEVIS' ? 'Validité' : 'Échéance';
            doc.text(`${dateLabel} : ${new Date(docData.dueDate).toLocaleDateString('fr-FR')}`, pageWidth - margin, y + 29, { align: 'right' });
         }

         y += 40;

         // ── CLIENT + VEHICLE INFO ────────────────────────────────────────────
         doc.setDrawColor(230, 230, 230); doc.line(margin, y, pageWidth - margin, y); y += 5;

         // Left: client
         doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'bold');
         doc.text('FACTURÉ À', margin, y);
         y += 5;
         doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
         doc.text(docData.clientName || '', margin, y);
         y += 5;
         doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
         if (clientInvoice) {
            if (clientInvoice.address?.street) doc.text(clientInvoice.address.street, margin, y);
            if (clientInvoice.address?.city) doc.text(`${clientInvoice.address.zip || ''} ${clientInvoice.address.city}`, margin, y + 4);
            if (clientInvoice.vatNumber) doc.text(`TVA: ${clientInvoice.vatNumber}`, margin, y + 8);
         }

         // Right: vehicle
         const col2X = 110;
         let yVeh = y - 5;
         doc.setDrawColor(230, 230, 230); doc.line(105, yVeh, 105, yVeh + 20);
         doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'bold');
         doc.text('VÉHICULE CONCERNÉ', col2X, yVeh);
         yVeh += 5;
         doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
         doc.text(docData.vehicleDescription || 'Non spécifié', col2X, yVeh);
         yVeh += 5;
         doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
         const vehicleObj = this.dataService.getVehicleById(docData.vehicleId || '');
         if (vehicleObj) {
            doc.text(`VIN: ${vehicleObj.vin || '-'}`, col2X, yVeh);
            doc.text(`Immat: ${vehicleObj.plate || '-'}`, col2X, yVeh + 4);
            doc.text(`KM: ${vehicleObj.mileage}`, col2X, yVeh + 8);
         }

         y += 20;
         doc.setDrawColor(230, 230, 230); doc.line(margin, y, pageWidth - margin, y);
         y += 10;

         // ── TABLE HEADER ────────────────────────────────────────────────────
         doc.setFillColor(248, 250, 252); doc.rect(margin, y, contentWidth, 8, 'F');
         doc.setDrawColor(colorRgb.r, colorRgb.g, colorRgb.b); doc.setLineWidth(0.5);
         doc.line(margin, y + 8, pageWidth - margin, y + 8);

         doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'bold');
         doc.text('DESCRIPTION', margin + 2, y + 5);
         doc.text('QTÉ', pageWidth - margin - 60, y + 5, { align: 'right' });
         doc.text('P.U. HT', pageWidth - margin - 35, y + 5, { align: 'right' });
         doc.text('TOTAL HT', pageWidth - margin - 2, y + 5, { align: 'right' });
         y += 14;

         // ── TABLE ROWS ──────────────────────────────────────────────────────
         doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
         items.forEach((item: any) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(item.description || '', margin + 2, y);
            doc.text((item.quantity || 0).toString(), pageWidth - margin - 60, y, { align: 'right' });
            doc.text(format(item.unitPrice), pageWidth - margin - 35, y, { align: 'right' });
            doc.setFont('helvetica', 'bold');
            doc.text(format(item.totalHT), pageWidth - margin - 2, y, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setDrawColor(240, 240, 240); doc.setLineWidth(0.1);
            doc.line(margin, y + 3, pageWidth - margin, y + 3);
            y += 8;
         });

         // ── TOTALS ──────────────────────────────────────────────────────────
         y += 5;
         if (y > 250) { doc.addPage(); y = 20; }

         const rightColX = pageWidth - margin;
         const labelColX = pageWidth - margin - 50;

         const printTotal = (label: string, value: string, bold = false, size = 9, color: 'gray' | 'black' | 'brand' | 'red' = 'gray') => {
            doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal');
            if (color === 'brand') doc.setTextColor(colorRgb.r, colorRgb.g, colorRgb.b);
            else if (color === 'black') doc.setTextColor(0, 0, 0);
            else if (color === 'red') doc.setTextColor(239, 68, 68);
            else doc.setTextColor(100, 100, 100);
            doc.text(label, labelColX, y);
            doc.text(value, rightColX, y, { align: 'right' });
            y += 5;
         };

         if (discountTotal > 0) {
            printTotal('Total Brut HT', format(grossHT));
            printTotal('Remise', '-' + format(discountTotal), false, 9, 'red');
            y += 1; doc.setDrawColor(230, 230, 230); doc.line(labelColX, y - 1, rightColX, y - 1); y += 2;
            printTotal('Net HT', format(docData.totalHT), true, 9, 'black');
         } else {
            printTotal('Total HT', format(docData.totalHT));
         }

         printTotal(`TVA (${computedVatRate}%)`, format(docData.totalVAT));

         y += 2; doc.setDrawColor(50, 50, 50); doc.setLineWidth(0.5);
         doc.line(labelColX, y - 1, rightColX, y - 1); y += 5;

         printTotal('Total TTC', format(docData.totalTTC) + ' ' + currency, true, 12, 'brand');

         if (docData.type !== 'DEVIS') {
            y += 2; doc.setDrawColor(200, 200, 200); doc.line(labelColX, y - 1, rightColX, y - 1); y += 3;
            printTotal('Déjà réglé', format(docData.paidAmount || 0), false, 8);
            printTotal('Reste à payer', format(docData.remainingAmount || 0) + ' ' + currency, true, 10, 'black');
         }

         // ── FOOTER ──────────────────────────────────────────────────────────
         const pageHeight = doc.internal.pageSize.height;
         const footerY = pageHeight - 15;
         doc.setDrawColor(230, 230, 230); doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
         doc.setFontSize(8); doc.setTextColor(150, 150, 150);
         if (footerText) doc.text(footerText, pageWidth / 2, footerY, { align: 'center', maxWidth: 150 });
         doc.setFontSize(6); doc.setTextColor(200, 200, 200);
         doc.text('Document généré automatiquement par ICE BY MECATECH', pageWidth / 2, footerY + 5, { align: 'center' });

         // ── SAVE / SHARE ─────────────────────────────────────────────────────
         const fileName = `${docData.type}_${docData.number}.pdf`;

         if (Capacitor.isNativePlatform()) {
            try {
               const base64Data = doc.output('datauristring').split(',')[1];
               await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Documents });
               const fileUri = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });
               await Share.share({
                  title: fileName,
                  text: `Facture ${docData.number}`,
                  url: fileUri.uri,
                  dialogTitle: 'Enregistrer ou partager la facture',
               });
               this.toastService.show('Facture prête à être enregistrée !', 'success');
            } catch (shareErr: any) {
               if (shareErr?.message?.includes('cancel') || shareErr?.message?.includes('dismiss')) return;
               this.toastService.show('Impossible d\'ouvrir le partage natif.', 'error');
               console.error('Native share error:', shareErr);
            }
         } else {
            doc.save(fileName);
            this.toastService.show('Téléchargement terminé', 'success');
         }
      } catch (err) {
         this.toastService.show('Erreur lors de la génération', 'error');
         console.error(err);
      }
   }

   payInvoice(invoice: any) {
      this.dataService.updateInvoiceStatus(invoice.id, 'PAYE');
      this.toastService.show('Paiement validé avec succès !', 'success');
   }

   openProfileInfo() {
      const phone = this.currentPhone();
      if (phone) {
         const client = this.dataService.clients().find(c => c.phone === phone && c.type === 'Particulier');
         const fallback = this.currentClientData();
         const source = client || fallback;
         if (source) {
            this.profileForm.patchValue({
               name: source.firstName + (source.lastName ? ' ' + source.lastName : ''),
               phone: source.phone,
               email: source.email || '',
               city: source.address?.city || '',
               address: source.address?.street || ''
            });
         } else {
            this.profileForm.patchValue({
               name: this.currentUser() || '',
               phone: phone,
               email: '',
               city: '',
               address: ''
            });
         }
      }
      this.showProfileInfoModal.set(true);
   }
   closeProfileInfo() { this.showProfileInfoModal.set(false); }

   openInvoices() { this.showInvoicesModal.set(true); }
   closeInvoices() { this.showInvoicesModal.set(false); }

   openSettings() { this.showSettingsModal.set(true); }
   closeSettings() { this.showSettingsModal.set(false); }

   selectIcon(icon: any) { }
   submitCustomText(text: string) { }
   onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (e: any) => this.tempPhotos.update(p => [...p, e.target.result]);
         reader.readAsDataURL(file);
      }
   }
   removePhoto(index: number) { this.tempPhotos.update(p => p.filter((_, i) => i !== index)); }
   /**
    * Compress and resize a base64 image to reduce payload size.
    * Max dimension: 800px, JPEG quality: 0.5
    */
   private compressImage(dataUrl: string, maxDim = 800, quality = 0.5): Promise<string> {
      return new Promise((resolve) => {
         const img = new Image();
         img.onload = () => {
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
               if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
               else { w = Math.round(w * maxDim / h); h = maxDim; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
         };
         img.onerror = () => resolve(dataUrl); // Fallback to original on error
         img.src = dataUrl;
      });
   }

   onRequestPhotoSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = async (e: any) => {
            const compressed = await this.compressImage(e.target.result);
            this.requestPhotos.update(p => [...p, compressed]);
         };
         reader.readAsDataURL(file);
      }
   }

   async takePhoto() {
      if (!Capacitor.isNativePlatform()) {
         // Fallback to hidden file input on Desktop/Web
         document.getElementById('mobilePhotoInput')?.click();
         return;
      }

      try {
         const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
         const image = await Camera.getPhoto({
            quality: 50,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Prompt // Asks user: Gallery or Camera
         });

         if (image.dataUrl) {
            const compressed = await this.compressImage(image.dataUrl);
            this.requestPhotos.update(p => [...p, compressed]);
         }
      } catch (error) {
         console.warn('User cancelled photo or camera error:', error);
      }
   }
   removeRequestPhoto(index: number) { this.requestPhotos.update(p => p.filter((_, i) => i !== index)); }
   submitVehicle() {
      if (this.vehicleForm.invalid) return;
      const v: MotoristVehicle = {
         id: this.generateUUID(),
         ownerPhone: this.currentPhone()!,
         photos: this.tempPhotos(),
         ...this.vehicleForm.value
      };
      this.dataService.addMobileVehicle(v);
      this.closeAddVehicleForm();
      this.toastService.show('Véhicule ajouté', 'success');
      this.cdr.detectChanges(); // Force UI update
   }

   // Updated submitRequest to handle standard flow without FM
   submitRequest() {
      if (!this.requestForm.get('locationCity')?.value || !this.requestForm.get('selectedVehicleId')?.value) {
         this.toastService.show('Veuillez remplir les informations obligatoires.', 'error');
         return;
      }

      const val = this.requestForm.value;
      const vehicle = this.myVehicles().find(v => v.id === val.selectedVehicleId);
      if (!vehicle) return;

      // Build description from wizard choices
      let finalDescription = val.description || '';

      const combinedHistory = [...this.wizardAnswers()];

      if (this.requestServiceType() === 'towing') combinedHistory.unshift({ question: 'Service souhaité', answer: 'Remorquage' });
      if (this.requestServiceType() === 'tech_home') combinedHistory.unshift({ question: 'Service souhaité', answer: 'Technicien à domicile' });
      if (this.requestServiceType() === 'garage_drop') combinedHistory.unshift({ question: 'Service souhaité', answer: 'Dépôt garage' });

      const urgencyStr = this.requestUrgency() === 'urgency_immediate' ? 'Urgent (immédiat)' :
         this.requestUrgency() === 'urgency_today' ? 'Aujourd’hui' : 'Flexible';
      combinedHistory.unshift({ question: 'Urgence', answer: urgencyStr });

      combinedHistory.unshift({ question: 'Véhicule roulant', answer: this.isVehicleDrivable() ? 'Oui' : 'Non' });
      combinedHistory.unshift({ question: 'Type de besoin', answer: this.requestNeedType().join(', ') || 'Autre' });

      const newReq: QuoteRequest = {
         id: this.generateUUID(),
         date: new Date().toISOString(),
         status: 'NEW',
         motoristName: this.currentUser()!,
         motoristPhone: this.currentPhone()!,
         motoristEmail: this.currentClientData()?.email || this.profileForm.value?.email || '',
         locationCity: val.locationCity,
         locationCommune: val.locationCommune,
         locationQuarter: val.locationQuarter,
         locationCoords: this.userLocation() || undefined,
         vehicleBrand: vehicle.brand,
         vehicleModel: vehicle.model,
         vehicleYear: vehicle.year,
         vehiclePlate: vehicle.plate,
         fuel: vehicle.fuel,
         vehicleVin: vehicle.vin,
         mileage: vehicle.mileage,
         gearbox: vehicle.gearbox,
         photos: this.requestPhotos().length > 0 ? this.requestPhotos() : vehicle.photos,
         description: finalDescription,
         interventionDate: val.interventionDate || undefined,
         interventionLocation: val.interventionLocation || undefined,
         preferredPeriod: val.preferredPeriod,
         interventionType: val.interventionType,

         // Pass preference fields
         preferredDate: val.preferredDate,
         preferredSlot: val.preferredSlot,

         proposedQuotes: [],
         assignedTenantIds: [],
         diagnosticHistory: combinedHistory
      };

      this.dataService.createMobileRequest(newReq);
      this.toastService.show('Demande de devis traitée !', 'success');
      this.requestWizardStep.set(9); // Show the success confirmation View
      this.cdr.detectChanges(); // Force UI update

   }

   // Helper for vehicle selection in form
   selectVehicleForRequest(v: MotoristVehicle) {
      this.requestForm.patchValue({ selectedVehicleId: v.id });
   }

   myVehicles = computed(() => { if (!this.currentPhone()) return []; return this.dataService.mobileVehicles().filter(v => v.ownerPhone === this.currentPhone()); });

   getDashIcon(key: string, color: string = 'currentColor'): SafeHtml {
      const path = this.DASHBOARD_ICONS[key] || '';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="${path}" /></svg>`;
      return this.sanitizer.bypassSecurityTrustHtml(svg);
   }

   getGarageName(id?: string) {
      if (!id) return "Partenaire ICE";
      const tenant = this.dataService.tenants().find(t => t.id === id);
      return tenant ? tenant.name : "Partenaire ICE";
   }

   // Helper to get Tenant details from a Quote ID (for displaying multiple offers)
   getTenantByQuoteId(quoteId: string) {
      const invoice = this.dataService.getPublicInvoiceById(quoteId);
      if (!invoice || !invoice.tenantId) return null;
      return this.dataService.tenants().find(t => t.id === invoice.tenantId);
   }

   getCleanDescription(desc?: string): string {
      if (!desc) return '';
      if (desc.includes('Véhicule roulant') && desc.includes(' | ')) {
         const parts = desc.split('\n');
         if (parts.length > 1) return parts.slice(1).join('\n');
         return 'Demande d\'intervention';
      }
      return desc;
   }

   hasTag(req: any, tagType: 'drivable' | 'not_drivable' | 'technician' | 'towing'): boolean {
      if (req.diagnosticHistory && req.diagnosticHistory.length > 0) {
         if (tagType === 'drivable') return req.diagnosticHistory.some((h: any) => h.question === 'Véhicule roulant' && h.answer === 'Oui');
         if (tagType === 'not_drivable') return req.diagnosticHistory.some((h: any) => h.question === 'Véhicule roulant' && h.answer === 'Non');
         if (tagType === 'technician') return req.diagnosticHistory.some((h: any) => h.question === 'Déplacement technicien' || (h.question === 'Service souhaité' && h.answer === 'Technicien à domicile'));
         if (tagType === 'towing') return req.diagnosticHistory.some((h: any) => h.question === 'Besoin de remorquage' || (h.question === 'Service souhaité' && h.answer === 'Remorquage'));
      }
      const desc = req.description || '';
      if (tagType === 'drivable') return desc.includes('Véhicule roulant: Oui');
      if (tagType === 'not_drivable') return desc.includes('Véhicule roulant: Non');
      if (tagType === 'technician') return desc.includes('Déplacement technicien demandé');
      if (tagType === 'towing') return desc.includes('Remorquage demandé');
      return false;
   }

   // Anonymize Name
   anonymizeName(name?: string): string {
      if (!name) return 'Garage Inconnu';
      return name.split(' ').map(word => {
         if (word.length <= 1) return word;
         return word[0] + '*'.repeat(word.length - 1);
      }).join(' ');
   }

   // Filtered Requests Logic (CORRECTED)
   filteredRequests = computed(() => {
      const vehicleId = this.requestsVehicleFilter();
      const status = this.requestsStatusFilter();

      // Status Group Mapping
      const statusMap: Record<string, string[]> = {
         'NEW': ['NEW', 'DISPATCHED'],
         'QUOTE_SUBMITTED': ['QUOTE_SUBMITTED', 'COMPLETED'], // Show COMPLETED here because it means user has received quotes
         'CONVERTED': ['CONVERTED']
      };

      return this.myRequests().filter(req => {
         let matchV = true;
         if (vehicleId) {
            const v = this.myVehicles().find(v => v.id === vehicleId);
            if (v) {
               // Filter by matching Brand/Model since QuoteRequest doesn't store mobile vehicle ID directly
               // Compare strings carefully
               matchV = req.vehicleBrand === v.brand && req.vehicleModel === v.model;
            } else {
               matchV = false; // Filter set but vehicle not found
            }
         }

         let matchStatus = true;
         if (status) {
            const allowed = statusMap[status] || [status];
            matchStatus = allowed.includes(req.status);
         }

         return matchV && matchStatus;
      });
   });

   translateStatus(status: string): string {
      switch (status) {
         case 'NEW': return 'Nouveau';
         case 'QUOTE_SUBMITTED': return 'Demande Envoyée';
         case 'COMPLETED': return 'Terminé';
         case 'CONVERTED': return 'Converti/Validé';
         case 'DISPATCHED': return 'Transféré';
         case 'REJECTED': return 'Refusé';
         case 'CANCELED': return 'Annulé';
         default: return status;
      }
   }

   openGarageInfo(garage: Tenant, event: Event) {
      event.stopPropagation();
      this.selectedGarageForInfo.set(garage);
   }

   closeGarageInfo() {
      this.selectedGarageForInfo.set(null);
   }
}
