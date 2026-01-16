import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Account } from '../../core/auth/account.model';

@Component({
  selector: 'app-ssr-stock',
  standalone: true,
  template: `
    <h1>📈 Live Stock Price (SSR)</h1>
    <p>This price was fetched on the server at: {{ timestamp }}</p>
    <div class="price-card">\${{ price() }}</div>

    @if (account && account.login) {
      <div class="alert alert-success">
        <span>You are logged in as user &quot;{{ account.login }}&quot;.</span>
      </div>
    }
  `
})
export class SsrStockComponent implements OnInit {
  timestamp = new Date().toLocaleTimeString();
  price = signal(Math.floor(Math.random() * 1000));

  private readonly route = inject(ActivatedRoute);

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
  }
}
