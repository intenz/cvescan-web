import { Injectable, signal } from '@angular/core';
import {
  hasRemediationCommands,
  uniqueRemediations,
  type CveItem,
  type RemediationPayload,
} from './models';

@Injectable({ providedIn: 'root' })
export class RemediationUiService {
  readonly open = signal(false);
  readonly items = signal<RemediationPayload[]>([]);

  show(cves: CveItem[]): void {
    const items = uniqueRemediations(cves).filter(hasRemediationCommands);
    if (!items.length) return;
    this.items.set(items);
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }
}
