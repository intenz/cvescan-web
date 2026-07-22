import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { ScanStateService } from '../../core/scan-state.service';

@Component({
  selector: 'cves-download-report',
  standalone: true,
  template: `
    <button
      type="button"
      class="cves-download-report"
      [title]="title()"
      [disabled]="busy() || !cveCount()"
      (click)="download()"
    >
      {{ label() }}
    </button>
  `,
  styles: `
    .cves-download-report {
      flex-shrink: 0;
      margin: 0;
      padding: 0.65rem 1rem;
      border: 1px solid var(--cves-amber);
      border-radius: 6px;
      background: var(--cves-amber);
      color: #1a1200;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        color 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;

      &:hover:not(:disabled) {
        border-color: var(--cves-amber);
        color: #1a1200;
        background: color-mix(in srgb, var(--cves-amber) 88%, #fff);
        box-shadow: 0 4px 14px var(--cves-amber-dim);
        transform: translateY(-1px);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
    }
  `,
})
export class DownloadReportComponent {
  private readonly api = inject(ApiService);
  private readonly state = inject(ScanStateService);
  readonly busy = signal(false);

  readonly cveCount = computed(() => this.state.cves().length);

  readonly label = computed(() => {
    if (this.busy()) return 'Preparing…';
    const n = this.cveCount();
    return n ? `Download report (${n} CVEs)` : 'Download report';
  });

  readonly title = computed(() => {
    const n = this.cveCount();
    return n
      ? `Download CSV with all ${n} matched CVEs`
      : 'Download CSV report with matched CVEs';
  });

  download(): void {
    const rows = this.state.cves();
    if (!rows.length || this.busy()) return;
    this.busy.set(true);
    this.api.downloadScanReport(rows).subscribe({
      next: () => this.busy.set(false),
      error: () => this.busy.set(false),
    });
  }
}
