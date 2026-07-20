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
  readonly page = signal(1);
  readonly pageSize = 10;
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

  /** Severity filter + newest published first */
  readonly filteredCves = computed(() => {
    const filter = this.severityFilter();
    const list =
      filter === 'ALL'
        ? [...this.cves()]
        : this.cves().filter((c) => c.severity === filter);
    return list.sort((a, b) =>
      (b.published ?? '').localeCompare(a.published ?? ''),
    );
  });

  readonly totalPages = computed(() => {
    const n = this.filteredCves().length;
    return Math.max(1, Math.ceil(n / this.pageSize));
  });

  readonly pagedCves = computed(() => {
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredCves().slice(start, start + this.pageSize);
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
    this.page.set(1);
    this.closeSidebar();
  }

  setSeverityFilter(filter: Severity | 'ALL'): void {
    this.severityFilter.set(filter);
    this.page.set(1);
  }

  setPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    this.page.set(clamped);
  }

  nextPage(): void {
    this.setPage(this.page() + 1);
  }

  prevPage(): void {
    this.setPage(this.page() - 1);
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
    const rows = this.pagedCves();
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
    const rows = this.pagedCves();
    if (!rows.length) return false;
    const ids = this.selectedIds();
    return rows.every((c) => ids.has(c.cve_id));
  }

  isSomeFilteredSelected(): boolean {
    const rows = this.pagedCves();
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
