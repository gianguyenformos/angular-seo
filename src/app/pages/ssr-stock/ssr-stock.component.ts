import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-ssr-stock',
  standalone: true,
  template: `
    <h1>📈 Live Stock Price (SSR)</h1>
    <p>This price was fetched on the server at: {{ timestamp }}</p>
    <div class="price-card">\${{ price() }}</div>
  `
})
export class SsrStockComponent {
  timestamp = new Date().toLocaleTimeString();
  price = signal(Math.floor(Math.random() * 1000));
}
