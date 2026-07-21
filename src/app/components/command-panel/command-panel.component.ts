import { Component, computed, inject, signal } from '@angular/core';
import { copyText } from '../../core/copy-text';
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
  readonly copied = signal(false);
  readonly copyFailed = signal(false);

  readonly nmapDownloadUrl = computed(
    () => NMAP_DOWNLOAD[this.state.os()] ?? 'https://nmap.org/download.html',
  );

  readonly canCopy = computed(() => !!this.state.command().trim());

  async copy(): Promise<void> {
    const text = this.state.command().trim();
    if (!text) return;

    const ok = await copyText(text);
    if (!ok) {
      this.copyFailed.set(true);
      window.setTimeout(() => this.copyFailed.set(false), 2000);
      return;
    }

    this.state.markCommandCopied();
    this.copied.set(true);
    this.copyFailed.set(false);
    window.setTimeout(() => this.copied.set(false), 1500);
  }
}
