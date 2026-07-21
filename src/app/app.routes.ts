import { Routes } from '@angular/router';
import { ScanPageComponent } from './pages/scan-page/scan-page.component';

export const routes: Routes = [
  { path: '', component: ScanPageComponent },
  {
    path: 'external-api',
    loadComponent: () =>
      import('./pages/external-api-page/external-api-page.component').then(
        (m) => m.ExternalApiPageComponent,
      ),
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./pages/faq-page/faq-page.component').then(
        (m) => m.FaqPageComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
