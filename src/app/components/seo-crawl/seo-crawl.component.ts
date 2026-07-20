import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  HOW_IT_WORKS,
  HOME_SEO,
  SCAN_MODES,
  SEO_PRIVACY,
} from '../../core/seo-content';

/**
 * Crawlable SEO copy for the home page.
 * Visually hidden so the UI stays clean; still present in prerendered HTML.
 */
@Component({
  selector: 'cves-seo-crawl',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seo-crawl.component.html',
  styleUrl: './seo-crawl.component.scss',
})
export class SeoCrawlComponent {
  readonly home = HOME_SEO;
  readonly howItWorks = HOW_IT_WORKS;
  readonly modes = SCAN_MODES;
  readonly privacy = SEO_PRIVACY;
}
