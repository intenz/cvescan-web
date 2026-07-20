import { Component, computed, inject } from '@angular/core';
import { ScanStateService } from '../../core/scan-state.service';
import type { ScanOs } from '../../core/models';

const NMAP_DOWNLOAD: Record<ScanOs, string> = {
  windows: 'https://nmap.org/download.html#windows',
  macos: 'https://nmap.org/download.html#macosx',
  linux: 'https://nmap.org/download.html#linux-rpm',
  iphone: 'https://nmap.org/download.html',
  android: 'https://nmap.org/download.html',
};

@Component({
  selector: 'cves-command-panel',
  standalone: true,
  templateUrl: './command-panel.component.html',
  styleUrl: './command-panel.component.scss',
})
export class CommandPanelComponent {
  readonly state = inject(ScanStateService);
  copied = false;

  readonly nmapDownloadUrl = computed(
    () => NMAP_DOWNLOAD[this.state.os()] ?? 'https://nmap.org/download.html',
  );

  async copy(): Promise<void> {
    const text = this.state.command();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    this.state.markCommandCopied();
    this.copied = true;
    setTimeout(() => (this.copied = false), 1500);
  }
}
