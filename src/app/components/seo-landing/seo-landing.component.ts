import { Component } from '@angular/core';
import { FAQ_ITEMS, HOW_IT_WORKS, HOME_SEO, SCAN_MODES } from '../../core/seo-content';

@Component({
  selector: 'cves-seo-landing',
  standalone: true,
  templateUrl: './seo-landing.component.html',
  styleUrl: './seo-landing.component.scss',
})
export class SeoLandingComponent {
  readonly home = HOME_SEO;
  readonly howItWorks = HOW_IT_WORKS;
  readonly modes = SCAN_MODES;
  readonly faq = FAQ_ITEMS;
}
