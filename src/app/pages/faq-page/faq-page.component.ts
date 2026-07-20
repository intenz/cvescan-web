import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CopyrightComponent } from '../../components/copyright/copyright.component';
import { SeoService } from '../../core/seo.service';
import { FAQ_ITEMS, FAQ_SEO, faqPageJsonLd } from '../../core/seo-content';

@Component({
  selector: 'cves-faq-page',
  standalone: true,
  imports: [CopyrightComponent, RouterLink],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
})
export class FaqPageComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly page = FAQ_SEO;
  readonly faq = FAQ_ITEMS;

  ngOnInit(): void {
    this.seo.apply({
      title: FAQ_SEO.title,
      description: FAQ_SEO.description,
      canonical: FAQ_SEO.canonical,
      jsonLd: [faqPageJsonLd()],
    });
  }
}
