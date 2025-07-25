import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StripeService {
  // stripePromise: Promise<Stripe>;
  constructor(private http: HttpClient, private router: Router) {
    // this.stripePromise = this.loadStripe();
  }

  async loadStripe(): Promise<Stripe> {
    return (window as any).stripe(environment.stripePublishableKey);
  }

  redirectToCheckout(lookup: 'monthly_plan' | 'yearly_plan'): void {
    this.createStripeSession(lookup).subscribe({
      next: (response) => {
        window.location.href = response.url;
      },
      error: (error) => {
        console.error('Error creating Stripe session:', error);
      },
    });
  }

  createStripeSession(lookup: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${environment.apiUrl}/checkout`,
      { lookup },
      {
        withCredentials: true,
      }
    );
  }
}
