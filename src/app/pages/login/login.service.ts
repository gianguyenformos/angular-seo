import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { Account } from '../../core/auth/account.model';
import { AccountService } from '../../core/auth/account.service';
import { AuthServerProvider } from '../../core/auth/auth-jwt.service';
import { Login } from './login.model';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly accountService = inject(AccountService);
  private readonly authServerProvider = inject(AuthServerProvider);
  private readonly router = inject(Router);

  login(credentials: Login): Observable<Account | null> {
    return this.authServerProvider.login(credentials).pipe(mergeMap(() => this.accountService.identity(true)));
  }

  logout(): void {
    // Check if user is already logged in before attempting logout
    if (this.accountService.isAuthenticated()) {
      this.authServerProvider.logout().subscribe({
        complete: () => {
          this.accountService.authenticate(null);
          this.router.navigate(['/login']);
        },
      });
    } else {
      // If not authenticated, just navigate to login page
      this.router.navigate(['/login']);
    }
  }
}
