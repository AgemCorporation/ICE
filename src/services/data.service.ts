import { Injectable, signal, computed, effect, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from './toast.service';
import { WebSocketService } from './websocket.service';

// CONSTANTES GEOGRAPHIQUES
export const IVORY_COAST_LOCATIONS: { [city: string]: string[] } = {
   'Abidjan': ['Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 'Songon', 'Treichville', 'Yopougon', 'Bingerville', 'Anyama'],
   'Bouaké': ['Bouaké-Ville', 'Air France', 'Kennedy', 'Broukro', 'Gonfreville'],
   'Yamoussoukro': ['Yamoussoukro', 'Attiégouakro'],
   'San-Pédro': ['San-Pédro', 'Bardot', 'Lac', 'Zone Industrielle'],
   'Korhogo': ['Korhogo', 'Petit Paris', 'Soba'],
   'Daloa': ['Daloa', 'Lobia', 'Tazibouo'],
   'Man': ['Man', 'Koko', 'Grand-Gbapleu'],
   'Gagnoa': ['Gagnoa', 'Garahio', 'Soleil'],
   'Autre': ['Autre Commune']
};

export const CITIES = Object.keys(IVORY_COAST_LOCATIONS).sort();

export interface GlobalAnnouncement {
   id: string;
   message: string;
   date: string;
}

export interface QRScanLog {
   id: string;
   timestamp: string;
   scannedUserPhone: string;
   scannedUserName: string;
   scannerTenantId: string;
   scannerName: string;
}

export interface ModificationLog {
   date: string;
   action: string;
   user: string;
}

export type RepairStatus = 'En attente' | 'Diagnostic' | 'Devis' | 'En cours' | 'Terminé' | 'Clôturé';
export type FulfillmentStatus = 'PENDING' | 'REQUESTED' | 'DELIVERED';

export interface PriceHistoryEntry {
   date: string;
   buyPrice: number;
   sellPrice: number;
   user: string;
}

export interface EmployeeDocument {
   id: string;
   name: string;
   type: 'CV' | 'CONTRAT' | 'PAIE' | 'AUTRE';
   date: string;
   url: string; // Base64 for demo
}

export interface AppUser {
   id: string;
   firstName: string;
   lastName: string;
   email?: string;
   role?: string;
   active: boolean;
   tenantId?: string; // NEW: Associate staff with a garage
   pinCode?: string; // NEW: 4 digit code for workshop access
   password?: string; // NEW: Password for standard login
   superAdminPerms?: string[];
   createdBy?: string;

   // HR specific fields
   phone?: string;
   jobTitle?: string;
   hourlyCost?: number;
   hiredDate?: string;

   // Extended HR
   address?: string;
   emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
   };
   contractType?: 'CDI' | 'CDD' | 'Stage' | 'Apprentissage' | 'Prestation';
   contractEndDate?: string; // For CDD/Stage
   documents?: EmployeeDocument[];
}

export interface Role {
   id: string;
   name: string;
   isSystem: boolean;
   permissions: string[];
}

export interface Client {
   id: string;
   firstName: string;
   lastName: string;
   email: string;
   phone: string;
   mobile?: string;
   type: 'Particulier' | 'Entreprise';
   companyName?: string;
   rccm?: string;
   vatNumber?: string;
   fleetSize?: number;
   vehicleIds: string[];
   address: {
      street: string;
      city: string;
      commune?: string; // NEW
      zip: string;
   };
   financial: {
      paymentMethod: string;
      paymentTerms: string;
      discountPercent: number;
      balance: number;
   };
   notes?: string;
   history: ModificationLog[];
   tenantId?: string;
   avatarUrl?: string; // NEW: Profile photo URL
}

// Internal Garage Vehicle
export interface Vehicle {
   id: string;
   plate: string;
   brand: string;
   model: string;
   trim?: string;
   engine?: string;
   fuel: string;
   gearbox: string;
   ownerId: string;
   vin: string;
   firstRegistrationDate: string;
   fiscalPower: number;
   mileage: number;
   tireSizeFront?: string;
   tireSizeRear?: string;
   oilType?: string;
   lastTechnicalControl?: string;
   history: ModificationLog[];
   tenantId?: string;
}

// Mobile User Vehicle (Simpler structure for Applet)
export interface MotoristVehicle {
   id: string;
   ownerPhone: string; // Key to link to mobile user
   plate: string;
   brand: string;
   model: string;
   year: number;
   vin: string;
   mileage: number;
   fuel: string;
   gearbox?: string;
   photos: string[]; // Base64
   color?: string;
   insuranceProvider?: string;
   lastRevisionDate?: string;
}

export interface Part {
   id: string;
   reference: string;
   oem?: string; // NEW: OEM Reference
   name: string;
   brand: string;
   category: string;
   image?: string; // NEW: Image URL or Base64
   buyPrice: number;
   sellPrice: number;
   vatRate: number;
   marginPercent: number;
   stock: number;
   minStock: number;
   reorderQty: number;
   location: string;
   warehouseId: string;
   supplierId: string;
   priceHistory: PriceHistoryEntry[];
   tenantId?: string;
}

export interface Warehouse {
   id: string;
   name: string;
   address?: string;
   tenantId?: string;
}

export interface Supplier {
   id: string;
   name: string;
   contactName?: string;
   email?: string;
   phone?: string;
   deliveryDelayDays: number;
   address?: string;
   isArchived: boolean;
   tenantId?: string;
}

export interface StockMovement {
   id: string;
   partId: string;
   date: string;
   type: 'IN_PURCHASE' | 'OUT_REPAIR' | 'OUT_COUNTER_SALE' | 'ADJUSTMENT';
   quantity: number;
   reason: string;
   userId: string;
   recipient?: string;
   tenantId?: string;
}

export interface LabourRate {
   id: string;
   code: string;
   name: string;
   hourlyRate: number;
   tenantId?: string;
}

export interface ServicePackage {
   id: string;
   name: string;
   description: string;
   price: number;
   partIds?: string[];
   tenantId?: string;
}

export interface CallCenterTicket {
   id: string;
   date: string;
   type: string;
   subject: string;
   notes: string;
   status: string;
   durationSecs: number;
   quoteRequestId?: string;
   quoteRequest?: any;
   clientId?: string;
   client?: any;
   createdBy: string;
   assignedTo?: string;
   actions?: { id: string; text: string; completed: boolean }[];
}

export interface RepairItem {
   type: 'part' | 'labor';
   partId?: string;
   description: string;
   quantity: number;
   unitPrice: number;
   fulfillmentStatus?: FulfillmentStatus;
}

export interface RepairCheckIn {
   checklist: {
      securityNut: boolean;
      spareWheel: boolean;
      safetyVest: boolean;
      radioFaceplate: boolean;
      serviceBook: boolean;
   };
   fuelLevel: number;
   photos: string[];
   additionalInfo?: string;
}

export interface RepairHistoryEntry {
   date: string;
   description: string;
   user?: string;
}

export interface DownPayment {
   id: string;
   date: string;
   amount: number;
   method: string;
}

export interface TimeLog {
   id: string;
   userId: string;
   type: 'WORK' | 'PAUSE'; // WORK or PAUSE
   startTime: string;
   endTime?: string;
   durationMinutes?: number; // Calculated when stopped
   pauseReason?: string; // Reason for PAUSE type
}

export interface RepairOrder {
   id: string;
   vehicleId: string;
   clientId: string;
   status: RepairStatus;
   entryDate: string;
   description: string;
   mechanic?: string;
   items: RepairItem[];
   checkIn?: RepairCheckIn;
   history: RepairHistoryEntry[];
   downPayments: DownPayment[];
   isLocked?: boolean;
   timeLogs: TimeLog[]; // New field for time tracking

   // NEW FINANCIAL FIELDS
   vatRate?: number; // Default 18
   discountValue?: number; // Amount or Percent
   discountType?: 'PERCENT' | 'FIXED';
   financialNotes?: string;
   tenantId?: string;
}

export interface InvoiceItem {
   description: string;
   quantity: number;
   unitPrice: number;
   totalHT: number;
   partId?: string;
}

export interface Invoice {
   id: string;
   number: string;
   type: 'DEVIS' | 'FACTURE' | 'AVOIR';
   status: 'BROUILLON' | 'ENVOYE' | 'VALIDE' | 'PAYE' | 'PARTIEL' | 'ANNULE' | 'REFUSE' | 'EN_REVISION' | 'ACCEPTE' | 'NON_VALIDE';
   date: string;
   dueDate: string;
   repairId?: string;
   clientId: string;
   clientName: string;
   vehicleId?: string;
   vehicleDescription?: string;
   totalHT: number;
   totalVAT: number;
   totalTTC: number;
   paidAmount: number;
   remainingAmount: number;
   items: InvoiceItem[];
   tenantId?: string; // Link to tenant for filtering
   restitutionDate?: string; // NEW: Date de restitution prévue
}

export interface GarageSettings {
   name: string;
   description?: string; // Public description for Mobile App
   address: string;
   zip: string;
   city: string;
   commune?: string; // NEW
   lat?: number;
   lng?: number;
   phone: string;
   email: string;
   rccm: string;
   vatNumber: string;
   defaultVatRate: number; // NEW: Global VAT Rate
   currency: string;
   invoiceFooter: string;
   docTemplate: 'classic' | 'modern' | 'minimal';
   docColor: string;
   quoteValidity: number;
   termsAndConditions: string;
   useBackgroundImage: boolean;
   logoUrl?: string;
   backgroundImageUrl?: string;
}

export const DEFAULT_SETTINGS: GarageSettings = {
   name: '',
   description: '',
   address: '', zip: '', city: '', commune: '', phone: '', email: '',
   rccm: '', vatNumber: '', defaultVatRate: 18, currency: 'XOF',
   invoiceFooter: 'Toute réclamation doit être faite sous 48h.',
   docTemplate: 'modern', docColor: '#2563eb', quoteValidity: 30,
   termsAndConditions: '', useBackgroundImage: false
};

export interface Tenant {
   id: string;
   name: string;
   description?: string; // Public description
   domain?: string;
   adminEmail: string;
   password?: string;
   contactName?: string;
   phone?: string;
   address?: string;
   city?: string;
   commune?: string; // NEW
   zip?: string;
   country?: string;
   vatNumber?: string;
   plan: 'ICE Light' | 'ICE Full';
   status: 'Active' | 'Suspended' | 'Cancelled';
   userCount: number;
   maxUsers: number;
   storageUsed: number;
   storageLimit: number;
   createdAt: string;
   expiresAt: string;
   mrr: number;
   lat?: number;
   lng?: number;
   settings?: Partial<GarageSettings>; // NEW: Store tenant-specific customizable settings
   lockedGps?: boolean; // NEW: Lock GPS position
   features: string[];
   rating?: number; // 1-5 stars
   reviewCount?: number;
}

export interface PlatformLead {
   id: string;
   garageName: string;
   contactName: string;
   email?: string;
   phone: string;
   city?: string;
   vehiclesPerDay?: string;
   equipment?: string;
   planInterest: 'ICE Light' | 'ICE Full';
   status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
   date: string;
   notes?: string;
}

export interface QuoteMessage {
   id: string;
   date: string;
   senderId: string; // The user ID or 'SUPERADMIN'
   senderName: string; // e.g. 'Jean Garage' or 'SuperAdmin'
   tenantId?: string; // NEW: The garage this message is associated with (for isolation)
   message: string;
}

export interface QuoteRequest {
   id: string;
   date: string;
   status: 'NEW' | 'DISPATCHED' | 'QUOTE_SUBMITTED' | 'COMPLETED' | 'REJECTED' | 'CONVERTED' | 'CANCELED';
   motoristName: string;
   motoristPhone: string;
   motoristEmail?: string;
   locationCity: string;
   locationCommune?: string; // NEW
   locationQuarter?: string; // NEW
   locationCoords?: { lat: number, lng: number }; // For geofencing
   interventionDate?: string; // NEW: Desired intervention date
   interventionLocation?: 'GARAGE' | 'TOWING' | 'WORK' | 'HOME' | 'OTHER'; // NEW: Location preference
   vehicleBrand: string;
   vehicleModel: string;
   vehicleYear: number;
   vehiclePlate?: string; // NEW: Track the vehicle's license plate directly from the quote request
   vehicleVin?: string;
   fuel?: string;
   mileage?: number;
   gearbox?: string;
   description: string;
   adminDescription?: string; // Optional official description provided by Superadmin
   photos: string[];
   assignedTenantIds?: string[];
   assignedDate?: string;
   garageQuoteId?: string; // Legacy single quote
   proposedQuotes?: string[]; // Array of Invoice IDs (Devis) sent to client
   acceptedQuoteId?: string; // The one the client chose
   repairOrderId?: string; // Link to actual repair in garage
   repairStatus?: string; // Denormalized status ('En attente', 'En cours', 'Clôturé') for mobile app persistence
   rejectionReason?: string; // Reason if rejected by SuperAdmin
   clientRating?: number; // 1-5
   clientReview?: string;

   // NEW FIELDS FOR PREFERENCES
   preferredPeriod?: string; // Urgent, ThisWeek, NextWeek, Month
   preferredDate?: string; // ISO Date for appointment request
   preferredSlot?: string; // MATIN / APRES_MIDI
   interventionType?: string; // Garage, Home, Work, Towing

   diagnosticHistory?: { question: string; answer: string }[];
   messages?: QuoteMessage[]; // Chat history between Garage and SuperAdmin
   isUnlockedForModification?: boolean; // (Legacy/Global - kept for safety if used elsewhere)
   unlockedTenantIds?: string[]; // NEW: Garages allowed to re-edit
   hasUnreadMessagesForGarage?: boolean; // (Legacy/Global)
   unreadMessageTenantIds?: string[]; // NEW: Garages with unread messages
   hasUnreadMessagesForAdmin?: boolean; // NEW: Flag for new messages for SuperAdmin
   isDirectRequest?: boolean; // NEW: Flag for requests created directly via QR Scan
   directTenantId?: string; // NEW: ID of the garage that scanned the user

   // UI Helpers
   localStatus?: string;
   myQuoteId?: string;
}

export interface SystemLog {
   id: string;
   date: string;
   level: 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY';
   message: string;
   tenantId?: string;
   user?: string;
}

export interface PlatformConfig {
   stripePublicKey: string;
   googleMapsApiKey: string;
   sendGridApiKey: string;
   maintenanceMode: boolean;
   appName?: string;
   logoUrl?: string;
   superAdminName?: string;
   superAdminLogoUrl?: string;
}

export const ALL_PERMISSIONS = [
   // ... (Permissions Array unchanged) ...
   // 1. Accès Modules (Navigation)
   { id: 'access_dashboard', label: 'Module: Tableau de bord', category: 'Accès Modules' },
   { id: 'access_opportunities', label: 'Module: Opportunités (Apport Affaires)', category: 'Accès Modules' },
   { id: 'access_clients', label: 'Module: Clients & Véhicules', category: 'Accès Modules' },
   { id: 'access_repairs', label: 'Module: Atelier (OR)', category: 'Accès Modules' },
   { id: 'access_documents', label: 'Module: Documents (Facturation)', category: 'Accès Modules' },
   { id: 'access_inventory', label: 'Module: Stock & Services', category: 'Accès Modules' },
   { id: 'access_planning', label: 'Module: Planning', category: 'Accès Modules' },
   { id: 'access_settings', label: 'Module: Paramètres', category: 'Accès Modules' },
   { id: 'access_hr', label: 'Module: RH & Employés', category: 'Accès Modules' },

   // 1.1 Tableau de Bord (Widgets)
   { id: 'view_dashboard_revenue', label: 'Voir CA & Finance', category: 'Tableau de Bord (Widgets)' },
   { id: 'view_dashboard_repairs_stats', label: 'Voir Stats Atelier (En cours)', category: 'Tableau de Bord (Widgets)' },
   { id: 'view_dashboard_stock_alerts', label: 'Voir Alertes Stock', category: 'Tableau de Bord (Widgets)' },
   { id: 'view_dashboard_client_stats', label: 'Voir Stats Clients', category: 'Tableau de Bord (Widgets)' },
   { id: 'view_dashboard_planning', label: 'Voir RDV du Jour (Accueil)', category: 'Tableau de Bord (Widgets)' },
   { id: 'view_dashboard_billing', label: 'Voir Dossiers À Facturer', category: 'Tableau de Bord (Widgets)' },
   { id: 'view_dashboard_leads', label: 'Voir Demandes de Devis (Pro Devis)', category: 'Tableau de Bord (Widgets)' },

   // 2. Atelier & Planning
   { id: 'view_my_assigned_tasks', label: 'Voir Mes Tâches (Mécanicien)', category: 'Atelier & Planning' },
   { id: 'manage_planning', label: 'Modifier le planning (Assignation)', category: 'Atelier & Planning' },
   { id: 'create_appointment', label: 'Prendre Rendez-vous', category: 'Atelier & Planning' },
   { id: 'manage_part_requests', label: 'Valider demandes pièces (Magasinier)', category: 'Atelier & Planning' },

   // 3. Stock & Logistique
   { id: 'view_parts_stock', label: 'Consulter le stock', category: 'Stock & Logistique' },
   { id: 'view_stock_movements', label: 'Voir journal mouvements', category: 'Stock & Logistique' },
   { id: 'manage_parts_data', label: 'Créer/Modifier fiches articles', category: 'Stock & Logistique' },
   { id: 'manage_stock_levels', label: 'Faire entrées/sorties manuelles', category: 'Stock & Logistique' },
   { id: 'create_counter_sale', label: 'Faire Vente Comptoir', category: 'Stock & Logistique' },
   { id: 'manage_warehouses', label: 'Gérer Entrepôts', category: 'Stock & Logistique' },
   { id: 'manage_suppliers', label: 'Gérer Fournisseurs', category: 'Stock & Logistique' },
   { id: 'view_warehouses', label: 'Voir Entrepôts', category: 'Stock & Logistique' },
   { id: 'view_suppliers', label: 'Voir Fournisseurs', category: 'Stock & Logistique' },

   // 4. Catalogue Services
   { id: 'view_services_catalog', label: 'Voir Forfaits & MO', category: 'Catalogue Services' },
   { id: 'manage_services_catalog', label: 'Créer/Modifier Forfaits & MO', category: 'Catalogue Services' },

   // 5. Commerce & Relation Client
   { id: 'manage_opportunities', label: 'Traiter les leads (Devis/Refus)', category: 'Commerce & Relation Client' },
   { id: 'convert_opportunities', label: 'Convertir en Ordre de Réparation', category: 'Commerce & Relation Client' },

   // 6. Finance & Administration
   { id: 'view_financials', label: 'Voir Prix Achat / Marges / CA', category: 'Finance & Admin' },
   { id: 'can_invoice', label: 'Créer Devis & Factures', category: 'Finance & Admin' },
   { id: 'import_export_data', label: 'Import/Export Données', category: 'Finance & Admin' },
   { id: 'manage_settings', label: 'Configuration Entreprise', category: 'Finance & Admin' },
];

export const PLAN_DEFAULTS: { [key: string]: string[] } = {
   'ICE Light': [
      'access_dashboard', 'access_clients', 'access_repairs', 'access_documents', 'access_settings',
      'view_dashboard_repairs_stats', 'view_dashboard_planning',
      'can_invoice', 'create_appointment', 'view_my_assigned_tasks'
   ],
   'ICE Full': ALL_PERMISSIONS.map(p => p.id) // All permissions
};

@Injectable({
   providedIn: 'root'
})
export class DataService {

   generateUUID(): string {
      return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
         const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
         return v.toString(16);
      });
   }

   // ... (Initial Roles unchanged) ...
   private initialRoles: Role[] = [
      {
         id: 'r_admin',
         name: 'Admin',
         isSystem: true,
         permissions: ALL_PERMISSIONS.map(p => p.id)
      },
      {
         id: 'r_manager',
         name: 'Manager',
         isSystem: false,
         permissions: [
            'access_dashboard', 'access_opportunities', 'access_clients', 'access_repairs', 'access_documents', 'access_inventory', 'access_planning', 'access_hr',
            'view_dashboard_revenue', 'view_dashboard_repairs_stats', 'view_dashboard_stock_alerts', 'view_dashboard_client_stats',
            'view_dashboard_planning', 'view_dashboard_billing', 'view_dashboard_leads',
            'view_financials', 'can_invoice',
            'view_parts_stock', 'manage_parts_data', 'manage_stock_levels', 'create_counter_sale', 'manage_part_requests', 'import_export_data',
            'view_services_catalog', 'manage_services_catalog', 'view_warehouses', 'manage_warehouses', 'view_suppliers', 'manage_suppliers', 'view_stock_movements',
            'manage_planning', 'create_appointment',
            'manage_opportunities', 'convert_opportunities',
            'access_settings', 'manage_settings'
         ]
      },
      {
         id: 'r_secretary',
         name: 'Secretaire',
         isSystem: false,
         permissions: [
            'access_dashboard', 'access_opportunities', 'access_clients', 'access_repairs', 'access_documents', 'access_inventory', 'access_planning', 'access_hr',
            'view_dashboard_revenue', 'view_dashboard_client_stats', 'view_dashboard_planning', 'view_dashboard_billing',
            'view_financials', 'can_invoice', 'create_appointment',
            'view_parts_stock', 'view_services_catalog', 'view_stock_movements',
            'manage_opportunities'
         ]
      },
      {
         id: 'r_mechanic',
         name: 'Mecanicien',
         isSystem: false,
         permissions: [
            'access_dashboard', 'access_planning',
            'view_parts_stock', 'manage_part_requests',
            'view_my_assigned_tasks'
         ]
      }
   ];

   // ... (Initial Data Arrays updated for Cities) ...
   private initialClients: Client[] = [];
   private initialVehicles: Vehicle[] = [];
   private initialParts: Part[] = [];
   private initialSuppliers: Supplier[] = [];
   private initialWarehouses: Warehouse[] = [];
   private initialLabourRates: LabourRate[] = [];
   private initialPackages: ServicePackage[] = [];
   private initialMovements: StockMovement[] = [];

   // SIMULATION: Invoices for the multiple quote scenario
   private initialInvoices: Invoice[] = [];
   private initialTenants: Tenant[] = [];
   private initialLeads: PlatformLead[] = [];
   private initialLogs: SystemLog[] = [];
   private initialQuoteRequests: QuoteRequest[] = [];
   private initialMobileVehicles: MotoristVehicle[] = [];
   private initialRepairs: RepairOrder[] = [];
   private initialStaff: AppUser[] = [];

   // --- ADMIN / AUDIT DATA ---
   private _admins = signal<AppUser[]>([]);
   private _auditLogs = signal<any[]>([]);
   private _callCenterTickets = signal<CallCenterTicket[]>([]);



   // --- SIGNALS ---

   // Auth & Session
   currentUser = signal<AppUser | null>(null); // Loaded by APP_INITIALIZER instead

   // Data (Internal Raw Signals) — Initialized empty, populated by loadApiData()
   private _roles = signal<Role[]>(this.loadFromStorage('roles', this.initialRoles)); // Keep localStorage for system default roles
   private _clients = signal<Client[]>([]);
   private _vehicles = signal<Vehicle[]>([]);
   private _parts = signal<Part[]>([]);
   private _suppliers = signal<Supplier[]>([]);
   private _warehouses = signal<Warehouse[]>([]);
   private _labourRates = signal<LabourRate[]>([]);
   private _packages = signal<ServicePackage[]>([]);
   private _repairs = signal<RepairOrder[]>([]);
   private _movements = signal<StockMovement[]>([]);
   private _invoices = signal<Invoice[]>([]);
   qrScans = signal<QRScanLog[]>([]);

   // Public filtered getters
   roles = computed(() => this._roles()); // roles are usually global or system-wide, keeping simple for now
   clients = computed(() => { const tid = this.currentTenantId(); return this._clients().filter(c => tid === null || c.tenantId === tid); });
   vehicles = computed(() => { const tid = this.currentTenantId(); return this._vehicles().filter(v => tid === null || v.tenantId === tid); });
   parts = computed(() => { const tid = this.currentTenantId(); return this._parts().filter(p => tid === null || p.tenantId === tid); });
   suppliers = computed(() => { const tid = this.currentTenantId(); return this._suppliers().filter(s => tid === null || s.tenantId === tid); });
   warehouses = computed(() => { const tid = this.currentTenantId(); return this._warehouses().filter(w => tid === null || w.tenantId === tid); });
   labourRates = computed(() => { const tid = this.currentTenantId(); return this._labourRates().filter(lr => tid === null || lr.tenantId === tid); });
   packages = computed(() => { const tid = this.currentTenantId(); return this._packages().filter(p => tid === null || p.tenantId === tid); });
   repairs = computed(() => { const tid = this.currentTenantId(); return this._repairs().filter(r => tid === null || r.tenantId === tid); });
   movements = computed(() => { const tid = this.currentTenantId(); return this._movements().filter(m => tid === null || m.tenantId === tid); });
   invoices = computed(() => { const tid = this.currentTenantId(); return this._invoices().filter(i => tid === null || i.tenantId === tid); });

   // Dynamic Garage Context
   currentTenantId = computed(() => {
      const user = this.currentUser();
      if (!user) return null;
      if (user.role === 'SuperAdmin' || user.role === 'Root') return null; // SuperAdmin spans across tenant context usually
      return user.tenantId || null; // No unsafe fallback — null means no tenant context
   });

   currentSettings = computed<GarageSettings>(() => {
      const tId = this.currentTenantId();
      const tenant = this.tenants().find(t => t.id === tId);
      if (!tenant) return DEFAULT_SETTINGS;

      return {
         ...DEFAULT_SETTINGS,
         name: tenant.name,
         description: tenant.description || '',
         address: tenant.address || '',
         city: tenant.city || '',
         commune: tenant.commune || '',
         zip: tenant.zip || '',
         lat: tenant.lat,
         lng: tenant.lng,
         phone: tenant.phone || '',
         email: tenant.adminEmail || '',
         ...tenant.settings
      };
   });

   staff = signal<AppUser[]>([]);
   tenants = signal<Tenant[]>([]);
   leads = signal<PlatformLead[]>([]);
   systemLogs = signal<SystemLog[]>([]);
   quoteRequests = signal<QuoteRequest[]>([]);
   globalAnnouncement = signal<GlobalAnnouncement | null>(this.loadAnnouncementFromStorage());
   mobileVehicles = signal<MotoristVehicle[]>([]);
   private zone = inject(NgZone);

   private loadAnnouncementFromStorage(): GlobalAnnouncement | null {
      try {
         const stored = localStorage.getItem('globalAnnouncement');
         if (stored) {
            return JSON.parse(stored);
         }
      } catch (e) {
         console.warn('Could not parse stored globalAnnouncement.', e);
      }
      return null;
   }

   setGlobalAnnouncement(message: string) {
      if (!message.trim()) return;
      const ann: GlobalAnnouncement = {
         id: Math.random().toString(36).substring(2, 9),
         message: message,
         date: new Date().toISOString()
      };
      this.globalAnnouncement.set(ann);
      this.http.put(`${this.apiUrl}/platform-config/announcement`, ann).subscribe({ error: (err) => console.error('Save announcement error', err) });
   }

   dismissGlobalAnnouncement() {
      this.globalAnnouncement.set(null);
      this.http.delete(`${this.apiUrl}/platform-config/announcement`).subscribe({ error: (err) => console.error('Dismiss announcement error', err) });
   }

   private getStorageData(key: string) {
      const VERSION = '3.3'; // Bump to ensure all stores are initialized correctly
      if (localStorage.getItem('app_data_version_3_3') !== VERSION) {
         const keysToClear = ['quoteRequests', 'invoices', 'qrScans', 'repairs', 'tenants', 'roles', 'clients', 'vehicles', 'parts', 'suppliers', 'warehouses', 'labourRates', 'packages', 'movements', 'staff', 'leads', 'systemLogs', 'mobileVehicles'];
         keysToClear.forEach(k => localStorage.removeItem(k));
         localStorage.setItem('app_data_version_3_3', VERSION);
      }
      return localStorage.getItem(key);
   }

   private loadFromStorage<T>(key: string, initialData: T): T {
      try {
         const stored = this.getStorageData(key);
         if (stored) {
            return JSON.parse(stored) as T;
         }
      } catch (e) {
         console.warn(`Could not parse stored ${key}. Reverting to initial data.`, e);
      }
      return initialData;
   }

   private http = inject(HttpClient);
   private toastService = inject(ToastService);
   private webSocketService = inject(WebSocketService);
   readonly apiUrl = 'https://ice-m7jm.onrender.com/api';

   constructor() {
      // Load public data (tenants) immediately so garages are visible without auth
      this.loadPublicData();

      // Listen for Real-Time Sync Events via WebSockets
      this.webSocketService.connect(this.apiUrl);
      this.webSocketService.on('dataSynced', (event) => {
         console.log('🔄 Real-time update received:', event);
         // Auto-refresh API data when another client makes changes to the backend
         if (localStorage.getItem('auth_token')) {
            this.loadApiData();
         }
      });

      // Auto-migrate cached 'Manager' role to include Settings access for existing garages
      this._roles.update(roles => {
         return roles.map(r => {
            if (r.id === 'r_manager') {
               const missingPerms = [];
               if (!r.permissions.includes('access_settings')) missingPerms.push('access_settings');
               if (!r.permissions.includes('manage_settings')) missingPerms.push('manage_settings');
               
               if (missingPerms.length > 0) {
                  return { ...r, permissions: [...r.permissions, ...missingPerms] };
               }
            }
            return r;
         });
      });

      const signalsToSync = [
         { key: 'roles', sig: this._roles },
         { key: 'clients', sig: this._clients },
         { key: 'vehicles', sig: this._vehicles },
         { key: 'parts', sig: this._parts },
         { key: 'suppliers', sig: this._suppliers },
         { key: 'warehouses', sig: this._warehouses },
         { key: 'labourRates', sig: this._labourRates },
         { key: 'packages', sig: this._packages },
         { key: 'repairs', sig: this._repairs },
         { key: 'movements', sig: this._movements },
         { key: 'invoices', sig: this._invoices },
         { key: 'qrScans', sig: this.qrScans },
         { key: 'staff', sig: this.staff },
         { key: 'tenants', sig: this.tenants },
         { key: 'leads', sig: this.leads },
         { key: 'systemLogs', sig: this.systemLogs },
         { key: 'quoteRequests', sig: this.quoteRequests },
         { key: 'mobileVehicles', sig: this.mobileVehicles },
         { key: 'currentUser', sig: this.currentUser },
         { key: 'platformConfig', sig: this.platformConfig }
      ];

      // Keys that contain large base64 photo data — strip before writing to localStorage
      const photoHeavyKeys = ['quoteRequests', 'mobileVehicles'];

      // Synchronize signals to LocalStorage
      signalsToSync.forEach(({ key, sig }) => {
         effect(() => {
            const data = (sig as any)();
            if (photoHeavyKeys.includes(key) && Array.isArray(data)) {
               // Strip base64 photos to avoid localStorage quota saturation (~5-10MB limit)
               const lite = data.map((item: any) => ({ ...item, photos: [] }));
               localStorage.setItem(key, JSON.stringify(lite));
            } else {
               localStorage.setItem(key, JSON.stringify(data));
            }
         });
      });

      // Synchronize announcement to LocalStorage
      effect(() => {
         const ann = this.globalAnnouncement();
         if (ann) {
            localStorage.setItem('globalAnnouncement', JSON.stringify(ann));
         } else {
            localStorage.removeItem('globalAnnouncement');
         }
      });

      // Listen for changes made by other tabs/windows in real-time
      window.addEventListener('storage', (event) => {
         const syncItem = signalsToSync.find(s => s.key === event.key);
         if (syncItem && event.newValue) {
            try {
               const parsedData = JSON.parse(event.newValue);
               this.zone.run(() => {
                  (syncItem.sig as any).set(parsedData);
               });
            } catch (e) {
               console.error(`Error parsing remote storage update for ${event.key}`, e);
            }
         }

         if (event.key === 'globalAnnouncement') {
            try {
               const parsedAnn = event.newValue ? JSON.parse(event.newValue) : null;
               this.zone.run(() => {
                  this.globalAnnouncement.set(parsedAnn);
               });
            } catch (e) {
               console.error('Error parsing remote storage update for announcement', e);
            }
         }
      });
   }

   loadApiData() {
      // Public data (tenants) is already loaded by constructor's loadPublicData().
      // Only load protected data if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Check if this is a mobile user session
      const isMobileUser = !!localStorage.getItem('mobileUserPhone');

      // Fetch Invoices
      this.http.get<Invoice[]>(`${this.apiUrl}/invoice`).subscribe({
         next: (data) => {
            if (data) this._invoices.set(data);
         },
         error: (err) => console.error('Erreur lors du chargement des factures API', err)
      });
      // Fetch Clients
      this.http.get<Client[]>(`${this.apiUrl}/client`).subscribe({
         next: (data) => { if (data) this._clients.set(data); },
         error: (err) => console.error('Erreur lors du chargement des clients API', err)
      });
      
      if (!isMobileUser) {
         // Fetch Vehicles (Internal Garage Only)
         this.http.get<Vehicle[]>(`${this.apiUrl}/vehicle`).subscribe({
            next: (data) => { if (data) this._vehicles.set(data); },
            error: (err) => console.error('Erreur lors du chargement des véhicules API', err)
         });
      }
      // Fetch Tenants (also in loadPublicData, but refresh here for authenticated users)
      this.http.get<Tenant[]>(`${this.apiUrl}/tenant`).subscribe({
         next: (data) => {
            if (data) this.tenants.set(data);
         },
         error: (err) => console.error('Erreur lors du chargement des tenants API', err)
      });
      // Fetch Staff
      this.http.get<AppUser[]>(`${this.apiUrl}/user`).subscribe({
         next: (data) => {
            if (data) {
               this.staff.set(data);
               // Sync current user session dynamically
               const currentSession = this.currentUser();
               if (currentSession) {
                  const freshProfile = data.find(u => u.id === currentSession.id);
                  if (freshProfile) {
                     this.currentUser.set(freshProfile);
                     const safeUser = { id: freshProfile.id, role: freshProfile.role, email: freshProfile.email, firstName: freshProfile.firstName, lastName: freshProfile.lastName };
                     localStorage.setItem('currentUser', JSON.stringify(safeUser));
                  }
               }
            }
         },
         error: (err) => console.error('Erreur lors du chargement des users API', err)
      });
      // Fetch QuoteRequests
      this.http.get<QuoteRequest[]>(`${this.apiUrl}/quote-request`).subscribe({
         next: (data) => {
            if (data) this.quoteRequests.set(data);
         },
         error: (err) => console.error('Erreur lors du chargement des quote-requests API', err)
      });

      // Fetch Mobile Vehicles
      this.http.get<MotoristVehicle[]>(`${this.apiUrl}/motorist-vehicle`).subscribe({
         next: (data) => {
            if (data) this.mobileVehicles.set(data);
         },
         error: (err) => console.error('Erreur API MotoristVehicle', err)
      });
      if (!isMobileUser) {
         // Fetch SystemLogs
         this.http.get<SystemLog[]>(`${this.apiUrl}/system-log`).subscribe({
            next: (data) => {
               if (data) this.systemLogs.set(data);
            },
            error: (err) => console.error('Erreur API SystemLog', err)
         });
         
         // Fetch QRScans
         this.http.get<QRScanLog[]>(`${this.apiUrl}/qrscanlog`).subscribe({
            next: (data) => {
               if (data) this.qrScans.set(data);
            },
            error: (err) => console.error('Erreur API QRScanLog', err)
         });
         // Fetch Repairs
         this.http.get<RepairOrder[]>(`${this.apiUrl}/repair`).subscribe({
            next: (data) => { if (data) this._repairs.set(data); },
            error: (err) => console.error('Erreur API Repair', err)
         });
         // Fetch Parts
         this.http.get<Part[]>(`${this.apiUrl}/part`).subscribe({
            next: (data) => { if (data) this._parts.set(data); },
            error: (err) => console.error('Erreur API Part', err)
         });
         // Fetch Suppliers
         this.http.get<Supplier[]>(`${this.apiUrl}/supplier`).subscribe({
            next: (data) => { if (data) this._suppliers.set(data); },
            error: (err) => console.error('Erreur API Supplier', err)
         });
         // Fetch Warehouses
         this.http.get<Warehouse[]>(`${this.apiUrl}/warehouse`).subscribe({
            next: (data) => { if (data) this._warehouses.set(data); },
            error: (err) => console.error('Erreur API Warehouse', err)
         });
         // Fetch LabourRates
         this.http.get<LabourRate[]>(`${this.apiUrl}/labour-rate`).subscribe({
            next: (data) => { if (data) this._labourRates.set(data); },
            error: (err) => console.error('Erreur API LabourRate', err)
         });
         // Fetch ServicePackages
         this.http.get<ServicePackage[]>(`${this.apiUrl}/service-package`).subscribe({
            next: (data) => { if (data) this._packages.set(data); },
            error: (err) => console.error('Erreur API ServicePackage', err)
         });
         // Fetch StockMovements
         this.http.get<StockMovement[]>(`${this.apiUrl}/stock-movement`).subscribe({
            next: (data) => { if (data) this._movements.set(data); },
            error: (err) => console.error('Erreur API StockMovement', err)
         });
         // Fetch Leads
         this.http.get<PlatformLead[]>(`${this.apiUrl}/lead`).subscribe({
            next: (data) => { if (data) this.leads.set(data); },
            error: (err) => console.error('Erreur API Lead', err)
         });
         // Fetch Roles
         this.http.get<Role[]>(`${this.apiUrl}/garage-role`).subscribe({
            next: (data) => { if (data && data.length > 0) this._roles.set(data); },
            error: (err) => console.error('Erreur API Role', err)
         });
      }

      // Fetch Global Announcement
      this.http.get<GlobalAnnouncement>(`${this.apiUrl}/platform-config/announcement`).subscribe({
         next: (data) => { if (data) this.globalAnnouncement.set(data); },
         error: (err) => console.error('Erreur API Announcement', err)
      });
   }

   // --- APP BOOTSTRAP INITIALIZER ---
   // Load data that doesn't require authentication (public endpoints)
   loadPublicData() {
      this.http.get<Tenant[]>(`${this.apiUrl}/tenant`).subscribe({
         next: (data) => { if (data) this.tenants.set(data); },
         error: (err) => console.error('Erreur lors du chargement public des tenants', err)
      });
   }

   async initAuth(): Promise<void> {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Skip AppUser validation if this is a Mobile App session
      // (Mobile users are 'Client' entities in DB, not 'AppUser')
      if (localStorage.getItem('mobileUserName')) {
         this.loadApiData();
         return;
      }

      try {
         // Validate JWT token via server-side profile endpoint
         const user = await firstValueFrom(
            this.http.get<AppUser>(`${this.apiUrl}/auth/profile`)
         );
         if (user) {
            this.currentUser.set(user);
            const safeUser = { id: user.id, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName };
            localStorage.setItem('currentUser', JSON.stringify(safeUser));
            // Load all API data now that we're authenticated
            this.loadApiData();
         }
      } catch (err) {
         console.warn('Session expired or invalid token, clearing auth state.');
         localStorage.removeItem('auth_token');
         localStorage.removeItem('access_token');
         localStorage.removeItem('currentUser');
         this.currentUser.set(null);
      }
   }

   // Mobile App Vehicles Storage (Moved to above constructor)

   mechanics = computed(() => {
      const currentT = this.currentTenantId();
      return this.staff()
         .filter(u => u.tenantId === currentT && u.role === 'Mecanicien' && u.active)
         .map(u => u.firstName);
   });

   platformConfig = signal<PlatformConfig>({
      stripePublicKey: '',
      googleMapsApiKey: '',
      sendGridApiKey: '',
      maintenanceMode: false,
      appName: 'ICE BY MECATECH',
      logoUrl: undefined,
      superAdminName: 'ICE BY MECATECH',
      superAdminLogoUrl: undefined
   });

   currentTenantFeatures = computed(() => {
      const tenantId = this.currentTenantId();
      const tenant = this.tenants().find(t => t.id === tenantId);
      if (!tenant) return PLAN_DEFAULTS['ICE Light'];

      return tenant.features && tenant.features.length > 0
         ? tenant.features
         : PLAN_DEFAULTS[tenant.plan] || PLAN_DEFAULTS['ICE Light'];
   });

   // Get reviews for current tenant (Garage View)
   garageReviews = computed(() => {
      const tenantId = this.currentTenantId();
      // Filter requests assigned to this tenant that have a rating
      return this.quoteRequests().filter(req =>
         tenantId && req.assignedTenantIds?.includes(tenantId) && req.clientRating && req.clientRating > 0
      );
   });

   // ... (Permission Logic & Computed Signals kept same) ...
   hasPermission(permission: string): boolean {
      if (this.currentUser()?.role === 'SuperAdmin' || this.currentUser()?.role === 'Root') return true;

      const tenantFeatures = this.currentTenantFeatures();
      if (!tenantFeatures?.includes(permission)) return false;

      const userRoleName = this.currentUser()?.role;
      if (!userRoleName) return false;

      // Try to find the role specifically for this tenant, fallback to any matching role name, 
      // or finally use the hardcoded initial definition to prevent race conditions.
      const currentTid = this.currentTenantId();
      let role = this.roles().find((r: any) => r.name === userRoleName && r.tenantId === currentTid);
      if (!role) {
         role = this.roles().find((r: any) => r.name === userRoleName);
      }
      if (!role || !role.permissions || role.permissions.length === 0) {
         role = this.initialRoles.find((r: any) => r.name === userRoleName);
      }

      if (!role) return false;

      if (role.name === 'Admin') return true;
      return role.permissions?.includes(permission) || false;
   }

   isAdmin = computed(() => this.currentUser()?.role === 'SuperAdmin' || this.currentUser()?.role === 'Root');
   isSecretary = computed(() => this.currentUser()?.role === 'Secretaire' || this.currentUser()?.role === 'Admin');
   isMechanicView = computed(() => {
      const role = this.currentUser()?.role;
      if (!role || role === 'SuperAdmin' || role === 'Root' || role === 'Admin') return false;
      return !this.hasPermission('access_repairs');
   });

   canViewFinancials = computed(() => this.hasPermission('view_financials'));
   canManageSettings = computed(() => this.hasPermission('manage_settings'));
   canViewBuyPrices = computed(() => this.hasPermission('view_financials'));
   canInvoice = computed(() => this.hasPermission('can_invoice'));
   canImportExport = computed(() => this.hasPermission('import_export_data'));
   canViewPartsStock = computed(() => this.hasPermission('view_parts_stock'));
   canManagePartsData = computed(() => this.hasPermission('manage_parts_data'));
   canManageStockLevels = computed(() => this.hasPermission('manage_stock_levels'));
   canCreateCounterSale = computed(() => this.hasPermission('create_counter_sale'));
   canManagePartRequests = computed(() => this.hasPermission('manage_part_requests'));
   canViewServicesCatalog = computed(() => this.hasPermission('view_services_catalog'));
   canManageServicesCatalog = computed(() => this.hasPermission('manage_services_catalog'));
   canViewWarehouses = computed(() => this.hasPermission('view_warehouses'));
   canManageWarehouses = computed(() => this.hasPermission('manage_warehouses'));
   canViewSuppliers = computed(() => this.hasPermission('view_suppliers'));
   canManageSuppliers = computed(() => this.hasPermission('manage_suppliers'));
   canViewStockMovements = computed(() => this.hasPermission('view_stock_movements'));
   canManageStock = computed(() => this.hasPermission('manage_stock_levels'));
   canViewStockDetails = computed(() => this.hasPermission('view_stock_movements') || this.hasPermission('view_parts_stock'));
   canManagePlanning = computed(() => this.hasPermission('manage_planning'));
   canCreateAppointment = computed(() => this.hasPermission('create_appointment'));

   lowStockParts = computed(() => this.parts().filter(p => p.stock <= p.minStock));
   activeRepairsCount = computed(() => this.repairs().filter(r => r.status !== 'Clôturé').length);
   pendingPartRequests = computed(() => {
      const list: { repair: RepairOrder, itemIndex: number, item: RepairItem }[] = [];
      this.repairs().forEach(r => {
         if (r.status !== 'Clôturé') {
            r.items.forEach((item, idx) => {
               if (item.type === 'part' && item.partId && item.fulfillmentStatus === 'REQUESTED') {
                  list.push({ repair: r, itemIndex: idx, item: item });
               }
            });
         }
      });
      return list;
   });
   todaysAppointments = computed(() => {
      const todayStr = new Date().toISOString().slice(0, 10);
      return this.repairs().filter(r => r.entryDate.startsWith(todayStr) && r.status !== 'Clôturé')
         .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
   });
   repairsToInvoice = computed(() => this.repairs().filter(r => r.status === 'Terminé'));
   newLeads = computed(() => this.opportunities().filter(o => o.status === 'DISPATCHED'));
   myAssignedTasks = computed(() => {
      const me = this.currentUser()?.firstName;
      if (!me) return [];
      return this.repairs().filter(r => r.mechanic === me && r.status !== 'Clôturé');
   });
   monthlyRevenue = computed(() => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return this.repairs()
         .filter(r => r.status === 'Clôturé' && r.entryDate >= monthStart)
         .reduce((total, repair) => {
            const repairTotal = repair.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            return total + repairTotal;
         }, 0);
   });
   totalStockValue = computed(() => this.parts().reduce((acc, p) => acc + (p.stock * p.buyPrice), 0));
   saasMetrics = computed(() => {
      const all = this.tenants();
      return {
         totalTenants: all.length,
         activeTenants: all.filter(t => t.status === 'Active').length,
         totalMrr: all.filter(t => t.status === 'Active').reduce((sum, t) => sum + t.mrr, 0),
         newLeads: this.leads().filter(l => l.status === 'New').length
      };
   });
   opportunities = computed(() => {
      const currentTenantId = this.currentTenantId();
      return this.quoteRequests().filter(q => currentTenantId && q.assignedTenantIds?.includes(currentTenantId) && (q.status === 'DISPATCHED' || q.status === 'QUOTE_SUBMITTED' || q.status === 'COMPLETED' || q.status === 'CONVERTED' || q.status === 'REJECTED'));
   });

   loginAs(user: AppUser, token?: string) {
      this.currentUser.set(user);
      const safeUser = { id: user.id, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName };
      localStorage.setItem('currentUser', JSON.stringify(safeUser));
      if (token) {
         localStorage.setItem('auth_token', token);
      }
      // Reload all data from API now that we're authenticated
      this.loadApiData();
   }

   // --- SERVER-SIDE LOGIN METHODS ---

   loginWithCredentials(email: string, password: string) {
      return this.http.post<{ user: AppUser; token: string }>(`${this.apiUrl}/auth/login`, { email, password });
   }

   loginWithPin(userId: string, pin: string) {
      return this.http.post<{ user: AppUser; token: string }>(`${this.apiUrl}/auth/pin-login`, { userId, pin });
   }

   fetchWorkshopStaff() {
      return this.http.get<{ id: string; firstName: string; lastName: string; role: string; active: boolean; tenantId: string }[]>(`${this.apiUrl}/auth/workshop-staff`);
   }

   logout() {
      // Clear all active user states and JWT token
      this.currentUser.set(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      
      // Force a hard reload to clear any memory states/caches
      const kioskTenantId = localStorage.getItem('kioskTenantId');
      if (kioskTenantId) {
         window.location.href = `/#/workshop/${kioskTenantId}`;
      } else {
         window.location.href = '/#/login';
      }
      setTimeout(() => window.location.reload(), 50);
   }

   // ... (Other Methods - addClient, updateClient, etc. UNCHANGED) ...
   addClient(client: Client) {
      client.tenantId = client.tenantId || this.currentTenantId() || 't1';
      // Optimistic update
      const tempId = client.id;
      this._clients.update(c => [...c, client]);

      // Save via API
      this.http.post<Client>(`${this.apiUrl}/client`, client).subscribe({
         next: (savedClient) => {
            // Replace optimistic with real ID from DB
            this._clients.update(list => list.map(c => c.id === tempId ? savedClient : c));
            this.toastService.show('Client ajouté (API)', 'success');
         },
         error: (err) => {
            console.error('Save error', err);
            this.toastService.show('Erreur de sauvegarde', 'error');
            // Revert changes
            this._clients.update(list => list.filter(c => c.id !== tempId));
         }
      });
   }

   /** Returns an Observable that completes when the Client is saved in the DB */
   addClientAsync(client: Client) {
      client.tenantId = client.tenantId || this.currentTenantId() || 't1';
      const tempId = client.id;
      this._clients.update(c => [...c, client]);
      return this.http.post<Client>(`${this.apiUrl}/client`, client);
   }

   updateClient(client: Client) {
      // Optimistic Update
      this._clients.update(list => list.map(c => c.id === client.id ? client : c));

      // Save via API
      this.http.patch<Client>(`${this.apiUrl}/client/${client.id}`, client).subscribe({
         next: (updated) => this.toastService.show('Client mis à jour (API)', 'success'),
         error: (err) => {
            console.error('Update error', err);
            this.toastService.show('Erreur de mise à jour', 'error');
            // Optionally trigger a reload wrapper here
         }
      });
   }

   getClientById(id: string) { return this.clients().find(c => c.id === id) || this._clients().find(c => c.id === id); }

   addVehicle(vehicle: Vehicle) {
      vehicle.tenantId = vehicle.tenantId || this.currentTenantId() || 't1';

      const tempId = vehicle.id;
      // Optimistic update
      this._vehicles.update(v => [...v, vehicle]);
      this._clients.update(clients => clients.map(c => c.id === vehicle.ownerId ? { ...c, vehicleIds: [...c.vehicleIds, vehicle.id] } : c));

      // Save via API
      this.http.post<Vehicle>(`${this.apiUrl}/vehicle`, vehicle).subscribe({
         next: (savedVehicle) => {
            this._vehicles.update(list => list.map(v => v.id === tempId ? savedVehicle : v));
            this.toastService.show('Véhicule ajouté (API)', 'success');
         },
         error: (err) => {
            console.error('Save error', err);
            this.toastService.show('Erreur de sauvegarde', 'error');
            // Revert changes
            this._vehicles.update(list => list.filter(v => v.id !== tempId));
         }
      });
   }

   /** Returns an Observable that completes when the Vehicle is saved in the DB */
   addVehicleAsync(vehicle: Vehicle) {
      vehicle.tenantId = vehicle.tenantId || this.currentTenantId() || 't1';
      this._vehicles.update(v => [...v, vehicle]);
      this._clients.update(clients => clients.map(c => c.id === vehicle.ownerId ? { ...c, vehicleIds: [...c.vehicleIds, vehicle.id] } : c));
      return this.http.post<Vehicle>(`${this.apiUrl}/vehicle`, vehicle);
   }

   updateVehicle(vehicle: Vehicle) {
      // Optimistic Update
      this._vehicles.update(list => list.map(v => v.id === vehicle.id ? vehicle : v));

      // Save via API
      this.http.patch<Vehicle>(`${this.apiUrl}/vehicle/${vehicle.id}`, vehicle).subscribe({
         next: (updated) => this.toastService.show('Véhicule mis à jour (API)', 'success'),
         error: (err) => {
            console.error('Update error', err);
            this.toastService.show('Erreur de mise à jour', 'error');
         }
      });
   }

   getVehicleById(id: string) { return this.vehicles().find(v => v.id === id) || this._vehicles().find(v => v.id === id); }
   transferVehicleOwnership(vehicleId: string, newOwnerId: string) {
      this._vehicles.update(list => list.map(v => {
         if (v.id === vehicleId) {
            const oldOwner = v.ownerId;
            this._clients.update(cList => cList.map(c => c.id === oldOwner ? { ...c, vehicleIds: c.vehicleIds.filter(id => id !== vehicleId) } : c));
            this._clients.update(cList => cList.map(c => c.id === newOwnerId ? { ...c, vehicleIds: [...c.vehicleIds, vehicleId] } : c));
            const updated = { ...v, ownerId: newOwnerId, history: [{ date: new Date().toISOString(), action: `Transfert propriété vers ${newOwnerId}`, user: this.currentUser()?.firstName || 'Système' }, ...v.history] };
            // Sync to backend
            this.http.patch(`${this.apiUrl}/vehicle/${vehicleId}`, { ownerId: newOwnerId }).subscribe({ error: (err) => console.error('Transfer ownership sync error', err) });
            return updated;
         }
         return v;
      }));
   }

   addRepair(repair: RepairOrder) {
      repair.tenantId = repair.tenantId || this.currentTenantId() || 't1';
      repair.history = [{ date: new Date().toISOString(), description: 'Création de l\'ordre de réparation', user: this.currentUser().firstName }, ...repair.history];
      this._repairs.update(r => [repair, ...r]);
      this.http.post(`${this.apiUrl}/repair`, repair).subscribe({ error: (err) => console.error('Save repair error', err) });
   }
   deleteRepair(id: string) {
      this._repairs.update(repairs => repairs.filter(r => r.id !== id));
      this.http.delete(`${this.apiUrl}/repair/${id}`).subscribe({ error: (err) => console.error('Delete repair error', err) });
   }

   // Sync repair state to DB after local mutation
   private syncRepairDB(id: string) {
      const repair = this._repairs().find(r => r.id === id);
      if (repair) { this.http.patch(`${this.apiUrl}/repair/${id}`, repair).subscribe({ error: (err) => console.error('Sync repair error', err) }); }
   }
   updateRepairStatus(id: string, status: RepairStatus) {
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === id) {
            let updatedItems = r.items;
            if (status === 'En cours') {
               updatedItems = r.items.map(item => {
                  if (item.type === 'part' && item.partId && (!item.fulfillmentStatus || item.fulfillmentStatus === 'PENDING')) {
                     return { ...item, fulfillmentStatus: 'REQUESTED' as FulfillmentStatus };
                  }
                  return item;
               });
            }
            if (status === 'Clôturé' && r.status !== 'Clôturé') { this.processRepairClosingStock(r); }
            const newHistoryEntry: RepairHistoryEntry = {
               date: new Date().toISOString(),
               description: `Statut changé : ${r.status} ➔ ${status}`,
               user: this.currentUser().firstName
            };

            // SYNC TO QUOTE REQUEST FOR MOBILE PERSISTENCE
            setTimeout(() => {
               const linkedReq = this.quoteRequests().find(qr => qr.repairOrderId === id);
               if (linkedReq) {
                  this.quoteRequests.update(list => list.map(qr => qr.id === linkedReq.id ? { ...qr, repairStatus: status } : qr));
                  this.syncQuoteRequestDB(linkedReq.id);
               }
            }, 0);

            return { ...r, status, items: updatedItems, history: [newHistoryEntry, ...r.history] };
         }
         return r;
      })
      );
      this.syncRepairDB(id);
   }
   updateMechanic(id: string, mechanic: string) {
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === id) {
            const prevMech = r.mechanic || 'Aucun';
            const newHistoryEntry: RepairHistoryEntry = { date: new Date().toISOString(), description: `Mécanicien assigné : ${prevMech} ➔ ${mechanic}`, user: this.currentUser().firstName };
            return { ...r, mechanic, history: [newHistoryEntry, ...r.history] };
         }
         return r;
      })
      );
      this.syncRepairDB(id);
   }
   scheduleRepair(id: string, mechanic: string | undefined, date: string) {
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === id) {
            const prevMech = r.mechanic || 'Aucun';
            const isAssigning = !!mechanic && mechanic !== '';
            const newDate = date || r.entryDate;
            let newStatus = r.status;
            let historyDesc = '';
            if (isAssigning) {
               historyDesc = `Planifié pour ${mechanic} le ${new Date(newDate).toLocaleDateString()}`;
               if (r.status === 'En attente') { newStatus = 'En cours'; historyDesc += ' (Statut auto : En cours)'; }
            } else { historyDesc = `Retiré du planning (était ${prevMech})`; }
            const newHistoryEntry: RepairHistoryEntry = { date: new Date().toISOString(), description: historyDesc, user: this.currentUser().firstName };
            return { ...r, mechanic: mechanic, entryDate: newDate, status: newStatus, history: [newHistoryEntry, ...r.history] };
         }
         return r;
      })
      );
      this.syncRepairDB(id);
   }

   // NEW: CLIENT SELF-SCHEDULING
   clientScheduleRepair(repairId: string, date: string) {
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === repairId) {
            const newHistoryEntry: RepairHistoryEntry = {
               date: new Date().toISOString(),
               description: `Rendez-vous planifié par le client pour le ${new Date(date).toLocaleString('fr-FR')}`,
               user: 'Client (Mobile)'
            };
            // Mechanic stays undefined to be "Unassigned"
            return { ...r, entryDate: date, history: [newHistoryEntry, ...r.history] };
         }
         return r;
      }));
      this.syncRepairDB(repairId);
   }

   updateRepairItems(id: string, items: RepairItem[]) { this._repairs.update(repairs => repairs.map(r => r.id === id ? { ...r, items } : r)); this.syncRepairDB(id); }
   requestPartTransfer(repairId: string, itemIndex: number) { this.updateRepairItemStatus(repairId, itemIndex, 'REQUESTED'); }
   validatePartExit(repairId: string, itemIndex: number, recipient: string) {
      const repair = this._repairs().find(r => r.id === repairId);
      if (!repair) return;
      const item = repair.items[itemIndex];
      if (item.partId && item.type === 'part') {
         const mvt: StockMovement = { id: this.generateUUID(), partId: item.partId, date: new Date().toISOString(), type: 'OUT_REPAIR', quantity: item.quantity, reason: `OR-${repair.id.substring(0, 6)}`, userId: this.currentUser().firstName, recipient: recipient };
         this.addMovement(mvt);
         const newHistoryEntry: RepairHistoryEntry = { date: new Date().toISOString(), description: `Pièce sortie (${item.description} x${item.quantity}) par ${recipient}`, user: this.currentUser().firstName };
         this._repairs.update(repairs => repairs.map(r => r.id === repairId ? { ...r, history: [newHistoryEntry, ...r.history] } : r));
      }
      this.updateRepairItemStatus(repairId, itemIndex, 'DELIVERED');
   }
   private updateRepairItemStatus(repairId: string, itemIndex: number, status: FulfillmentStatus) { this._repairs.update(repairs => repairs.map(r => { if (r.id === repairId) { const newItems = [...r.items]; newItems[itemIndex] = { ...newItems[itemIndex], fulfillmentStatus: status }; return { ...r, items: newItems }; } return r; })); this.syncRepairDB(repairId); }

   addDownPayment(repairId: string, payment: DownPayment) {
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === repairId) {
            const newHistoryEntry: RepairHistoryEntry = {
               date: new Date().toISOString(),
               description: `Acompte reçu : ${payment.amount} (${payment.method})`,
               user: this.currentUser().firstName
            };
            return {
               ...r,
               downPayments: [...r.downPayments, payment],
               history: [newHistoryEntry, ...r.history]
            };
         }
         return r;
      }));
      this.syncRepairDB(repairId);
   }

   // UPDATE FINANCIALS (NEW)
   updateRepairFinancials(repairId: string, financialData: Partial<RepairOrder>) {
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === repairId) {
            return { ...r, ...financialData };
         }
         return r;
      }));
      this.syncRepairDB(repairId);
   }

   getPartById(id: string) { return this.parts().find(p => p.id === id); }
   getSupplierById(id: string) { return this.suppliers().find(s => s.id === id); }
   getWarehouseById(id: string) { return this.warehouses().find(w => w.id === id); }
   getInvoiceById(id: string) { return this.invoices().find(i => i.id === id); }
   getPublicInvoiceById(id: string) { return this._invoices().find(i => i.id === id); }
   getPublicRepairById(id: string) { return this._repairs().find(r => r.id === id); }

   addPart(part: Part) {
      part.tenantId = part.tenantId || this.currentTenantId() || 't1';
      this._parts.update(p => [...p, part]);
      this.http.post(`${this.apiUrl}/part`, part).subscribe({ error: (err) => console.error('Save part error', err) });
   }
   updatePart(part: Part) {
      this._parts.update(parts => parts.map(p => p.id === part.id ? part : p));
      this.http.patch(`${this.apiUrl}/part/${part.id}`, part).subscribe({ error: (err) => console.error('Update part error', err) });
   }
   addMovement(movement: StockMovement) {
      movement.tenantId = movement.tenantId || this.currentTenantId() || 't1';
      this._movements.update(m => [movement, ...m]);
      this._parts.update(parts => parts.map(p => { if (p.id === movement.partId) { let newStock = p.stock; if (movement.type === 'IN_PURCHASE' || (movement.type === 'ADJUSTMENT' && movement.quantity > 0)) { newStock += movement.quantity; } else { newStock -= Math.abs(movement.quantity); } const updated = { ...p, stock: Math.max(0, newStock) }; this.http.patch(`${this.apiUrl}/part/${p.id}`, { stock: updated.stock }).subscribe({ error: (err) => console.error('Update part stock error', err) }); return updated; } return p; }));
      this.http.post(`${this.apiUrl}/stock-movement`, movement).subscribe({ error: (err) => console.error('Save movement error', err) });
   }
   private processRepairClosingStock(repair: RepairOrder) { const partsToConsume = repair.items.filter(i => i.type === 'part' && i.partId && i.fulfillmentStatus !== 'DELIVERED'); partsToConsume.forEach(item => { const mvt: StockMovement = { id: this.generateUUID(), partId: item.partId!, date: new Date().toISOString(), type: 'OUT_REPAIR', quantity: item.quantity, reason: `OR-${repair.id.substring(0, 6)} (Clôture)`, userId: this.currentUser().firstName }; this.addMovement(mvt); }); }

   updateGarageSettings(settings: Partial<GarageSettings>) {
      // Extract only the purely "settings/customization" values we want to save within `settings` object
      const tenantSpecificSettings = {
         rccm: settings.rccm,
         vatNumber: settings.vatNumber,
         defaultVatRate: settings.defaultVatRate,
         currency: settings.currency,
         invoiceFooter: settings.invoiceFooter,
         docTemplate: settings.docTemplate,
         docColor: settings.docColor,
         quoteValidity: settings.quoteValidity,
         termsAndConditions: settings.termsAndConditions,
         useBackgroundImage: settings.useBackgroundImage,
         logoUrl: settings.logoUrl,
         backgroundImageUrl: settings.backgroundImageUrl
      };

      const currentT = this.currentTenantId();
      const currentTenant = this.tenants().find(t => t.id === currentT);
      if (currentTenant) {
         this.updateTenant({
            ...currentTenant,
            name: settings.name || currentTenant.name,
            phone: settings.phone || currentTenant.phone,
            address: settings.address !== undefined ? settings.address : currentTenant.address,
            description: settings.description !== undefined ? settings.description : currentTenant.description,
            city: settings.city !== undefined ? settings.city : currentTenant.city,
            commune: settings.commune !== undefined ? settings.commune : currentTenant.commune,
            zip: settings.zip !== undefined ? settings.zip : currentTenant.zip,
            lat: settings.lat !== undefined ? settings.lat : currentTenant.lat,
            lng: settings.lng !== undefined ? settings.lng : currentTenant.lng,
            adminEmail: settings.email !== undefined ? settings.email : currentTenant.adminEmail,
            settings: {
               ...(currentTenant.settings || {}),
               ...tenantSpecificSettings
            }
         });
      }
   }
   addRole(role: Role) {
      this._roles.update(r => [...r, role]);
      this.http.post(`${this.apiUrl}/garage-role`, role).subscribe({ error: (err) => console.error('Save role error', err) });
   }
   updateRole(role: Role) {
      this._roles.update(list => list.map(r => r.id === role.id ? role : r));
      this.http.patch(`${this.apiUrl}/garage-role/${role.id}`, role).subscribe({ error: (err) => console.error('Update role error', err) });
   }
   deleteRole(id: string) {
      const role = this.roles().find(r => r.id === id);
      if (role && !role.isSystem) {
         this._roles.update(list => list.filter(r => r.id !== id));
         this.http.delete(`${this.apiUrl}/garage-role/${id}`).subscribe({ error: (err) => console.error('Delete role error', err) });
      }
   }

   addStaff(user: AppUser) {
      // Optimistic insert first, then replace with server response or rollback
      const tempId = user.id;
      this.staff.update(s => [...s, user]);
      this.http.post<AppUser>(`${this.apiUrl}/user`, user).subscribe({
         next: (data) => this.staff.update(s => [data, ...s.filter(u => u.id !== tempId)]),
         error: (err) => {
            console.error(err);
            this.toastService.show('Erreur de sauvegarde Utilisateur', 'error');
            // Rollback optimistic insert
            this.staff.update(s => s.filter(u => u.id !== tempId));
         }
      });
   }
   updateStaff(user: AppUser) {
      // Optimistic update first
      this.staff.update(list => list.map(u => u.id === user.id ? user : u));
      this.http.patch<AppUser>(`${this.apiUrl}/user/${user.id}`, user).subscribe({
         next: (data) => this.staff.update(list => list.map(u => u.id === data.id ? data : u)),
         error: (err) => {
            console.error(err);
            this.toastService.show('Erreur de sauvegarde Utilisateur', 'error');
         }
      });
   }
   toggleStaffStatus(id: string) {
      const user = this.staff().find(u => u.id === id);
      if (user) {
         const toggledUser = { ...user, active: !user.active };
         this.updateStaff(toggledUser);
      }
   }
   deleteStaff(id: string) {
      // Optimistic delete first, rollback on error
      const backup = this.staff();
      this.staff.update(list => list.filter(u => u.id !== id));
      this.http.delete(`${this.apiUrl}/user/${id}`).subscribe({
         error: (err) => {
            console.error(err);
            this.toastService.show('Erreur de suppression Utilisateur', 'error');
            // Rollback
            this.staff.set(backup);
         }
      });
   }

   // Tenant Logic (SuperAdmin)
   addTenant(tenant: Tenant) {
      this.http.post<Tenant>(`${this.apiUrl}/tenant`, tenant).subscribe({
         next: (data) => {
            // Replace optimistic item with the API-confirmed record (real IDs, DB defaults, etc.)
            this.tenants.update(t => [data, ...t.filter(x => x.id !== tenant.id)]);
            // Auto-create default roles for this new tenant
            this.initialRoles.forEach(role => {
               this.http.post<Role>(`${this.apiUrl}/garage-role`, {
                  ...role,
                  id: this.generateUUID(),
                  tenantId: data.id
               }).subscribe({
                  error: e => console.warn('[addTenant] Default role creation skipped:', e?.error?.message)
               });
            });
            // Auto-create a Manager account for the garage admin (silent, non-blocking)
            const adminUser: AppUser = {
               id: this.generateUUID(),
               firstName: 'Admin',
               lastName: data.name,
               email: data.adminEmail,
               password: data.password,
               role: 'Manager',
               active: true,
               tenantId: data.id
            };
            // Use a direct call (not addStaff) so that a duplicate-email error
            // does not show a noisy toast — the garage itself was already saved.
            this.http.post<AppUser>(`${this.apiUrl}/user`, adminUser).subscribe({
               next: (u) => this.staff.update(s => [u, ...s.filter(x => x.id !== adminUser.id)]),
               error: (e) => console.warn('[addTenant] Auto-admin user creation skipped (may already exist):', e?.error?.message)
            });
            this.staff.update(s => [adminUser, ...s]);
         },
         error: (err) => {
            console.error(err);
            this.toastService.show('Erreur de sauvegarde Garage', 'error');
            // Rollback optimistic update
            this.tenants.update(t => t.filter(x => x.id !== tenant.id));
         }
      });
      // Optimistic insert so the UI responds instantly
      this.tenants.update(t => [tenant, ...t]);
   }

   updateTenant(tenant: Tenant) {
      this.http.patch<Tenant>(`${this.apiUrl}/tenant/${tenant.id}`, tenant).subscribe({
         next: (data) => this.tenants.update(list => list.map(t => t.id === data.id ? data : t)),
         error: (err) => {
            console.error(err);
            this.toastService.show('Erreur de sauvegarde Garage', 'error');
         }
      });
      this.tenants.update(list => list.map(t => t.id === tenant.id ? tenant : t));
   }

   // Lead Logic (SuperAdmin)
   addLead(lead: PlatformLead) {
      this.leads.update(l => [lead, ...l]);
      this.http.post(`${this.apiUrl}/lead`, lead).subscribe({ error: (err) => console.error('Save lead error', err) });
   }
   updateLeadStatus(id: string, status: PlatformLead['status']) {
      this.leads.update(list => list.map(l => l.id === id ? { ...l, status } : l));
      this.http.patch(`${this.apiUrl}/lead/${id}`, { status }).subscribe({ error: (err) => console.error('Update lead error', err) });
   }

   savePlatformConfig(config: PlatformConfig) {
      this.platformConfig.set(config);
      this.http.put(`${this.apiUrl}/platform-config`, config).subscribe({ error: (err) => console.error('Save platform config error', err) });
   }

   // Tenant/Quote/Invoice logic
   syncInvoiceDB(invoiceId: string, partialPayload?: Partial<Invoice>) {
      if (partialPayload) {
         // Send only the changed fields — avoids Prisma 'Unknown field' errors
         this.http.patch(`${this.apiUrl}/invoice/${invoiceId}`, partialPayload).subscribe({
            error: err => console.error(`Error syncing invoice ${invoiceId} to DB`, err)
         });
         return;
      }
      const invoice = this._invoices().find(i => i.id === invoiceId);
      if (!invoice) return;
      // Clean payload: remove Prisma relation objects before sending
      const { client, tenant, items, ...cleanData } = invoice as any;
      this.http.patch(`${this.apiUrl}/invoice/${invoice.id}`, cleanData).subscribe({
         error: err => console.error(`Error syncing invoice ${invoice.id} to DB`, err)
      });
   }

   addInvoice(invoice: Invoice) {
      invoice.tenantId = invoice.tenantId || this.currentTenantId() || 't1';
      this._invoices.update(list => { const index = list.findIndex(i => i.id === invoice.id); if (index !== -1) { const newList = [...list]; newList[index] = invoice; return newList; } return [invoice, ...list]; });
      
      // Clean payload: remove Prisma relation objects and unknown fields
      const { client, tenant, items, ...cleanData } = invoice as any;
      const cleanPayload = { ...cleanData, items: items?.map((i: any) => { const { invoice: _inv, ...itemData } = i; return itemData; }) || [] };

      this.http.post(`${this.apiUrl}/invoice`, cleanPayload).subscribe({
         error: err => {
            console.error(`Error creating invoice ${invoice.id} in DB`, err);
            this.syncInvoiceDB(invoice.id); // Fallback to patch if it already existed
         }
      });
   }
   
   updateInvoiceStatus(id: string, status: Invoice['status']) { 
      this._invoices.update(list => list.map(i => i.id === id ? { ...i, status } : i)); 
      this.syncInvoiceDB(id, { status });
   }
   submitQuoteForReview(requestId: string, invoice: Invoice) {
      this.quoteRequests.update(list => list.map(r => {
         if (r.id === requestId) {
            let proposals = r.proposedQuotes ? [...r.proposedQuotes] : [];
            const existingQuoteIndex = proposals.findIndex(qid => {
               const existingInvoice = this._invoices().find(i => i.id === qid);
               return existingInvoice && existingInvoice.tenantId === invoice.tenantId;
            });

            if (existingQuoteIndex !== -1) {
               // Update existing quote for this tenant
               proposals[existingQuoteIndex] = invoice.id;
            } else {
               // Add new quote
               proposals.push(invoice.id);
            }

            return {
               ...r,
               // Status depends on perspective now; SuperAdmin sees it as QUOTE_SUBMITTED globally
               status: r.status === 'CONVERTED' ? 'CONVERTED' : 'QUOTE_SUBMITTED',
               proposedQuotes: proposals,
               isUnlockedForModification: false
            };
         } return r;
      }));
      this.addInvoice(invoice);
      this.syncQuoteRequestDB(requestId);
   }

   validateQuoteRequest(requestId: string) {
      const req = this.quoteRequests().find(r => r.id === requestId);
      if (req) {
         this.quoteRequests.update(list => list.map(r => r.id === requestId ? { ...r, status: 'COMPLETED' } : r));
         if (req.proposedQuotes) {
            req.proposedQuotes.forEach(qid => {
               const q = this.getPublicInvoiceById(qid);
               if (q && q.status !== 'REFUSE') {
                  this.updateInvoiceStatus(qid, 'ENVOYE');
               }
            });
         }
         this.addSystemLog('INFO', `Quote Request #${requestId} SENT TO CLIENT (Pending Client Choice)`, 'Global');
         this.syncQuoteRequestDB(requestId);
      }
   }

   transmitQuoteToClient(requestId: string, quoteId: string) {
      const req = this.quoteRequests().find(r => r.id === requestId);
      if (req) {
         // Mark the specific quote as sent
         this.updateInvoiceStatus(quoteId, 'ENVOYE');

         // If the request isn't globally completed or converted, mark it completed
         if (req.status !== 'COMPLETED' && req.status !== 'CONVERTED') {
            this.quoteRequests.update(list => list.map(r => r.id === requestId ? { ...r, status: 'COMPLETED' } : r));
         }

         this.addSystemLog('INFO', `Specific Quote #${quoteId} on Request #${requestId} TRANSMITTED TO CLIENT`, 'Global');
         this.syncQuoteRequestDB(requestId);
      }
   }

   rejectQuoteRequest(requestId: string, reason: string = '') {
      this.quoteRequests.update(list => list.map(r => r.id === requestId ? { ...r, status: 'REJECTED', rejectionReason: reason } : r));
      this.syncQuoteRequestDB(requestId);
   }

   rejectSpecificQuote(requestId: string, quoteId: string, reason: string = '') {
      this.updateInvoiceStatus(quoteId, 'REFUSE');
      const invoice = this.getPublicInvoiceById(quoteId);
      if (reason && invoice && invoice.tenantId) {
         this.addMessageToQuoteRequest(requestId, {
            senderId: 'SUPERADMIN',
            senderName: 'Mecatech',
            tenantId: invoice.tenantId,
            message: `[DEVIS REFUSÉ] ${reason}`
         });
      }
      this.addSystemLog('INFO', `Specific Quote #${quoteId} on Request #${requestId} REJECTED`, 'Global');
      this.syncQuoteRequestDB(requestId);
   }

   addMessageToQuoteRequest(requestId: string, messageData: Omit<QuoteMessage, 'id' | 'date'>) {
      const newMessage: QuoteMessage = {
         id: this.generateUUID(),
         date: new Date().toISOString(),
         ...messageData
      };

      const isFromAdmin = messageData.senderId === 'SUPERADMIN';
      const targetTenantId = messageData.tenantId;

      this.quoteRequests.update(list => list.map(r => {
         if (r.id === requestId) {
            let newUnreadGarages = r.unreadMessageTenantIds || [];
            if (isFromAdmin && targetTenantId && !newUnreadGarages.includes(targetTenantId)) {
               newUnreadGarages = [...newUnreadGarages, targetTenantId];
            }

            return {
               ...r,
               messages: [...(r.messages || []), newMessage],
               unreadMessageTenantIds: newUnreadGarages,
               hasUnreadMessagesForAdmin: !isFromAdmin ? true : r.hasUnreadMessagesForAdmin
            };
         }
         return r;
      }));
      this.syncQuoteRequestDB(requestId);
   }

   markMessagesAsRead(requestId: string, userType: 'GARAGE' | 'ADMIN', tenantId?: string) {
      this.quoteRequests.update(list => list.map(r => {
         if (r.id === requestId) {
            if (userType === 'GARAGE' && tenantId) {
               return {
                  ...r,
                  unreadMessageTenantIds: (r.unreadMessageTenantIds || []).filter(id => id !== tenantId)
               };
            } else if (userType === 'ADMIN') {
               return { ...r, hasUnreadMessagesForAdmin: false };
            }
         }
         return r;
      }));
      this.syncQuoteRequestDB(requestId);
   }

   toggleQuoteModification(requestId: string, unlocked: boolean, tenantId: string) {
      this.quoteRequests.update(list => list.map(r => {
         if (r.id === requestId) {
            let currentUnlocked = r.unlockedTenantIds || [];
            if (unlocked && !currentUnlocked.includes(tenantId)) {
               currentUnlocked = [...currentUnlocked, tenantId];
            } else if (!unlocked) {
               currentUnlocked = currentUnlocked.filter(id => id !== tenantId);
            }
            return { ...r, unlockedTenantIds: currentUnlocked };
         }
         return r;
      }));
      this.syncQuoteRequestDB(requestId);
   }

   dispatchQuoteRequest(requestId: string, tenantIds: string[], adminDesc?: string) {
      this.quoteRequests.update(list => list.map(r => {
         if (r.id === requestId) {
            this.addSystemLog('INFO', `Quote Request #${r.id} dispatched to ${tenantIds.length} Tenants`, 'Global');
            return { ...r, status: 'DISPATCHED', assignedTenantIds: tenantIds, assignedDate: new Date().toISOString(), adminDescription: adminDesc };
         }
         return r;
      }));
      this.syncQuoteRequestDB(requestId);
   }

   initFeePayment(requestId: string) {
      return this.http.post<{paymentUrl: string, transactionId: string}>(`${this.apiUrl}/payments/init-fee`, { quoteRequestId: requestId });
   }

   clientAcceptQuote(requestId: string, quoteId: string): string | null {
      const req = this.quoteRequests().find(r => r.id === requestId);
      if (req && req.proposedQuotes) {
         // Mark other transmitted quotes as rejected to inform other garages they lost
         req.proposedQuotes.forEach(qid => {
            if (qid !== quoteId) {
               const q = this.getInvoiceById(qid);
               if (q && q.status === 'ENVOYE') {
                  this.updateInvoiceStatus(qid, 'REFUSE');
               }
            }
         });
      }

      this.quoteRequests.update(list => list.map(r => {
         if (r.id === requestId) {
            return { ...r, status: 'CONVERTED', acceptedQuoteId: quoteId };
         }
         return r;
      }));

      this.updateInvoiceStatus(quoteId, 'ACCEPTE');
      this.addSystemLog('INFO', `Client accepted quote ${quoteId} for request ${requestId}`, 'Global');
      this.syncQuoteRequestDB(requestId, { status: 'CONVERTED', acceptedQuoteId: quoteId });

      return null;
   }

   // ==== MOBILE NATIVE AUTH ====
   
   loginMobileClient(credentials: any) {
      return this.http.post<{ user: Client; token: string }>(`${this.apiUrl}/client/mobile/login`, credentials);
   }

   registerMobileClient(clientData: any) {
      return this.http.post<{ user: Client; token: string }>(`${this.apiUrl}/client/mobile/register`, clientData);
   }

   forgotPasswordMobile(email: string) {
      return this.http.post<{ success: boolean; tempPassword: string; firstName: string }>(`${this.apiUrl}/client/mobile/forgot-password`, { email });
   }

   changePasswordMobile(clientId: string, oldPassword: string, newPassword: string) {
      return firstValueFrom(this.http.post(`${this.apiUrl}/client/mobile/change-password`, { clientId, oldPassword, newPassword }));
   }

   async updateAvatar(clientId: string, base64: string) {
      try {
         const updatedUser = await firstValueFrom(this.http.patch<Client>(`${this.apiUrl}/client/mobile/avatar`, { clientId, base64 }));
         
         // If a garage/admin user happens to be editing their own client profile
         if (this.currentUser()?.id === clientId) {
            this.currentUser.set(updatedUser as any); // Update global signal
            const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
            userData.avatarUrl = updatedUser.avatarUrl;
            localStorage.setItem('currentUser', JSON.stringify(userData));
         }

         this._clients.update(list => list.map(c => c.id === clientId ? updatedUser : c));
         
         return updatedUser;
      } catch (e) {
         console.error('Avatar upload failed:', e);
         throw e;
      }
   }

   syncPushToken(phone: string, pushToken: string) {
      if (!phone || !pushToken) return;
      this.http.patch(`${this.apiUrl}/client/mobile/push-token`, { phone, pushToken }).subscribe({
         error: (err) => console.error('Error syncing push token', err)
      });
   }

   // REVIEW LOGIC
   submitReview(requestId: string, rating: number, comment: string) {
      // 1. Update Request
      this.quoteRequests.update(list => list.map(r => {
         if (r.id === requestId) {
            return { ...r, clientRating: rating, clientReview: comment };
         }
         return r;
      }));

      // 2. Update Tenant Rating
      const req = this.quoteRequests().find(r => r.id === requestId);
      const acceptedQuote = this.getInvoiceById(req?.acceptedQuoteId || req?.garageQuoteId || '');

      // Find the tenant who did the job based on the accepted quote
      let tenantId = 't1'; // Default Fallback
      if (acceptedQuote && acceptedQuote.tenantId) {
         tenantId = acceptedQuote.tenantId;
      } else if (req?.assignedTenantIds && req.assignedTenantIds.length > 0) {
         tenantId = req.assignedTenantIds[0];
      }

      const tenant = this.tenants().find(t => t.id === tenantId);
      if (tenant) {
         const currentCount = tenant.reviewCount || 0;
         const currentRating = tenant.rating || 0;

         // Calculate new average
         const newCount = currentCount + 1;
         const newRating = ((currentRating * currentCount) + rating) / newCount;

         this.updateTenant({
            ...tenant,
            reviewCount: newCount,
            rating: parseFloat(newRating.toFixed(1))
         });
      }
      this.syncQuoteRequestDB(requestId);
   }

   markOpportunityAsConverted(requestId: string, repairOrderId: string) {
      this.quoteRequests.update(list => list.map(r => r.id === requestId ? { ...r, status: 'CONVERTED', repairOrderId, repairStatus: 'En attente' } : r));
      this.syncQuoteRequestDB(requestId);
   }

   createMobileRequest(request: QuoteRequest) {
      // Remove frontend-only properties before sending to API to prevent Prisma "Unknown field" errors
      const { localStatus, myQuoteId, isUnlockedForModification, hasUnreadMessagesForGarage, locationQuarter, ...apiPayload } = request;
      
      // Merge locationQuarter into locationCommune so we don't need a DB migration
      if (locationQuarter && locationQuarter.trim() !== '') {
         apiPayload.locationCommune = apiPayload.locationCommune 
            ? `${apiPayload.locationCommune} - ${locationQuarter.trim()}` 
            : locationQuarter.trim();
      }
      
      this.http.post<QuoteRequest>(`${this.apiUrl}/quote-request`, apiPayload).subscribe({
         next: (data) => this.quoteRequests.update(list => [...list, data]),
         error: (err) => {
            console.error('API Error saving Mobile Request', err);
            this.toastService.show('Erreur d\'envoi de la demande. Veuillez réessayer.', 'error');
          }
      });
      this.addSystemLog('INFO', `New Mobile Request from ${request.motoristName}`, 'Global');
   }

   createDirectRequest(phone: string, vehicle: MotoristVehicle, tenantId: string, customDescription?: string) {
      const userProfile = this.getUserProfileByPhone(phone);
      const defaultDesc = 'Demande de devis directe suite à une visite au garage (Scan ICE)';
      const finalDescription = customDescription && customDescription.trim() !== '' ? customDescription.trim() : defaultDesc;

      const newRequest: QuoteRequest = {
         id: this.generateUUID(),
         date: new Date().toISOString(),
         status: 'DISPATCHED',
         motoristName: userProfile.name,
         motoristPhone: phone,
         locationCity: 'Demande sur place',
         vehicleBrand: vehicle.brand,
         vehicleModel: vehicle.model,
         vehicleYear: vehicle.year,
         fuel: vehicle.fuel,
         description: finalDescription,
         photos: [],
         interventionLocation: 'GARAGE',
         assignedTenantIds: [tenantId],
         assignedDate: new Date().toISOString(),
         isDirectRequest: true,
         directTenantId: tenantId
      };

      const { localStatus, myQuoteId, isUnlockedForModification, hasUnreadMessagesForGarage, ...apiPayload } = newRequest;

      this.http.post<QuoteRequest>(`${this.apiUrl}/quote-request`, apiPayload).subscribe({
         next: (data) => this.quoteRequests.update(list => [data, ...list]),
         error: (err) => {
            console.error('API Error saving Direct Request', err);
            // Optimistic fallback
            this.quoteRequests.update(list => [newRequest, ...list]);
         }
      });

      this.addSystemLog('INFO', `Nouvelle Demande Directe créée suite au Scan de ${newRequest.motoristName}`, tenantId);
   }

   // Helper to sync quotes to DB after local mutation
   syncQuoteRequestDB(requestId: string, partialPayload?: Record<string, any>) {
      if (partialPayload) {
         // Optimistic update of local state
         this.quoteRequests.update(list => list.map(r => r.id === requestId ? { ...r, ...partialPayload } : r));
         
         // Send only the changed fields — avoids Prisma 'Unknown field' errors
         this.http.patch(`${this.apiUrl}/quote-request/${requestId}`, partialPayload).subscribe({
            error: err => console.error(`Error syncing quote request ${requestId} to DB`, err)
         });
         return;
      }
      const q = this.quoteRequests().find(r => r.id === requestId);
      if (!q) return;

      const { localStatus, myQuoteId, isUnlockedForModification, hasUnreadMessagesForGarage, ...apiPayload } = q;
      
      this.http.patch(`${this.apiUrl}/quote-request/${requestId}`, apiPayload).subscribe({
         error: err => console.error(`Error syncing quote request ${requestId} to DB`, err)
      });
   }

   // --- MOBILE VEHICLES MANAGEMENT ---
   addMobileVehicle(v: MotoristVehicle) {
      // Optimistic update: add immediately to signal
      this.mobileVehicles.update(list => [...list, v]);
      this.http.post<MotoristVehicle>(`${this.apiUrl}/motorist-vehicle`, v).subscribe({
         next: (data) => this.mobileVehicles.update(list => list.map(item => item.id === v.id ? data : item)),
         error: (err) => {
            console.error('API Error saving mobile vehicle', err);
         }
      });
   }

   updateMobileVehicle(v: MotoristVehicle) {
      // Optimistic update: replace immediately in signal
      this.mobileVehicles.update(list => list.map(item => item.id === v.id ? v : item));
      this.http.patch<MotoristVehicle>(`${this.apiUrl}/motorist-vehicle/${v.id}`, v).subscribe({
         next: (data) => this.mobileVehicles.update(list => list.map(item => item.id === data.id ? data : item)),
         error: (err) => {
            console.error('API Error updating mobile vehicle', err);
         }
      });
   }

   deleteMobileVehicle(id: string) {
      this.http.delete(`${this.apiUrl}/motorist-vehicle/${id}`).subscribe({
         next: () => this.mobileVehicles.update(list => list.filter(v => v.id !== id)),
         error: (err) => {
            console.error('API Error deleting mobile vehicle', err);
            this.mobileVehicles.update(list => list.filter(v => v.id !== id)); // Optimistic fallback
         }
      });
   }

   addSystemLog(level: 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY', message: string, tenantId?: string) {
      const log: SystemLog = { id: this.generateUUID(), date: new Date().toISOString(), level, message, tenantId, user: this.currentUser()?.email || 'Système' };
      this.http.post<SystemLog>(`${this.apiUrl}/system-log`, log).subscribe({
         next: (data) => this.systemLogs.update(l => [data, ...l]),
         error: (err) => {
            console.error('API Error saving SystemLog', err);
            this.systemLogs.update(l => [log, ...l]);
         }
      });
   }

   // --- QR Code Tracking ---
   recordQRScan(log: QRScanLog) {
      this.http.post<QRScanLog>(`${this.apiUrl}/qrscanlog`, log).subscribe({
         next: (data) => this.qrScans.update(s => [data, ...s]),
         error: (err) => {
            console.error('API Error saving QRScanLog', err);
            this.qrScans.update(s => [log, ...s]); // Optimistic fallback
         }
      });
   }

   getUserProfileByPhone(phone: string) {
      const userVehicles = this.mobileVehicles().filter(v => v.ownerPhone === phone);
      const userRequests = this.quoteRequests().filter(r => r.motoristPhone === phone);
      
      // Attempt to find the client's real name from the CRM database
      const clientProfile = this.clients().find(c => c.phone === phone && c.type === 'Particulier');
      let name = 'Utilisateur APP';
      
      if (clientProfile) {
         name = `${clientProfile.firstName} ${clientProfile.lastName || ''}`.trim();
      } else if (userRequests.length > 0) {
         name = userRequests[0].motoristName;
      }
      
      return { name, vehicles: userVehicles, requests: userRequests };
   }

   syncMobileProfileToCRM(oldPhone: string, profileData: any) {
      let updatedClient: any = null;
      this._clients.update(list => list.map(c => {
         if (c.phone === oldPhone) {
            const log: ModificationLog = { date: new Date().toISOString(), action: 'Mise à jour profil via App Mobile', user: 'Client' };
            const isEntreprise = c.type === 'Entreprise';
            const newName = profileData.name || (isEntreprise ? c.companyName : c.firstName + ' ' + (c.lastName || ''));
            const firstName = isEntreprise ? c.firstName : (newName.split(' ')[0] || c.firstName);
            const lastName = isEntreprise ? c.lastName : (newName.split(' ').slice(1).join(' ') || c.lastName || '');
            const newClient = { 
               ...c, 
               firstName, 
               lastName, 
               companyName: isEntreprise ? newName : c.companyName,
               fleetSize: isEntreprise && profileData.fleetSize !== null ? Number(profileData.fleetSize) : c.fleetSize,
               email: profileData.email || c.email,
               address: {
                  ...(c.address || {}),
                  city: profileData.city || c.address?.city || '',
                  street: profileData.address || c.address?.street || '',
                  zip: c.address?.zip || ''
               },
               history: [log, ...c.history] 
            };
            updatedClient = newClient;
            return newClient;
         }
         return c;
      }));

      if (updatedClient) {
         this.updateClient(updatedClient);
      }

      this.quoteRequests.update(list => list.map(r => {
         if (r.motoristPhone === oldPhone) {
            return { ...r, motoristName: profileData.name || r.motoristName };
         }
         return r;
      }));
   }

   syncMobileVehicleToCRM(mobileVehicle: MotoristVehicle) {
      const parentClient = this._clients().find(c => c.phone === mobileVehicle.ownerPhone);
      if (!parentClient) return;

      this._vehicles.update(list => list.map(v => {
         // Attempt to find the matching vehicle in CRM by looking at ownerId + (VIN or Plate or Brand/Model)
         if (v.ownerId === parentClient.id && ((v.vin && v.vin === mobileVehicle.vin) || (v.plate && v.plate === mobileVehicle.plate) || (v.brand === mobileVehicle.brand && v.model === mobileVehicle.model))) {
            const log: ModificationLog = { date: new Date().toISOString(), action: `Mise à jour via App Mobile (Précédemment: ${v.brand} ${v.model} ${v.mileage}km)`, user: 'Client' };
            return {
               ...v,
               brand: mobileVehicle.brand,
               model: mobileVehicle.model,
               vin: mobileVehicle.vin || '',
               plate: mobileVehicle.plate || '',
               fuel: mobileVehicle.fuel || 'Essence',
               mileage: mobileVehicle.mileage || 0,
               history: [log, ...v.history]
            };
         }
         return v;
      }));
   }

   // Suppliers, Warehouses, Labour, Packages ... (Same as before)
   addSupplier(supplier: Supplier) {
      supplier.tenantId = supplier.tenantId || this.currentTenantId() || 't1';
      this._suppliers.update(s => [...s, supplier]);
      this.http.post(`${this.apiUrl}/supplier`, supplier).subscribe({ error: (err) => console.error('Save supplier error', err) });
   }
   updateSupplier(supplier: Supplier) {
      this._suppliers.update(list => list.map(s => s.id === supplier.id ? supplier : s));
      this.http.patch(`${this.apiUrl}/supplier/${supplier.id}`, supplier).subscribe({ error: (err) => console.error('Update supplier error', err) });
   }
   addWarehouse(warehouse: Warehouse) {
      warehouse.tenantId = warehouse.tenantId || this.currentTenantId() || 't1';
      this._warehouses.update(w => [...w, warehouse]);
      this.http.post(`${this.apiUrl}/warehouse`, warehouse).subscribe({ error: (err) => console.error('Save warehouse error', err) });
   }
   updateWarehouse(warehouse: Warehouse) {
      this._warehouses.update(list => list.map(w => w.id === warehouse.id ? warehouse : w));
      this.http.patch(`${this.apiUrl}/warehouse/${warehouse.id}`, warehouse).subscribe({ error: (err) => console.error('Update warehouse error', err) });
   }
   addLabourRate(rate: LabourRate) {
      rate.tenantId = rate.tenantId || this.currentTenantId() || 't1';
      this._labourRates.update(r => [...r, rate]);
      this.http.post(`${this.apiUrl}/labour-rate`, rate).subscribe({ error: (err) => console.error('Save labour-rate error', err) });
   }
   updateLabourRate(rate: LabourRate) {
      this._labourRates.update(list => list.map(r => r.id === rate.id ? rate : r));
      this.http.patch(`${this.apiUrl}/labour-rate/${rate.id}`, rate).subscribe({ error: (err) => console.error('Update labour-rate error', err) });
   }
   addPackage(pkg: ServicePackage) {
      pkg.tenantId = pkg.tenantId || this.currentTenantId() || 't1';
      this._packages.update(p => [...p, pkg]);
      this.http.post(`${this.apiUrl}/service-package`, pkg).subscribe({ error: (err) => console.error('Save package error', err) });
   }
   updatePackage(pkg: ServicePackage) {
      this._packages.update(list => list.map(p => p.id === pkg.id ? pkg : p));
      this.http.patch(`${this.apiUrl}/service-package/${pkg.id}`, pkg).subscribe({ error: (err) => console.error('Update package error', err) });
   }

   // Timer Logic ... (Same as before)
   private closeActiveLog(repairId: string, userId: string) {
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === repairId && r.timeLogs) {
            const updatedLogs = r.timeLogs.map(log => {
               if (log.userId === userId && !log.endTime) {
                  const end = new Date();
                  const start = new Date(log.startTime);
                  const duration = Math.round((end.getTime() - start.getTime()) / 60000);
                  return { ...log, endTime: end.toISOString(), durationMinutes: duration };
               }
               return log;
            });
            return { ...r, timeLogs: updatedLogs };
         }
         return r;
      }));
   }

   startTimer(repairId: string) {
      const currentUser = this.currentUser();
      this.closeActiveLog(repairId, currentUser.id);
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === repairId) {
            const newLog: TimeLog = { id: this.generateUUID(), userId: currentUser.id, type: 'WORK', startTime: new Date().toISOString() };
            let status = r.status;
            if (status === 'En attente' || status === 'Diagnostic') status = 'En cours';
            return { ...r, status, timeLogs: [...(r.timeLogs || []), newLog] };
         }
         return r;
      }));
   }

   startPause(repairId: string, reason: string) {
      const currentUser = this.currentUser();
      this.closeActiveLog(repairId, currentUser.id);
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === repairId) {
            const newLog: TimeLog = { id: this.generateUUID(), userId: currentUser.id, type: 'PAUSE', startTime: new Date().toISOString(), pauseReason: reason };
            return { ...r, timeLogs: [...(r.timeLogs || []), newLog] };
         }
         return r;
      }));
   }

   finishMechanicTask(repairId: string) {
      const currentUser = this.currentUser();
      this.closeActiveLog(repairId, currentUser.id);
      this._repairs.update(repairs => repairs.map(r => {
         if (r.id === repairId) {
            const newHistoryEntry: RepairHistoryEntry = { date: new Date().toISOString(), description: `Intervention terminée par ${currentUser.firstName}`, user: currentUser.firstName };
            return { ...r, status: 'Terminé', history: [newHistoryEntry, ...r.history] };
         }
         return r;
      }));
   }

   getActiveTimer(repairId: string): TimeLog | undefined {
      const r = this.repairs().find(rep => rep.id === repairId);
      if (!r || !r.timeLogs) return undefined;
      return r.timeLogs.find(log => log.userId === this.currentUser().id && !log.endTime);
   }

   getMechanicTotalTime(mechanicId: string): number {
      let totalMinutes = 0;
      this.repairs().forEach(r => {
         if (r.timeLogs) {
            r.timeLogs.filter(l => l.userId === mechanicId && l.type === 'WORK' && l.durationMinutes).forEach(l => { totalMinutes += l.durationMinutes || 0; });
         }
      });
      return totalMinutes;
   }

   // --- ROOTS / SUPERADMINS DELEGATES MANAGEMENT ---

   admins = computed(() => this._admins());
   auditLogs = computed(() => this._auditLogs());
   callCenterTickets = computed(() => this._callCenterTickets());

   fetchAdmins() {
      if (this.currentUser()?.role !== 'Root') return;
      this.http.get<any[]>(`${this.apiUrl}/superadmin/users`).subscribe({
         next: (data) => this._admins.set(data),
         error: (err) => console.error('Fetch admins error', err)
      });
   }

   createAdmin(adminData: any) {
      this.http.post<AppUser>(`${this.apiUrl}/superadmin/users`, adminData).subscribe({
         next: (newAdmin) => {
            this._admins.update(list => [...list, newAdmin]);
            this.toastService.show('Administrateur créé avec succès', 'success');
         },
         error: (err) => {
            console.error('Create admin error', err);
            this.toastService.show('Erreur de création admin', 'error');
         }
      });
   }

   updateAdmin(id: string, adminData: any) {
      this.http.patch<AppUser>(`${this.apiUrl}/superadmin/users/${id}`, adminData).subscribe({
         next: (updatedAdmin) => {
            this._admins.update(list => list.map(a => a.id === id ? updatedAdmin : a));

            // Update active session instantaneously if modifying self
            const currentU = this.currentUser();
            if (currentU && currentU.id === id) {
               this.currentUser.set(updatedAdmin);
               const safeUser = { id: updatedAdmin.id, role: updatedAdmin.role, email: updatedAdmin.email, firstName: updatedAdmin.firstName, lastName: updatedAdmin.lastName };
               localStorage.setItem('currentUser', JSON.stringify(safeUser));
            }

            this.toastService.show('Permissions mises à jour', 'success');
         },
         error: (err) => {
            console.error('Update admin error', err);
            this.toastService.show('Erreur de mise à jour', 'error');
         }
      });
   }

   fetchAuditLogs() {
      if (this.currentUser()?.role !== 'Root') return;
      this.http.get<any[]>(`${this.apiUrl}/superadmin/audit`).subscribe({
         next: (data) => this._auditLogs.set(data),
         error: (err) => console.error('Fetch audit logs error', err)
      });
   }

   // --- CALL CENTER TICKETS ---
   fetchCallCenterTickets() {
      this.http.get<CallCenterTicket[]>(`${this.apiUrl}/call-center-ticket`).subscribe({
         next: data => this._callCenterTickets.set(data),
         error: err => console.error('Error fetching call center tickets', err)
      });
   }
   
   createCallCenterTicket(ticket: any) {
      if (!ticket.id) ticket.id = this.generateUUID();
      ticket.createdBy = ticket.createdBy || this.currentUser()?.id || 'SYSTEM';
      
      return this.http.post<CallCenterTicket>(`${this.apiUrl}/call-center-ticket`, ticket).subscribe({
         next: data => this._callCenterTickets.update(list => [data, ...list]),
         error: err => {
             console.error('Error creating ticket', err);
             this.toastService.show('Erreur de création ticket', 'error');
         }
      });
   }

   updateCallCenterTicket(id: string, ticket: any) {
      return this.http.patch<CallCenterTicket>(`${this.apiUrl}/call-center-ticket/${id}`, ticket).subscribe({
         next: data => this._callCenterTickets.update(list => list.map(t => t.id === id ? data : t)),
         error: err => console.error('Error updating ticket', err)
      });
   }

   // --- AI INTEGRATION ---
   summarizeCall(transcription: string) {
      return this.http.post<{summary: string}>(`${this.apiUrl}/ai/summarize`, { text: transcription });
   }

}
