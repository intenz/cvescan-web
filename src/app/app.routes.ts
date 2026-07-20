import { Routes } from '@angular/router';
import { ScanPageComponent } from './pages/scan-page/scan-page.component';
import { ExternalApiPageComponent } from './pages/external-api-page/external-api-page.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';

export const routes: Routes = [
  { path: '', component: ScanPageComponent },
  { path: 'external-api', component: ExternalApiPageComponent },
  { path: 'faq', component: FaqPageComponent },
  { path: '**', redirectTo: '' },
];
