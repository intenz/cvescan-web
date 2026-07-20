import { Component, inject } from '@angular/core';
import type { ScanOs } from '../../core/models';
import { ScanStateService } from '../../core/scan-state.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'cves-os-tabs',
  standalone: true,
  templateUrl: './os-tabs.component.html',
  styleUrl: './os-tabs.component.scss',
})
export class OsTabsComponent {
  private readonly state = inject(ScanStateService);
  private readonly api = inject(ApiService);

  readonly os = this.state.os;
  readonly options: { id: ScanOs; label: string; soon?: boolean }[] = [
    { id: 'macos', label: 'Mac OS' },
    { id: 'linux', label: 'Linux' },
    { id: 'windows', label: 'Windows' },
    { id: 'iphone', label: 'iPhone', soon: true },
    { id: 'android', label: 'Android', soon: true },
  ];

  select(os: ScanOs, soon?: boolean): void {
    if (soon) return;
    this.state.setOs(os);
    this.api.loadCommand(this.state.mode(), os);
  }
}
