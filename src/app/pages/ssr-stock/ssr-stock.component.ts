import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Account } from '../../core/auth/account.model';
import { UserDTO } from '../../core/auth/user.model';
import { ApplicationConfigService } from '../../core/config/application-config.service';

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

    <div class="users-section">
      <h2>Users List</h2>
      @if (loading()) {
        <p>Loading users...</p>
      } @else if (error()) {
        <div class="alert alert-danger">
          <span>Error loading users: {{ error() }}</span>
        </div>
      } @else {
        <ul class="users-list">
          @for (user of users(); track user.id) {
            <li>
              <strong>ID:</strong> {{ user.id }} - <strong>Login:</strong> {{ user.login }}
            </li>
          } @empty {
            <li>No users found</li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .price-card {
      font-size: 2rem;
      font-weight: bold;
      padding: 1rem;
      background-color: #f0f0f0;
      border-radius: 8px;
      margin: 1rem 0;
      text-align: center;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;

      &.alert-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      &.alert-danger {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
    }

    .users-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background-color: #f9f9f9;
      border-radius: 8px;

      h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #333;
      }

      .users-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background-color: white;
          border-radius: 4px;
          border-left: 3px solid #667eea;
          transition: transform 0.2s, box-shadow 0.2s;

          &:hover {
            transform: translateX(4px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          strong {
            color: #667eea;
          }
        }
      }
    }
  `]
})
export class SsrStockComponent implements OnInit {
  timestamp = new Date().toLocaleTimeString();
  price = signal(Math.floor(Math.random() * 1000));
  users = signal<UserDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly applicationConfigService = inject(ApplicationConfigService);

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

    // Fetch users from API
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.applicationConfigService.getEndpointFor('api/users');
    this.http.get<UserDTO[]>(endpoint).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load users');
        this.loading.set(false);
      }
    });
  }
}
