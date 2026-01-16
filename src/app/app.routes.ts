import { Routes, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { Account } from './core/auth/account.model';
import { AccountService } from './core/auth/account.service';
import { UserRouteAccessService } from './core/auth/user-route-access.service';

export const profileLoader: ResolveFn<Account | null> = (route, state) => {
  const accountService = inject(AccountService);
  return accountService.identity(true);
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'ssr',
    loadComponent: () => import('./pages/ssr-stock/ssr-stock.component').then(m => m.SsrStockComponent),
    canActivate: [UserRouteAccessService],
    resolve: { profile: profileLoader },
  },
  {
    path: 'csr',
    loadComponent: () => import('./pages/csr-dashboard/csr-dashboard.component').then(m => m.CsrDashboardComponent),
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'ssg',
    loadComponent: () => import('./pages/ssg-about/ssg-about.component').then(m => m.SsgAboutComponent)
  },
  { path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
    canActivate: [UserRouteAccessService],
    resolve: { profile: profileLoader },
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default page
  { path: '**', redirectTo: '/login' } // Fallback
];
