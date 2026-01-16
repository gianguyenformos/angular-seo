import { Component, inject, input, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { Account } from '../../core/auth/account.model';
import { AccountService } from '../../core/auth/account.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  template: `
    <div class="product-container">
      <h1>📦 Product Details</h1>
      <p>Viewing ID: <strong>{{ id() }}</strong></p>

      @if (productData()) {
        <div class="details">
          <h2>{{ productData().name }}</h2>
          <p>{{ productData().description }}</p>
        </div>
      } @else {
        <p>Loading product information...</p>
      }

      @if (account && account.login) {
        <div class="alert alert-success">
          <span>You are logged in as user &quot;{{ account.login }}&quot;.</span>
        </div>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  // This matches the ':id' in your route path
  id = input.required<string>();
  productData = signal<any>(null);

  private readonly route = inject(ActivatedRoute);
  private routeParamsSubscription?: Subscription;

  account: Account | null = null;

  constructor() {
    // Initialize account from route resolver data
    // Resolver completes before component creation during SSR
    const profileData = this.route.snapshot.data['profile'];
    this.account = (profileData as Account | null) || null;

    // Watch for changes to the id signal and reload data when it changes
    // This handles navigation between different product IDs
    effect(() => {
      const productId = this.id();
      if (productId) {
        this.loadProductData(productId);
      }
    });
  }

  ngOnInit(): void {
    // Ensure account is set from route resolver (fallback)
    if (!this.account) {
      this.account = (this.route.snapshot.data['profile'] as Account | null) || null;
    }

    // Load initial product data from route params
    const initialId = this.route.snapshot.params['id'] || this.id();
    if (initialId) {
      this.loadProductData(initialId);
    }

    // Subscribe to route parameter changes to handle navigation between products
    // This is the primary mechanism to detect route parameter changes
    this.routeParamsSubscription = this.route.params.subscribe(params => {
      const routeId = params['id'];
      if (routeId) {
        this.loadProductData(routeId);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }

  private loadProductData(productId: string): void {
    // Simulate fetching data based on the ID
    // Since this is SSG, this logic runs DURING the build command
    this.productData.set({
      name: `Premium Gadget ${productId}`,
      description: `This is a high-quality description for product #${productId}.`
    });
  }
}
