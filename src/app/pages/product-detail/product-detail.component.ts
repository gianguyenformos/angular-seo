import { Component, input, OnInit, signal } from '@angular/core';

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
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  // This matches the ':id' in your route path
  id = input.required<string>();
  productData = signal<any>(null);

  ngOnInit() {
    // Simulate fetching data based on the ID
    // Since this is SSG, this logic runs DURING the build command
    this.productData.set({
      name: `Premium Gadget ${this.id()}`,
      description: `This is a high-quality description for product #${this.id()}.`
    });
  }
}
