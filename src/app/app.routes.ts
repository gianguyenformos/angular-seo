import { Routes } from '@angular/router';
import { SsrStockComponent } from './pages/ssr-stock/ssr-stock.component';
import { CsrDashboardComponent } from './pages/csr-dashboard/csr-dashboard.component';
import { SsgAboutComponent } from './pages/ssg-about/ssg-about.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';

export const routes: Routes = [
  { path: 'ssr', component: SsrStockComponent },
  { path: 'csr', component: CsrDashboardComponent },
  { path: 'ssg', component: SsgAboutComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  // { path: '', redirectTo: '/ssr', pathMatch: 'full' }, // Default page
  // { path: '**', redirectTo: '/ssr' } // Fallback
];
