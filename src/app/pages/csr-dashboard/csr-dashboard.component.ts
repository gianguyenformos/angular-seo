import { Component, inject, OnInit, signal } from '@angular/core';
import { Account } from '../../core/auth/account.model';
import { Subject, takeUntil } from 'rxjs';
import { AccountService } from '../../core/auth/account.service';

@Component({
  selector: 'app-csr-dashboard',
  standalone: true,
  template: `
    <h1>👤 User Dashboard (CSR)</h1>
    @if (isLoading()) {
      <p>Loading your personal data...</p>
    } @else {
      <p>Welcome back! Your ID is: {{ userId() }}</p>
    }

    @if (account() !== null) {
      <div class="alert alert-success">
        @if (account(); as accountRef) {
          <span>You are logged in as user &quot;{{ accountRef.login }}&quot;.</span>
        }
      </div>
    }
  `
})
export class CsrDashboardComponent implements OnInit {
  userId = signal<string | null>(null);
  isLoading = signal(true);

  account = signal<Account | null>(null);

  private readonly accountService = inject(AccountService);

  ngOnInit() {
    // This runs ONLY in the browser
    setTimeout(() => {
      this.userId.set('USR-99DB');
      this.isLoading.set(false);
    }, 2000);


    this.accountService.identity().subscribe(account => {
      if (account) {
        this.account.set(account);
      }
    });
  }
}
