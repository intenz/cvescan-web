import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { LiveFeedId, LiveFeedStatus } from './live-feeds';
import {
  EXAMPLE_CVES,
  type CveItem,
  type ScanMode,
  type ScanOs,
  type Severity,
} from './models';
import { normalizeOsForMode } from './normalize-os';
import { modeInfo } from './seo-content';

const PREFS_KEY = 'cves-scan-prefs';
const MODES: ScanMode[] = ['local', 'browser', 'network'];
const OSES: ScanOs[] = ['macos', 'linux', 'windows', 'iphone', 'android'];

type ScanPrefs = {
  mode?: ScanMode;
  os?: ScanOs;
};

function sortByPublishedDesc(cves: CveItem[]): CveItem[] {
  return [...cves].sort((a, b) =>
    (b.published ?? '').localeCompare(a.published ?? ''),
  );
}

@Injectable({ providedIn: 'root' })
export class ScanStateService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly mode = signal<ScanMode>('local');
  readonly os = signal<ScanOs>('macos');
  readonly osPicked = signal(false);
  readonly commandCopied = signal(false);
  readonly uploaded = signal(false);
  readonly siteEntered = signal(false);
  readonly siteUrl = signal('');
  readonly detectedStack = signal<Array<{ name: string; version?: string }>>([]);
  readonly cves = signal<CveItem[]>(EXAMPLE_CVES);
  readonly isExample = signal(true);
  /** Total rows in catalog (server-side). For scan results = filtered length. */
  readonly catalogTotal = signal(0);
  readonly activeCveId = signal<string | null>(null);
  /** Selected CVE rows by id — survives catalog page changes. */
  private readonly selectedMap = signal<Map<string, CveItem>>(new Map());
  readonly selectedIds = computed(() => new Set(this.selectedMap().keys()));
  readonly severityFilter = signal<Severity | 'ALL'>('ALL');
  /** When true, show only CVEs with patch_available === true (update available). */
  readonly patchOnlyFilter = signal(false);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly command = signal('');
  readonly hint = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly stripCollapsed = signal(false);
  readonly sidebarOpen = signal(false);
  /** ISO timestamps per feed — populated from API when available. */
  readonly feedLastUpdated = signal<Partial<Record<LiveFeedId, string | null>>>({});

  /** Active catalog/scan search (empty = no search). */
  readonly searchQuery = signal('');
  /** Visible search box value (may differ briefly while typing a short query). */
  readonly searchInput = signal('');
  readonly searchHits = signal<CveItem[]>([]);
  readonly searchMatchedBy = signal<'cve_id' | 'product' | 'description' | 'none' | null>(
    null,
  );
  readonly searchCapped = signal(false);
  /** Tracked/patch list hard-capped at 100 (catalog API or scan client). */
  readonly patchCapped = signal(false);

  readonly searchActive = computed(() => {
    const q = this.searchQuery().trim();
    if (!q) return false;
    if (/^cve-?\d{0,4}-?\d*$/i.test(q.replace(/\s+/g, ''))) return true;
    return q.length >= 2;
  });

  /** When true, pagination is fetched from API (catalog preview). */
  readonly serverPaging = computed(
    () => this.isExample() && !this.searchActive(),
  );

  readonly activeCve = computed(() => {
    const id = this.activeCveId();
    const pool = this.searchActive() ? this.searchHits() : this.cves();
    return pool.find((c) => c.cve_id === id) ?? null;
  });

  /**
   * Scan results are sorted once in setResults; filter only.
   * Catalog preview is already one server page.
   * Search hits are capped server/client-side (max 50).
   * Patch/tracked hits are capped at 100 (then table shows 10/page).
   */
  readonly filteredCves = computed(() => {
    const filter = this.severityFilter();
    const patchOnly = this.patchOnlyFilter();
    let rows = this.searchActive() ? this.searchHits() : this.cves();
    if (!this.serverPaging() && filter !== 'ALL') {
      rows = rows.filter((c) => c.severity === filter);
    }
    // 🔥 Patch = update available (patch_available === true), capped at 100.
    // Catalog without search uses ?tracked=1 (server already keeps patch yes).
    if (patchOnly && !this.serverPaging()) {
      rows = rows
        .filter((c) => c.patch_available === true)
        .slice(0, 100);
    }
    return rows;
  });

  readonly patchListCapped = computed(() => {
    if (!this.patchOnlyFilter()) return false;
    if (this.serverPaging()) return this.patchCapped();
    // Recompute uncapped length for scan/search
    const filter = this.severityFilter();
    let rows = this.searchActive() ? this.searchHits() : this.cves();
    if (filter !== 'ALL') {
      rows = rows.filter((c) => c.severity === filter);
    }
    return rows.filter((c) => c.patch_available === true).length > 100;
  });

  readonly totalCount = computed(() =>
    this.serverPaging() ? this.catalogTotal() : this.filteredCves().length,
  );

  readonly totalPages = computed(() => {
    const n = this.totalCount();
    return Math.max(1, Math.ceil(n / this.pageSize));
  });

  readonly pagedCves = computed(() => {
    if (this.serverPaging()) {
      return this.cves();
    }
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredCves().slice(start, start + this.pageSize);
  });

  readonly selectedCves = computed(() => [...this.selectedMap().values()]);

  /** 1-based current step; completed steps are indices < currentStep */
  readonly wizardStep = computed(() => {
    if (this.mode() === 'browser') {
      if (!this.siteEntered()) return 1;
      if (!this.uploaded() && this.isExample()) return 2;
      if (!this.uploaded()) return 2;
      return 3;
    }
    if (!this.osPicked()) return 1;
    if (!this.commandCopied()) return 2;
    if (!this.uploaded() && this.isExample()) return 3;
    if (!this.uploaded()) return 3;
    return 4;
  });

  /** Restore last active mode/OS from localStorage. Returns what was restored. */
  restorePrefs(): { mode: boolean; os: boolean } {
    const restored = { mode: false, os: false };
    if (!isPlatformBrowser(this.platformId)) return restored;
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return restored;
      const data = JSON.parse(raw) as ScanPrefs;
      if (data.mode && MODES.includes(data.mode) && modeInfo(data.mode).available) {
        this.mode.set(data.mode);
        restored.mode = true;
      }
      if (data.os && OSES.includes(data.os)) {
        this.os.set(normalizeOsForMode(this.mode(), data.os));
        restored.os = true;
      }
    } catch {
      /* ignore bad prefs */
    }
    return restored;
  }

  setMode(mode: ScanMode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.commandCopied.set(false);
    this.os.set(normalizeOsForMode(mode, this.os()));
    if (mode === 'browser') {
      this.siteEntered.set(false);
      this.siteUrl.set('');
      this.detectedStack.set([]);
      this.uploaded.set(false);
    }
    this.persistPrefs();
  }

  markSiteEntered(): void {
    this.siteEntered.set(true);
  }

  setSiteResults(
    cves: CveItem[],
    url: string,
    detected: Array<{ name: string; version?: string }>,
  ): void {
    this.siteUrl.set(url);
    this.detectedStack.set(detected);
    this.setResults(cves, false);
  }

  setOs(os: ScanOs): void {
    this.os.set(os);
    this.osPicked.set(true);
    this.persistPrefs();
  }

  private persistPrefs(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const payload: ScanPrefs = {
      mode: this.mode(),
      os: this.os(),
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(payload));
  }

  markCommandCopied(): void {
    this.commandCopied.set(true);
  }

  setCommand(command: string, hint: string): void {
    this.command.set(command);
    this.hint.set(hint);
  }

  setCatalogPage(
    cves: CveItem[],
    total: number,
    page: number,
    capped = false,
  ): void {
    this.clearSearch();
    this.cves.set(cves);
    this.catalogTotal.set(total);
    this.isExample.set(true);
    this.uploaded.set(false);
    this.patchCapped.set(capped);
    this.page.set(page);
    this.closeSidebar();
  }

  setResults(cves: CveItem[], example = false): void {
    this.resetListFilters();
    this.cves.set(example ? cves : sortByPublishedDesc(cves));
    this.isExample.set(example);
    this.uploaded.set(!example);
    this.catalogTotal.set(example ? cves.length : 0);
    this.clearSelection();
    this.closeSidebar();
  }

  clearSelection(): void {
    this.selectedMap.set(new Map());
  }

  /** Severity ALL, Patch off, search cleared — used after upload / new scan results. */
  resetListFilters(): void {
    this.clearSearch();
    this.searchInput.set('');
    this.severityFilter.set('ALL');
    this.patchOnlyFilter.set(false);
    this.patchCapped.set(false);
    this.page.set(1);
  }

  setSearchResults(
    q: string,
    cves: CveItem[],
    matchedBy: 'cve_id' | 'product' | 'description' | 'none',
    capped: boolean,
  ): void {
    this.searchQuery.set(q);
    this.searchInput.set(q);
    this.searchHits.set(cves);
    this.searchMatchedBy.set(matchedBy);
    this.searchCapped.set(capped);
    this.page.set(1);
    this.closeSidebar();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchHits.set([]);
    this.searchMatchedBy.set(null);
    this.searchCapped.set(false);
  }

  setSeverityFilter(filter: Severity | 'ALL'): void {
    this.severityFilter.set(filter);
    this.page.set(1);
  }

  togglePatchOnlyFilter(): void {
    this.patchOnlyFilter.update((v) => !v);
    if (!this.patchOnlyFilter()) {
      this.patchCapped.set(false);
    }
    this.page.set(1);
  }

  setPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    this.page.set(clamped);
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

  private findCve(id: string): CveItem | null {
    const pool = this.searchActive() ? this.searchHits() : this.cves();
    return pool.find((c) => c.cve_id === id) ?? this.selectedMap().get(id) ?? null;
  }

  toggleSelect(id: string): void {
    const next = new Map(this.selectedMap());
    if (next.has(id)) {
      next.delete(id);
    } else {
      const cve = this.findCve(id);
      if (!cve) return;
      next.set(id, cve);
    }
    this.selectedMap.set(next);
  }

  toggleSelectAllFiltered(): void {
    const rows = this.pagedCves();
    const map = this.selectedMap();
    const allSelected =
      rows.length > 0 && rows.every((c) => map.has(c.cve_id));
    const next = new Map(map);
    if (allSelected) {
      for (const row of rows) next.delete(row.cve_id);
    } else {
      for (const row of rows) next.set(row.cve_id, row);
    }
    this.selectedMap.set(next);
  }

  isAllFilteredSelected(): boolean {
    const rows = this.pagedCves();
    if (!rows.length) return false;
    const map = this.selectedMap();
    return rows.every((c) => map.has(c.cve_id));
  }

  isSomeFilteredSelected(): boolean {
    const rows = this.pagedCves();
    const map = this.selectedMap();
    const count = rows.filter((c) => map.has(c.cve_id)).length;
    return count > 0 && count < rows.length;
  }

  selectActive(): void {
    const id = this.activeCveId();
    if (!id) return;
    const cve = this.findCve(id);
    if (!cve) return;
    const next = new Map(this.selectedMap());
    next.set(id, cve);
    this.selectedMap.set(next);
  }

  setFeedStatus(feeds: LiveFeedStatus[]): void {
    if (!feeds.length) return;
    const next = { ...this.feedLastUpdated() };
    for (const feed of feeds) {
      next[feed.id] = feed.lastUpdated;
    }
    this.feedLastUpdated.set(next);
  }
}
