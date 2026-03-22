import { Component, signal, inject, computed, NgZone, ChangeDetectorRef, HostListener, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastComponent } from './components/ui/toast.component';
import { ToastService } from './services/toast.service';
import { DataService, AppUser } from './services/data.service';
import { ThemeService } from './services/theme.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

declare let Html5QrcodeScanner: any;

import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  dataService = inject(DataService);
  themeService = inject(ThemeService); // Inject ThemeService
  router: Router = inject(Router);
  zone = inject(NgZone);
  cdr = inject(ChangeDetectorRef);
  toast = inject(ToastService);

  @HostListener('click') onHostClick() { this.cdr.markForCheck(); }
  @HostListener('touchend') onHostTouch() { this.cdr.markForCheck(); }

  // Desktop Sidebar State
  collapsed = signal(false);

  // Mobile Sidebar State
  mobileMenuOpen = signal(false);

  // Layout control
  isFullScreenLayout = signal(false);

  // Toggle for user switcher dropdown
  showUserSwitcher = signal(false);

  // Define Navigation Groups
  private garageMainItems: { label: string; path: string; icon: SafeHtml, requiredPermission: string, badge?: boolean }[] = [];
  private garageSecondaryItems: { label: string; path: string; icon: SafeHtml, requiredPermission: string, badge?: boolean }[] = [];
  private platformNavItems: { label: string; path: string; icon: SafeHtml, badge?: boolean }[] = [];
  private rootNavItems: { label: string; path: string; icon: SafeHtml, badge?: boolean }[] = [];

  // Computed Nav Items based on Role (Platform Owner vs Garage Staff)
  mainNavItems = computed(() => {
    // If Super Admin (Platform Owner), show ONLY Platform Console items
    if (this.dataService.isAdmin()) {
      const user = this.dataService.currentUser();

      // Root sees everything
      if (user && user.role === 'Root') {
        return [...this.platformNavItems, ...this.rootNavItems];
      }

      // Filtered SuperAdmin views based on specific superAdminPerms
      if (user && user.role === 'SuperAdmin') {
        const perms = user.superAdminPerms || [];
        return this.platformNavItems.filter(nav => {
          if (nav.path.includes('dashboard')) return perms.includes('VIEW_DASHBOARD');
          if (nav.path.includes('moderation')) return perms.includes('MANAGE_MODERATION');
          if (nav.path.includes('tenants')) return perms.includes('MANAGE_TENANTS') || perms.includes('VIEW_TENANTS');
          if (nav.path.includes('customers')) return perms.includes('VIEW_MOBILE_USERS');
          if (nav.path.includes('leads')) return perms.includes('MANAGE_LEADS');
          if (nav.path.includes('config')) return perms.includes('MANAGE_CONFIG');
          if (nav.path.includes('logs')) return perms.includes('VIEW_LOGS');
          if (nav.path.includes('scans')) return perms.includes('MANAGE_SCANS');
          return false;
        });
      }

      return this.platformNavItems;
    }

    // Otherwise (Garage Manager/Staff), show standard garage modules filtered by permission
    return this.garageMainItems.filter(item => this.dataService.hasPermission(item.requiredPermission));
  });

  secondaryNavItems = computed(() => {
    // If Super Admin, no secondary items for now
    if (this.dataService.isAdmin()) {
      return [];
    }

    // Garage Secondary Items (Opportunities)
    return this.garageSecondaryItems.filter(item => this.dataService.hasPermission(item.requiredPermission));
  });

  constructor(private sanitizer: DomSanitizer) {
    if (Capacitor.isNativePlatform()) {
      // Force Native App into Mobile mode
      this.router.navigate(['/mobile']);
    }

    // Tawk.to Identity Sync & Dynamic Injection
    let tawkInjected = false;
    effect(() => {
      const user = this.dataService.currentUser();
      const tid = this.dataService.currentTenantId();
      const tenant = this.dataService.tenants().find(t => t.id === tid);
      const w = window as any;

      if (Capacitor.isNativePlatform()) {
         return; // Let mobile-app.component.ts handle Tawk completely on mobile devices.
      }

      const isGarageUser = user && !this.dataService.isAdmin();

      if (!isGarageUser) {
         if (w.Tawk_API && typeof w.Tawk_API.hideWidget === 'function') {
            w.Tawk_API.hideWidget();
         }
         return;
      }

      const fullName = `${user.firstName} ${user.lastName} ${tenant ? ' (' + tenant.name + ')' : '[' + user.role + ']'}`;

      if (!tawkInjected) {
         tawkInjected = true;
         
         // 1. Strict Identity Config BEFORE load
         w.Tawk_API = w.Tawk_API || {};
         w.Tawk_API.visitor = { name: fullName, email: user.email };
         w.Tawk_API.onLoad = () => {
            w.Tawk_API.setAttributes({ name: fullName, email: user.email }, function(error: any){});
         };

         // 2. Inject script
         const s1 = document.createElement("script");
         const s0 = document.getElementsByTagName("script")[0];
         s1.async = true;
         s1.src = 'https://embed.tawk.to/69bfe053efc5d11c3692a9aa/1jkao8ibt';
         s1.charset = 'UTF-8';
         s1.setAttribute('crossorigin','*');
         if (s0 && s0.parentNode) s0.parentNode.insertBefore(s1, s0);
         else document.head.appendChild(s1);
      } else {
         // 3. Fallback sync if effect re-runs after load
         if (w.Tawk_API && typeof w.Tawk_API.showWidget === 'function') w.Tawk_API.showWidget();
         if (w.Tawk_API && typeof w.Tawk_API.setAttributes === 'function') {
            w.Tawk_API.setAttributes({ name: fullName, email: user.email }, function(error: any) {});
         }
      }
    });

    // Monitor route changes to hide layout on login AND close mobile menu on nav
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (Capacitor.isNativePlatform() && !event.urlAfterRedirects.includes('/mobile')) {
         this.router.navigate(['/mobile']);
      }
      this.isFullScreenLayout.set(
        event.urlAfterRedirects.includes('/login') || 
        event.urlAfterRedirects.includes('/mobile') || 
        event.urlAfterRedirects.includes('/workshop')
      );
      this.mobileMenuOpen.set(false); // Close mobile menu on navigation
    });

    // 1. Main Navigation for Garage Users
    this.garageMainItems = [
      {
        label: 'Tableau de bord',
        path: '/dashboard',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-6"><rect x="3" y="3" width="8" height="6" rx="2" /><rect x="3" y="12" width="8" height="9" rx="2" /><rect x="13" y="3" width="8" height="9" rx="2" /><rect x="13" y="15" width="8" height="6" rx="2" /></svg>'),
        requiredPermission: 'access_dashboard'
      },
      {
        label: 'Clients & Véhicules',
        path: '/clients',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>'),
        requiredPermission: 'access_clients'
      },
      {
        label: 'Atelier & Réparations',
        path: '/repairs',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M8 12l1.5-2.5h5L16 12M12 9.5v2.5M6.5 12h11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1.5a1.5 1.5 0 0 0-3 0h-2a1.5 1.5 0 0 0-3 0H6.5a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z"/><circle cx="9.5" cy="15" r="1"/><circle cx="14.5" cy="15" r="1"/><path stroke-linecap="round" stroke-linejoin="round" d="M7 17.5h4m-4 2h4M13.5 18l1.5 1.5 3-3"/></svg>'),
        requiredPermission: 'access_repairs'
      },
      {
        label: 'Documents & Compta',
        path: '/documents',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>'),
        requiredPermission: 'access_documents'
      },
      {
        label: 'Stock & Catalogue',
        path: '/inventory',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>'),
        requiredPermission: 'access_inventory'
      },
      {
        label: 'Planning',
        path: '/planning',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>'),
        requiredPermission: 'access_planning'
      },
      {
        label: 'Paramètres',
        path: '/settings',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>'),
        requiredPermission: 'access_settings'
      }
    ];

    // 2. Secondary Navigation (Placed below line)
    this.garageSecondaryItems = [
      {
        label: 'Opportunités',
        path: '/opportunities',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>'),
        requiredPermission: 'access_opportunities',
        badge: true
      },
      {
        label: 'Ressources Humaines',
        path: '/hr',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>'),
        requiredPermission: 'access_hr'
      }
    ];

    // 3. Navigation for Platform Owner (Super Admin) - 100% Custom Interface with distinct items
    this.platformNavItems = [
      {
        label: 'Vue d\'ensemble',
        path: '/super-admin/dashboard',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-6"><rect x="3" y="3" width="8" height="6" rx="2" /><rect x="3" y="12" width="8" height="9" rx="2" /><rect x="13" y="3" width="8" height="9" rx="2" /><rect x="13" y="15" width="8" height="6" rx="2" /></svg>')
      },
      {
        label: 'Pro Devis Auto',
        path: '/super-admin/moderation',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>'),
        badge: true
      },
      {
        label: 'Garages (Tenants)',
        path: '/super-admin/tenants',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>')
      },
      {
        label: 'Prospects (Leads)',
        path: '/super-admin/leads',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>')
      },
      {
        label: 'ICE Mobile',
        path: '/super-admin/customers',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>')
      },
      {
        label: 'Configuration',
        path: '/super-admin/config',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>')
      },
      {
        label: 'Incidents & Logs',
        path: '/super-admin/logs',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>')
      },
      {
        label: 'Scans ICE',
        path: '/super-admin/scans',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>')
      }
    ];

    // 4. Root Only Navigation
    this.rootNavItems = [
      {
        label: 'Administrateurs',
        path: '/super-admin/admins',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>')
      },
      {
        label: 'Journal d\'Audit',
        path: '/super-admin/audit',
        icon: this.sanitize('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>')
      }
    ];
  }

  toggleSidebar() {
    this.collapsed.update(v => !v);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  toggleUserSwitcher() {
    this.showUserSwitcher.update(v => !v);
  }

  switchUser(user: AppUser) {
    this.dataService.loginAs(user);
    this.showUserSwitcher.set(false);

    // Redirect if needed (e.g. from Admin to Mechanic view)
    if (user.role === 'SuperAdmin') this.router.navigate(['/super-admin']);
    else this.router.navigate(['/dashboard']);
  }

  // --- QR SCanner Logic ---
  isScannerOpen = false;
  scannedProfile: any = null;
  html5QrCode: any = null;

  openScanner() {
    this.isScannerOpen = true;
    this.scannedProfile = null;
    this.closeMobileMenu();
    setTimeout(() => {
      this.html5QrCode = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      this.html5QrCode.render(this.onScanSuccess.bind(this), this.onScanFailure.bind(this));
      this.translateScannerText();
    }, 100);
  }

  private scannerObserver: MutationObserver | null = null;

  translateScannerText() {
    const qrReader = document.getElementById("qr-reader");
    if (!qrReader) return;

    this.scannerObserver = new MutationObserver(() => {
      const scanBtn = document.getElementById("html5-qrcode-button-camera-start");
      if (scanBtn && scanBtn.innerText !== "Démarrer la caméra") scanBtn.innerText = "Démarrer la caméra";

      const stopBtn = document.getElementById("html5-qrcode-button-camera-stop");
      if (stopBtn && stopBtn.innerText !== "Arrêter la caméra") stopBtn.innerText = "Arrêter la caméra";

      const fileBtn = document.getElementById("html5-qrcode-button-file-selection");
      if (fileBtn && fileBtn.innerText !== "Scanner une image") fileBtn.innerText = "Scanner une image";

      const pBtn = document.getElementById("html5-qrcode-button-camera-permission");
      if (pBtn && pBtn.innerText !== "Autoriser la caméra") pBtn.innerText = "Autoriser la caméra";

      const spanElem = document.getElementById("html5-qrcode-anchor-scan-type-change");
      if (spanElem) {
        if (spanElem.innerText.includes("Scan an Image File")) spanElem.innerText = spanElem.innerText.replace("Scan an Image File", "Scanner une image");
        if (spanElem.innerText.includes("Scan using camera directly")) spanElem.innerText = spanElem.innerText.replace("Scan using camera directly", "Utiliser la caméra");
      }

      const allNodes = Array.from(qrReader.querySelectorAll("*"));
      for (const node of allNodes) {
        if (node.childNodes.length) {
          for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE && child.textContent) {
              if (child.textContent.includes("Requesting camera permissions...")) {
                child.textContent = child.textContent.replace("Requesting camera permissions...", "Demande d'autorisation de la caméra...");
              }
            }
          }
        }
      }
    });

    this.scannerObserver.observe(qrReader, { childList: true, subtree: true, characterData: true });
  }

  closeScanner() {
    if (this.scannerObserver) {
      this.scannerObserver.disconnect();
      this.scannerObserver = null;
    }
    if (this.html5QrCode) {
      this.html5QrCode.clear().catch((error: any) => console.error("Failed to clear scanner", error));
      this.html5QrCode = null;
    }
    this.isScannerOpen = false;
    this.scannedProfile = null;
  }

  resetScanner() {
    this.scannedProfile = null;
    this.closeScanner();
    setTimeout(() => this.openScanner(), 50);
  }

  onScanSuccess(decodedText: string) {
    try {
      const data = JSON.parse(decodedText);
      if (data.source === 'ICE_APP' && data.phone) {
        this.zone.run(() => {
          const profile = this.dataService.getUserProfileByPhone(data.phone);
          const currentTenantId = this.dataService.isAdmin() ? 'SUPER_ADMIN' : (this.dataService.currentTenantId() || 't1');

          this.scannedProfile = {
            name: profile.name,
            phone: data.phone,
            vehicles: profile.vehicles,
            localRequests: profile.requests.filter(r => r.assignedTenantIds?.includes(currentTenantId))
          };

          this.dataService.recordQRScan({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            scannedUserPhone: data.phone,
            scannedUserName: profile.name,
            scannerTenantId: currentTenantId,
            scannerName: this.dataService.currentUser()?.firstName || 'Système'
          });
          if (this.html5QrCode) {
            this.html5QrCode.clear().catch((e: any) => console.log('Clear issue', e));
            this.html5QrCode = null;
          }
          this.cdr.detectChanges();
        });
      }
    } catch (e) { }
  }

  selectedLocalRequest: any = null;

  createDirectRequest(vehicle: any, desc: string = '') {
    const currentTenantId = this.dataService.isAdmin() ? 'SUPER_ADMIN' : (this.dataService.currentTenantId() || 't1');
    this.dataService.createDirectRequest(this.scannedProfile.phone, vehicle, currentTenantId, desc);

    // Refresh local requests mapping
    const profile = this.dataService.getUserProfileByPhone(this.scannedProfile.phone);
    this.scannedProfile.localRequests = profile.requests.filter(r => r.assignedTenantIds?.includes(currentTenantId));

    this.toast.show('Demande directe envoyée avec succès.', 'success');
    this.cdr.detectChanges();
  }

  openLocalRequestDetails(req: any) {
    this.selectedLocalRequest = req;
  }

  closeLocalRequestDetails() {
    this.selectedLocalRequest = null;
  }

  openInOpportunities(req: any) {
    this.closeScanner();
    this.router.navigate(['/opportunities'], { queryParams: { openId: req.id } });
  }

  reviewQuote(req: any) {
    this.closeScanner();
    this.router.navigate(['/opportunities'], { queryParams: { openId: req.id, action: 'review' } });
  }

  onScanFailure(error: any) { }

  private sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}