import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from '../../core/api.service';

const LIKE_KEY = 'cves-site-liked';
const VISIT_KEY = 'cves-site-visit-session';

@Component({
  selector: 'cves-copyright',
  standalone: true,
  templateUrl: './copyright.component.html',
  styleUrl: './copyright.component.scss',
})
export class CopyrightComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly year = 2026;
  readonly visits = signal(0);
  readonly likes = signal(0);
  readonly liked = signal(false);
  readonly likeBusy = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.liked.set(localStorage.getItem(LIKE_KEY) === '1');

    this.api.getEngagement().subscribe((stats) => {
      this.visits.set(stats.visits);
      this.likes.set(stats.likes);
    });

    // One visit per browser session — no user identity sent.
    if (!sessionStorage.getItem(VISIT_KEY)) {
      sessionStorage.setItem(VISIT_KEY, '1');
      this.api.recordVisit().subscribe((stats) => {
        this.visits.set(stats.visits);
        this.likes.set(stats.likes);
      });
    }
  }

  like(): void {
    if (this.liked() || this.likeBusy()) return;
    this.likeBusy.set(true);
    this.api.recordLike().subscribe({
      next: (stats) => {
        localStorage.setItem(LIKE_KEY, '1');
        this.liked.set(true);
        this.visits.set(stats.visits);
        this.likes.set(stats.likes);
        this.likeBusy.set(false);
      },
      error: () => this.likeBusy.set(false),
    });
  }

  formatCount(n: number): string {
    if (n < 1000) return String(n);
    if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `${Math.round(n / 1000)}k`;
  }
}
