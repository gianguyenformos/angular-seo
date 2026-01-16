import { Component, inject, input, OnInit, OnDestroy, signal, TransferState, PLATFORM_ID, makeStateKey } from '@angular/core';
import { Subscription } from 'rxjs';
import { Account } from '../../core/auth/account.model';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../shared/seo.service';
import { isPlatformBrowser } from '@angular/common';

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
  private readonly seoService = inject(SeoService);
  private readonly transfer = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  private routeParamsSubscription?: Subscription;

  account: Account | null = null;

  constructor() {
    // Initialize account from route resolver data
    // Resolver completes before component creation during SSR
    const profileData = this.route.snapshot.data['profile'];
    this.account = (profileData as Account | null) || null;
  }

  ngOnInit(): void {
    // Ensure account is set from route resolver (fallback)
    if (!this.account) {
      this.account = (this.route.snapshot.data['profile'] as Account | null) || null;
    }

    // Subscribe to route parameter changes to handle navigation between products
    // This subscription fires immediately with current params, so no need for separate initial load
    this.routeParamsSubscription = this.route.params.subscribe(params => {
      const routeId = params['id'] || this.id();
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
    const product = this.getProductData(productId);
    this.productData.set(product);

    this.seoService.setTitle(`${this.productData().name} — Buy Online`);
    this.seoService.setMeta(this.productData().description);
    this.seoService.setCanonical(`http://localhost:4200/product/${productId}`);
  }

  private getProductData(productId: string): any {
    const key = makeStateKey<any>('PRODUCT-' + productId);

    if (isPlatformBrowser(this.platformId) && this.transfer.hasKey(key)) {
      return this.transfer.get(key, null as any);
    }

    // Simulate fetching data based on the ID
    // Since this is SSG, this logic runs DURING the build command
    const productData = {
      name: `Premium Gadget ${productId}`,
      description: `This is a high-quality description for product #${productId}.`
    };

    this.transfer.set(key, productData);

    return productData;
  }
}
