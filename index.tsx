

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection, LOCALE_ID, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withHashLocation, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DataService } from './src/services/data.service';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { authInterceptor } from './src/services/auth.interceptor';

registerLocaleData(localeFr);
import { LoginComponent } from './src/components/login/login.component';
import { DashboardComponent } from './src/components/dashboard/dashboard.component';
import { ClientsComponent } from './src/components/clients/clients.component';
import { RepairsComponent } from './src/components/repairs/repairs.component';
import { InventoryComponent } from './src/components/inventory/inventory.component';
import { PlanningComponent } from './src/components/planning/planning.component';
import { SettingsComponent } from './src/components/settings/settings.component';
import { SuperAdminComponent } from './src/components/super-admin/super-admin.component';
import { DocumentsComponent } from './src/components/documents/documents.component';
import { OpportunitiesComponent } from './src/components/opportunities/opportunities.component';
import { HrComponent } from './src/components/hr/hr.component';
import { MobileAppComponent } from './src/components/mobile-app/mobile-app.component';
import { WorkshopComponent } from './src/components/workshop/workshop.component';
import { LandingComponent } from './src/components/landing/landing.component';


import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

const authGuard: CanActivateFn = () => {
  const dataService = inject(DataService);
  const router = inject(Router);
  
  if (dataService.currentUser()?.id) {
    return true; // Authenticated
  }
  
  return router.parseUrl('/login');
};

const routes: Routes = [
  // Redirection par défaut vers le Tableau de Bord
  // Landing Page at Root
  { path: '', component: LandingComponent },


  { path: 'login', component: LoginComponent },

  // POS Workshop Mode Kiosk
  { path: 'workshop/:tenantId', component: WorkshopComponent },

  // Public Motorist Mobile App
  { path: 'mobile', component: MobileAppComponent },

  // Garage Routes
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'opportunities', component: OpportunitiesComponent, canActivate: [authGuard] },
  { path: 'hr', component: HrComponent, canActivate: [authGuard] }, // New HR Route
  { path: 'clients', component: ClientsComponent, canActivate: [authGuard] },
  { path: 'repairs', component: RepairsComponent, canActivate: [authGuard] },
  { path: 'inventory', component: InventoryComponent, canActivate: [authGuard] },
  { path: 'planning', component: PlanningComponent, canActivate: [authGuard] },
  { path: 'documents', component: DocumentsComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },

  // Super Admin Routes (Pattern: /super-admin/:tabId)
  { path: 'super-admin', redirectTo: 'super-admin/dashboard', pathMatch: 'full' },
  { path: 'super-admin/:tabId', component: SuperAdminComponent, canActivate: [authGuard] },
];

export function initializeApp(dataService: DataService) {
  return () => dataService.initAuth();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    { provide: LOCALE_ID, useValue: 'fr' },
    {
       provide: APP_INITIALIZER,
       useFactory: initializeApp,
       deps: [DataService],
       multi: true
    }
  ]
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
