import { Routes, ResolveFn } from '@angular/router';
import { SsrStockComponent } from './pages/ssr-stock/ssr-stock.component';
import { CsrDashboardComponent } from './pages/csr-dashboard/csr-dashboard.component';
import { SsgAboutComponent } from './pages/ssg-about/ssg-about.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import LoginComponent from './pages/login/login.component';
import { inject } from '@angular/core';
import { Account } from './core/auth/account.model';
import { AccountService } from './core/auth/account.service';
import { UserRouteAccessService } from './core/auth/user-route-access.service';

export const profileLoader: ResolveFn<Account | null> = (route, state) => {
  const accountService = inject(AccountService);
  return accountService.identity(true);
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'ssr',
    component: SsrStockComponent,
    resolve: { profile: profileLoader },
    canActivate: [UserRouteAccessService],
  },
  { path: 'csr', component: CsrDashboardComponent, canActivate: [UserRouteAccessService], },
  { path: 'ssg', component: SsgAboutComponent },
  { path: 'product/:id',
    component: ProductDetailComponent,
    resolve: { profile: profileLoader },
    canActivate: [UserRouteAccessService],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default page
  { path: '**', redirectTo: '/login' } // Fallback
];
