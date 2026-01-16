import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../core/auth/account.service';
import { LoginService } from '../../pages/login/login.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <a routerLink="/" class="navbar-brand">Angular SEO</a>
        <ul class="navbar-nav">
          <li class="nav-item" *ngIf="!isAuthenticated()">
            <a routerLink="/login" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" class="nav-link">Login</a>
          </li>
          <li class="nav-item" *ngIf="isAuthenticated()">
            <a routerLink="/csr" routerLinkActive="active" class="nav-link">Dashboard (CSR)</a>
          </li>
          <li class="nav-item" *ngIf="isAuthenticated()">
            <a routerLink="/ssr" routerLinkActive="active" class="nav-link">Stock (SSR)</a>
          </li>
          <li class="nav-item" *ngIf="isAuthenticated()">
            <a routerLink="/product/101" routerLinkActive="active" class="nav-link">Product 101 (SSG)</a>
          </li>
          <li class="nav-item" *ngIf="isAuthenticated()">
            <a routerLink="/product/102" routerLinkActive="active" class="nav-link">Product 102 (SSG)</a>
          </li>
          <li class="nav-item" *ngIf="isAuthenticated()">
            <a routerLink="/product/103" routerLinkActive="active" class="nav-link">Product 103 (SSG)</a>
          </li>
          <li class="nav-item">
            <a routerLink="/ssg" routerLinkActive="active" class="nav-link">About (SSG)</a>
          </li>
          <li class="nav-item" *ngIf="isAuthenticated()">
            <a (click)="logout()" class="nav-link" style="cursor: pointer;">Logout</a>
          </li>
        </ul>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background-color: #333;
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .navbar-brand {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      text-decoration: none;
      transition: color 0.3s;
    }

    .navbar-brand:hover {
      color: #4CAF50;
    }

    .navbar-nav {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 1.5rem;
    }

    .nav-item {
      margin: 0;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.3s, color 0.3s;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-link.active {
      background-color: #4CAF50;
      color: white;
    }
  `]
})
export class NavbarComponent {
  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);

  isAuthenticated(): boolean {
    return this.accountService.isAuthenticated();
  }

  logout(): void {
    this.loginService.logout();
  }
}
