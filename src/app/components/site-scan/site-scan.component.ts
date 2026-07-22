import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ScanStateService } from '../../core/scan-state.service';
import { DownloadReportComponent } from '../download-report/download-report.component';

@Component({
  selector: 'cves-site-scan',
  standalone: true,
  imports: [FormsModule, DownloadReportComponent],
  templateUrl: './site-scan.component.html',
  styleUrl: './site-scan.component.scss',
})
export class SiteScanComponent {
  private readonly api = inject(ApiService);
  readonly state = inject(ScanStateService);

  /** Compact header when strip is collapsed — keep URL + scan reachable. */
  readonly compact = input(false);

  readonly url = signal('');
  readonly busy = signal(false);

  readonly inputId = computed(() =>
    this.compact() ? 'cves-site-url-compact' : 'cves-site-url',
  );

  readonly canDownload = computed(
    () =>
      this.state.siteEntered() &&
      !this.state.isExample() &&
      this.state.cves().length > 0,
  );

  constructor() {
    effect(() => {
      const site = this.state.siteUrl();
      if (site) {
        this.url.set(site);
        return;
      }
      // Cleared scan session — reset the input.
      if (!this.state.siteEntered()) {
        this.url.set('');
      }
    });
  }

  submit(): void {
    const value = this.url().trim();
    if (!value || this.busy()) return;
    this.busy.set(true);
    this.state.markSiteEntered();
    this.api.scanSiteUrl(value).subscribe({
      next: () => this.busy.set(false),
      error: () => this.busy.set(false),
    });
  }
}
