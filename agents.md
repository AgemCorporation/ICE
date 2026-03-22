# 🤖 ICE Project - Technical Handover Document

This document summarizes the current state of the ICE (Intelligent Customer Experience) project for AI coordination and development transition.

## 🏗️ Architecture Stack
- **Frontend**: Angular 18 (Standalone, Zoneless Detection).
  - **State Management**: Reactive Signals in `src/services/data.service.ts`.
  - **Routing**: Functional guards (`authGuard`) in `index.tsx`. Uses `withHashLocation()`.
- **Backend**: NestJS (Modular).
  - **ORM**: Prisma with PostgreSQL.
  - **Location**: `/backend` directory.
- **Bootstrapping**: `index.tsx` handles Angular bootstrap and `APP_INITIALIZER` for Auth sync.

---

## 🔐 Authentication & Session Persistence
- **Auth Logic**: 
  - `DataService.initAuth()` retrieves the user profile from the backend on every page refresh.
  - Sensitive data (permissions, roles) is **never** relied upon from `localStorage`. `localStorage` is only used as a non-authoritative hint for the initial UI state.
- **Secure Logout**:
  - `DataService.logout()` clears the `currentUser` signal, removes `localStorage` keys, and triggers a `window.location.reload()` to destroy memory cache.
- **Route Guards**:
  - **`authGuard`**: Implemented centrally in `index.tsx`. Redirects to `/login` if `dataService.currentUser().id` is missing.

---

## 🛡️ Permission System (Permissions & Roles)
### 1. SuperAdmin (Platform Level)
- **Root User**: Hardcoded/Identified by role `Root`. Accesses all modules.
- **Délégués**: User role `SuperAdmin`. Permissions are granular strings in `AppUser.superAdminPerms[]`.
- **Key Permissions**: `VIEW_DASHBOARD`, `MANAGE_MODERATION`, `MANAGE_TENANTS`, `VIEW_TENANTS`, `MANAGE_LEADS`, `MANAGE_CONFIG`, `VIEW_LOGS`, `MANAGE_SCANS`, `VIEW_MOBILE_USERS`.
- **Constraint**: If an admin has `VIEW_TENANTS` but not `MANAGE_TENANTS`, the UI must hide creation/edit buttons.

### 2. Garage Staff (Tenant Level)
- Permissions are linked to **Roles** (Admin, Manager, Mechanic, Secretary).
- Roles are synchronized from `DataService.PLAN_DEFAULTS` and can be overridden per Tenant in the DB.
- **Logic Fix**: Newly created managers must have `access_settings` to see the Parameters module.

---

## 🔄 Recent Fixes & Critical Points
- **Cross-Device Consistency**: All logs (`system-log`) and platform configs are now stored in PostgreSQL, not `localStorage`.
- **QR Scan Identification**: `DataService.getUserProfileByPhone(phone)` now queries the `clients` table (`type === 'Particulier'`) to resolve real names instead of the "Utilisateur APP" placeholder.
- **Vehicle Count**: Mobile users' vehicle counts are dynamically calculated in the Superadmin view by filtering `mobileVehicles()` via `ownerPhone`.

---

## 🛠️ Development Guidelines for Next Agent
1. **Always use Signals**: Stick to Angular Signals for UI reactivity.
2. **Backend Guarding**: Ensure NestJS controllers implement `x-root-user-id` check for Root-only actions.
3. **No LocalStorage dependency**: Treat the API as the single source of truth for user state.
4. **UI Design**: Keep the premium appearance (Tailwind indigo/slate palette).

---

## 📱 Roadmap: Integration Capacitor (Mobile App)
L'étape suivante est la conversion de la vue `/mobile` en application native Android/iOS.
1. **Initialisation** : Installer `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` et `@capacitor/ios`.
2. **Isolation des Vues** : Ne pas toucher aux vues Garages/SuperAdmin. Utiliser le Router Angular pour verrouiller l'app mobile sur `MobileAppComponent`.
3. **Logique Autonome** : Implémenter une détection de plateforme (`Capacitor.isNativePlatform()`) dans `index.tsx` pour rediriger automatiquement vers `/mobile`.
4. **Fonctions Natives** : 
   - **App Mobile** : Utiliser `@capacitor/camera` pour les photos de dommages. Configurer pour permettre au client de choisir entre **"Prendre une Photo"** ou **"Choisir depuis la Galerie"**.
   - **Côté Garage** : Le scan QR est une action effectuée par le garage (via PC ou future version native). L'app mobile n'a pas besoin de fonction de scan dans cette version ; elle doit uniquement afficher son QR Code de manière lisible.
   - **Notifications** : Prévoir `@capacitor/push-notifications` pour les alertes de devis.

---
*Created on 2026-03-12 by Antigravity.*
