import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private loaded = false;

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.loaded) return;

    const verification = environment.googleSiteVerification;
    if (verification) {
      let meta = this.document.querySelector<HTMLMetaElement>(
        'meta[name="google-site-verification"]',
      );
      if (!meta) {
        meta = this.document.createElement('meta');
        meta.name = 'google-site-verification';
        this.document.head.appendChild(meta);
      }
      meta.content = verification;
    }

    const gaId = environment.gaMeasurementId;
    if (!gaId || !environment.production) return;

    this.loaded = true;
    const win = this.document.defaultView;
    if (!win) return;

    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag(...args: unknown[]) {
      win.dataLayer?.push(args);
    };
    win.gtag('js', new Date());
    win.gtag('config', gaId);

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    this.document.head.appendChild(script);
  }
}
