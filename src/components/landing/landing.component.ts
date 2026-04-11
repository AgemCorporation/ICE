import { Component, AfterViewInit, ElementRef, inject, PLATFORM_ID, ViewEncapsulation, signal } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LandingComponent implements AfterViewInit {
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private dataService = inject(DataService);
  private http = inject(HttpClient);
  private router = inject(Router);

  formSubmitting = signal(false);
  formSuccess = signal(false);
  formError = signal('');

  private readonly apiUrl = 'https://ice-m7jm.onrender.com/api';

  constructor() {
    // Redirect to dashboard if already authenticated
    if (this.dataService.currentUser()?.id) {
       this.router.navigate(['/dashboard']);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      const animatables = this.el.nativeElement.querySelectorAll('.animate');
      animatables.forEach((el: HTMLElement) => observer.observe(el));
    }
  }

  scrollTo(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToForm() {
    const formCard = document.querySelector('.form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth' });
    }
  }

  submitForm(event: Event) {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const garageName = (formData.get('garageName') as string || '').trim();
    const city = (formData.get('city') as string || '').trim();
    const contactName = (formData.get('contactName') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    const vehiclesPerDay = (formData.get('vehiclesPerDay') as string || '').trim();
    const planInterest = (formData.get('planInterest') as string || '').trim();
    const equipment = (formData.get('equipment') as string || '').trim();

    // Validation
    if (!garageName || !contactName || !phone) {
      this.formError.set('Veuillez remplir les champs obligatoires : Nom du garage, Nom du responsable et Téléphone.');
      return;
    }

    this.formSubmitting.set(true);
    this.formError.set('');
    this.formSuccess.set(false);

    const lead = {
      garageName,
      contactName,
      phone,
      city: city || null,
      vehiclesPerDay: vehiclesPerDay || null,
      equipment: equipment || null,
      planInterest: planInterest || 'ICE Light',
      date: new Date().toISOString(),
      status: 'New'
    };

    this.http.post(`${this.apiUrl}/lead`, lead).subscribe({
      next: () => {
        this.formSubmitting.set(false);
        this.formSuccess.set(true);
        form.reset();
      },
      error: (err) => {
        console.error('Lead submission error:', err);
        this.formSubmitting.set(false);
        this.formError.set('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
