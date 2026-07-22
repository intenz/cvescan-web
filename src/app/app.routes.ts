import { Routes } from '@angular/router';
import { ScanPageComponent } from './pages/scan-page/scan-page.component';
import type { ScanMode } from './core/models';

export const routes: Routes = [
  {
    path: '',
    component: ScanPageComponent,
    data: { mode: 'local' satisfies ScanMode },
  },
  {
    path: 'browser',
    component: ScanPageComponent,
    data: { mode: 'browser' satisfies ScanMode },
  },
  {
    path: 'network',
    component: ScanPageComponent,
    data: { mode: 'network' satisfies ScanMode },
  },
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
