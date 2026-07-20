import { Injectable, computed, signal } from '@angular/core';
import {
  EXAMPLE_CVES,
  type CveItem,
  type ScanMode,
  type ScanOs,
  type Severity,
} from './models';

@Injectable({ providedIn: 'root' })
export class ScanStateService {
  readonly mode = signal<ScanMode>('local');
  readonly os = signal<ScanOs>('macos');
  readonly cves = signal<CveItem[]>(EXAMPLE_CVES);
  readonly isExample = signal(true);
  readonly activeCveId = signal<string | null>(EXAMPLE_CVES[0]?.cve_id ?? null);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly severityFilter = signal<Severity | 'ALL'>('ALL');
  readonly command = signal('');
  readonly hint = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeCve = computed(() => {
    const id = this.activeCveId();
    return this.cves().find((c) => c.cve_id === id) ?? null;
  });

  readonly filteredCves = computed(() => {
    const filter = this.severityFilter();
    if (filter === 'ALL') return this.cves();
    return this.cves().filter((c) => c.severity === filter);
  });

  readonly selectedCves = computed(() => {
    const ids = this.selectedIds();
    return this.cves().filter((c) => ids.has(c.cve_id));
  });

  setMode(mode: ScanMode): void {
    this.mode.set(mode);
  }

  setOs(os: ScanOs): void {
    this.os.set(os);
  }

  setCommand(command: string, hint: string): void {
    this.command.set(command);
    this.hint.set(hint);
  }

  setResults(cves: CveItem[], example = false): void {
    this.cves.set(cves);
    this.isExample.set(example);
    this.selectedIds.set(new Set());
    this.activeCveId.set(cves[0]?.cve_id ?? null);
  }

  toggleSelect(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  selectActive(): void {
    const id = this.activeCveId();
    if (!id) return;
    const next = new Set(this.selectedIds());
    next.add(id);
    this.selectedIds.set(next);
  }
}
