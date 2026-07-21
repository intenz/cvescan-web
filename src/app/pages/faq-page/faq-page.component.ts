import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService, applyPageSeo } from '../../core/seo.service';
import { FAQ_ITEMS, FAQ_SEO, faqPageJsonLd } from '../../core/seo-content';

@Component({
  selector: 'cves-faq-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
})
export class FaqPageComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly page = FAQ_SEO;
  readonly faq = FAQ_ITEMS;

  ngOnInit(): void {
    applyPageSeo(this.seo, FAQ_SEO, [faqPageJsonLd()]);
  }
}
