import { Component, OnInit, inject, signal } from '@angular/core';
import { copyText } from '../../core/copy-text';
import {
  EXTERNAL_API_BASE,
  EXTERNAL_API_BENEFITS,
  EXTERNAL_API_ENDPOINTS,
  EXTERNAL_API_ERRORS,
  EXTERNAL_API_SITE,
  type ApiEndpointDoc,
  type CodeLang,
} from '../../core/external-api-docs';
import { EXTERNAL_API_SEO } from '../../core/seo-content';
import { SeoService, applyPageSeo } from '../../core/seo.service';

@Component({
  selector: 'cves-external-api-page',
  standalone: true,
  imports: [],
  templateUrl: './external-api-page.component.html',
  styleUrl: './external-api-page.component.scss',
})
export class ExternalApiPageComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly site = EXTERNAL_API_SITE;
  readonly base = EXTERNAL_API_BASE;
  readonly benefits = EXTERNAL_API_BENEFITS;
  readonly endpoints = EXTERNAL_API_ENDPOINTS;
  readonly errors = EXTERNAL_API_ERRORS;
  readonly exampleLang = signal<CodeLang>('curl');
  readonly copiedId = signal<string | null>(null);

  ngOnInit(): void {
    applyPageSeo(this.seo, EXTERNAL_API_SEO);
  }

  setLang(lang: CodeLang): void {
    this.exampleLang.set(lang);
  }

  exampleFor(ep: ApiEndpointDoc): string {
    const lang = this.exampleLang();
    return (
      ep.examples.find((e) => e.lang === lang)?.code ??
      ep.examples[0]?.code ??
      ''
    );
  }

  async copyExample(ep: ApiEndpointDoc): Promise<void> {
    const text = this.exampleFor(ep);
    if (!text) return;
    const ok = await copyText(text);
    if (!ok) return;
    this.copiedId.set(ep.id);
    window.setTimeout(() => {
      if (this.copiedId() === ep.id) this.copiedId.set(null);
    }, 1500);
  }
}
