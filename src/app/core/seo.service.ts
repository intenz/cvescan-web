import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { HOME_SEO, SITE_NAME, SITE_URL } from './seo-content';

export interface PageSeo {
  title: string;
  description: string;
  canonical: string;
  jsonLd?: Record<string, unknown>[];
}

/** Apply SEO from a page content object (title/description/canonical + optional jsonLd). */
export function applyPageSeo(
  seo: SeoService,
  page: Pick<PageSeo, 'title' | 'description' | 'canonical'>,
  jsonLd?: Record<string, unknown>[],
): void {
  seo.apply({
    title: page.title,
    description: page.description,
    canonical: page.canonical,
    jsonLd,
  });
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: PageSeo): void {
    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: page.canonical });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:image', content: HOME_SEO.ogImage });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: page.title });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    this.meta.updateTag({ name: 'twitter:image', content: HOME_SEO.ogImage });
    this.setCanonical(page.canonical);
    if (page.jsonLd?.length) {
      this.setJsonLd(page.jsonLd);
    }
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url || SITE_URL);
  }

  private setJsonLd(blocks: Record<string, unknown>[]): void {
    this.document.querySelectorAll('script[data-cves-jsonld]').forEach((el) => el.remove());
    for (const block of blocks) {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-cves-jsonld', 'true');
      script.textContent = JSON.stringify(block);
      this.document.head.appendChild(script);
    }
  }
}
