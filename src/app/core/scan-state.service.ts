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
  readonly osPicked = signal(false);
  readonly commandCopied = signal(false);
  readonly uploaded = signal(false);
  readonly cves = signal<CveItem[]>(EXAMPLE_CVES);
  readonly isExample = signal(true);
  readonly activeCveId = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly severityFilter = signal<Severity | 'ALL'>('ALL');
  readonly command = signal('');
  readonly hint = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly stripCollapsed = signal(false);
  readonly sidebarOpen = signal(false);

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

  /** 1-based current step; completed steps are indices < currentStep */
  readonly wizardStep = computed(() => {
    if (!this.osPicked()) return 1;
    if (!this.commandCopied()) return 2;
    if (!this.uploaded() && this.isExample()) return 3;
    if (!this.uploaded()) return 3;
    return 4;
  });

  setMode(mode: ScanMode): void {
    this.mode.set(mode);
  }

  setOs(os: ScanOs): void {
    this.os.set(os);
    this.osPicked.set(true);
  }

  markCommandCopied(): void {
    this.commandCopied.set(true);
  }

  setCommand(command: string, hint: string): void {
    this.command.set(command);
    this.hint.set(hint);
  }

  setResults(cves: CveItem[], example = false): void {
    this.cves.set(cves);
    this.isExample.set(example);
    // Catalog preview keeps uploaded=false; real scan sets uploaded=true
    this.uploaded.set(!example);
    this.selectedIds.set(new Set());
    this.closeSidebar();
  }

  openCve(id: string): void {
    this.activeCveId.set(id);
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.activeCveId.set(null);
    this.sidebarOpen.set(false);
  }

  toggleStrip(): void {
    this.stripCollapsed.update((v) => !v);
  }

  toggleSelect(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  toggleSelectAllFiltered(): void {
    const rows = this.filteredCves();
    const ids = this.selectedIds();
    const allSelected =
      rows.length > 0 && rows.every((c) => ids.has(c.cve_id));
    if (allSelected) {
      const next = new Set(ids);
      for (const row of rows) next.delete(row.cve_id);
      this.selectedIds.set(next);
      return;
    }
    const next = new Set(ids);
    for (const row of rows) next.add(row.cve_id);
    this.selectedIds.set(next);
  }

  isAllFilteredSelected(): boolean {
    const rows = this.filteredCves();
    if (!rows.length) return false;
    const ids = this.selectedIds();
    return rows.every((c) => ids.has(c.cve_id));
  }

  isSomeFilteredSelected(): boolean {
    const rows = this.filteredCves();
    const ids = this.selectedIds();
    const count = rows.filter((c) => ids.has(c.cve_id)).length;
    return count > 0 && count < rows.length;
  }

  selectActive(): void {
    const id = this.activeCveId();
    if (!id) return;
    const next = new Set(this.selectedIds());
    next.add(id);
    this.selectedIds.set(next);
  }
}
