import { Component, computed, inject } from '@angular/core';
import { cveNeedsRemediation } from '../../core/models';
import { RemediationUiService } from '../../core/remediation-ui.service';
import { ScanStateService } from '../../core/scan-state.service';

@Component({
  selector: 'cves-selection-bar',
  standalone: true,
  templateUrl: './selection-bar.component.html',
  styleUrl: './selection-bar.component.scss',
})
export class SelectionBarComponent {
  readonly state = inject(ScanStateService);
  private readonly remUi = inject(RemediationUiService);

  readonly stats = computed(() => {
    const selected = this.state.selectedCves();
    const critical = selected.filter((c) => c.severity === 'CRITICAL').length;
    const high = selected.filter((c) => c.severity === 'HIGH').length;
    const scores = selected.map((c) => c.cvss).filter((n): n is number => n != null);
    const avg =
      scores.length === 0
        ? 0
        : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    return { count: selected.length, critical, high, avg };
  });

  readonly canRemediate = computed(() =>
    this.state.selectedCves().some(cveNeedsRemediation),
  );

  openRemediation(): void {
    this.remUi.show(this.state.selectedCves());
  }

  cancel(): void {
    this.state.clearSelection();
  }

  exportCsv(): void {
    const rows = this.state.selectedCves();
    if (!rows.length) return;
    const header = ['cve_id', 'severity', 'cvss', 'product', 'version', 'published'];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [r.cve_id, r.severity, r.cvss ?? '', r.product ?? '', r.version ?? '', r.published ?? '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cvescan-selected.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
