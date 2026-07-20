import { Component, computed, inject } from '@angular/core';
import { BETA_SCAN_OS, SOON_SCAN_OS } from '../../core/detect-browser-os';
import type { ScanOs } from '../../core/models';
import { ScanStateService } from '../../core/scan-state.service';

type OsOption = {
  id: ScanOs;
  label: string;
  soon?: boolean;
  beta?: boolean;
  later?: boolean;
  title?: string;
};

const DESKTOP_OS: OsOption[] = [
  { id: 'macos', label: 'Mac OS' },
  { id: 'linux', label: 'Linux' },
  { id: 'windows', label: 'Windows' },
];

const MOBILE_OS: OsOption[] = [
  {
    id: 'iphone',
    label: 'iPhone',
    soon: SOON_SCAN_OS.has('iphone'),
    beta: BETA_SCAN_OS.has('iphone'),
    title: 'Works only from a MacBook with iPhone connected by USB',
  },
  {
    id: 'android',
    label: 'Android',
    soon: SOON_SCAN_OS.has('android'),
    later: true,
  },
];

@Component({
  selector: 'cves-os-tabs',
  standalone: true,
  templateUrl: './os-tabs.component.html',
  styleUrl: './os-tabs.component.scss',
})
export class OsTabsComponent {
  private readonly state = inject(ScanStateService);

  readonly os = this.state.os;
  /** iPhone / Android only in Local Programs. */
  readonly options = computed(() =>
    this.state.mode() === 'local' ? [...DESKTOP_OS, ...MOBILE_OS] : DESKTOP_OS,
  );

  select(os: ScanOs, soon?: boolean): void {
    if (soon) return;
    // Command reloads via scan-page effect watching mode/os.
    this.state.setOs(os);
  }
}
