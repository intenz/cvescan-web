import { Component, inject } from '@angular/core';
import { ScanStateService } from '../../core/scan-state.service';

@Component({
  selector: 'cves-command-panel',
  standalone: true,
  templateUrl: './command-panel.component.html',
  styleUrl: './command-panel.component.scss',
})
export class CommandPanelComponent {
  readonly state = inject(ScanStateService);
  copied = false;

  async copy(): Promise<void> {
    const text = this.state.command();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    this.copied = true;
    setTimeout(() => (this.copied = false), 1500);
  }
}
