import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ScanStateService } from '../../core/scan-state.service';

@Component({
  selector: 'cves-site-scan',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './site-scan.component.html',
  styleUrl: './site-scan.component.scss',
})
export class SiteScanComponent {
  private readonly api = inject(ApiService);
  readonly state = inject(ScanStateService);

  readonly url = signal('');
  readonly busy = signal(false);

  submit(): void {
    const value = this.url().trim();
    if (!value || this.busy()) return;
    this.busy.set(true);
    this.state.markSiteEntered();
    this.api.scanSiteUrl(value).subscribe({
      next: () => this.busy.set(false),
      error: () => this.busy.set(false),
      complete: () => this.busy.set(false),
    });
  }
}
