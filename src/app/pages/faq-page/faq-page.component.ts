import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DISCORD_FAQ_BODY,
  DISCORD_FAQ_CTA,
  DISCORD_FAQ_TITLE,
  DISCORD_INVITE_URL,
} from '../../core/community';
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
  readonly discordUrl = DISCORD_INVITE_URL;
  readonly discordTitle = DISCORD_FAQ_TITLE;
  readonly discordBody = DISCORD_FAQ_BODY;
  readonly discordCta = DISCORD_FAQ_CTA;

  ngOnInit(): void {
    applyPageSeo(this.seo, FAQ_SEO, [faqPageJsonLd()]);
  }
}
