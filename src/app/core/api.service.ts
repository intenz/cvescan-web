import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap, timeout, type OperatorFunction } from 'rxjs';
import { environment } from '../../environments/environment';
import type { CveItem, ScanMode, ScanOs, Severity } from './models';
import type { LiveFeedStatus } from './live-feeds';
import { ScanStateService } from './scan-state.service';

interface CommandResponse {
  command: string;
  hint: string;
}

interface ScanResponse {
  cves: CveItem[];
}

interface SiteScanResponse {
  cves: CveItem[];
  url?: string;
  finalUrl?: string;
  detected?: Array<{ name: string; version?: string }>;
  meta?: { message?: string };
  error?: { message?: string };
}

interface CatalogResponse {
  cves: CveItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  capped?: boolean;
  /** @deprecated Feeds moved to GET /feeds — kept optional for older API builds. */
  feeds?: LiveFeedStatus[];
  meta?: {
    example?: boolean;
    cached?: boolean;
    tracked?: boolean;
    capped?: boolean;
    message?: string;
  };
}

interface CatalogSearchResponse {
  q: string;
  matchedBy: 'cve_id' | 'product' | 'description' | 'none';
  cves: CveItem[];
  total: number;
  capped: boolean;
}

interface FeedsResponse {
  feeds: LiveFeedStatus[];
}

interface EngagementResponse {
  visits: number;
  likes: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly state = inject(ScanStateService);
  private readonly base = environment.apiUrl;
  /** Bumps on every loadCommand so slower responses cannot overwrite a newer tab. */
  private commandReq = 0;

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'X-CVEScan-Client': environment.clientSecret,
    });
  }

  loadCommand(mode: ScanMode, os: ScanOs): void {
    const req = ++this.commandReq;
    if (mode === 'browser') {
      this.state.setCommand('', 'Enter a website URL to probe public stack signals');
      return;
    }
    // Show the correct mode/OS command immediately so Copy works while the API responds.
    this.state.setCommand(
      this.fallbackCommand(mode, os),
      this.withDeviceHint(mode, os, this.fallbackHint(mode, os)),
    );
    this.http
      .get<CommandResponse>(`${this.base}/api/customer/commands`, {
        params: { mode, os },
        headers: this.headers(),
      })
      .pipe(
        timeout({ first: 8_000 }),
        catchError(() =>
          of({
            command: this.fallbackCommand(mode, os),
            hint: this.fallbackHint(mode, os),
          }),
        ),
      )
      .subscribe((res) => {
        if (req !== this.commandReq) return;
        this.state.setCommand(
          res.command,
          this.withDeviceHint(mode, os, res.hint),
        );
      });
  }

  scanSiteUrl(url: string): Observable<SiteScanResponse> {
    this.state.loading.set(true);
    this.state.error.set(null);

    return this.http
      .post<SiteScanResponse>(
        `${this.base}/api/customer/scan-url`,
        { url },
        { headers: this.headers() },
      )
      .pipe(
        tap({
          next: (res) => {
            this.state.setSiteResults(
              res.cves ?? [],
              res.finalUrl ?? res.url ?? url,
              res.detected ?? [],
            );
            this.state.loading.set(false);
          },
          error: (err) => {
            this.state.loading.set(false);
            this.state.error.set(
              err?.error?.error?.message ??
                err?.error?.message ??
                'Site scan failed',
            );
          },
        }),
      );
  }

  loadCatalog(
    page = this.state.page(),
    severity: Severity | 'ALL' = this.state.severityFilter(),
  ): void {
    this.state.loading.set(true);
    const tracked = this.state.patchOnlyFilter();
    this.http
      .get<CatalogResponse>(`${this.base}/api/customer/catalog`, {
        params: {
          page: String(page),
          limit: String(this.state.pageSize),
          severity,
          ...(tracked ? { tracked: '1' } : {}),
        },
        headers: this.headers(),
      })
      .pipe(
        catchError(() =>
          of({
            cves: [] as CveItem[],
            total: 0,
            page: 1,
            limit: this.state.pageSize,
            totalPages: 1,
            capped: false,
            feeds: [] as LiveFeedStatus[],
            meta: {},
          }),
        ),
        tap({
          next: (res) => {
            this.state.setCatalogPage(
              res.cves ?? [],
              res.total ?? 0,
              res.page ?? page,
              Boolean(res.capped ?? res.meta?.capped),
            );
            if (res.feeds?.length) {
              this.state.setFeedStatus(res.feeds);
            }
            this.state.loading.set(false);
          },
          error: () => this.state.loading.set(false),
        }),
      )
      .subscribe();
  }

  goPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.state.totalPages());
    if (this.state.serverPaging()) {
      this.loadCatalog(clamped);
      return;
    }
    this.state.setPage(clamped);
  }

  setSeverity(filter: Severity | 'ALL'): void {
    this.state.setSeverityFilter(filter);
    if (this.state.searchActive()) return;
    if (this.state.isExample()) {
      this.loadCatalog(1, filter);
    }
  }

  /**
   * Cascaded search: catalog via API; after a real scan — filter in-memory matches.
   * Composes with severity + Patch filters (client-side on the hit list).
   */
  search(q: string): void {
    const trimmed = q.trim();
    const cveLike = /^cve-?\d{0,4}-?\d*$/i.test(trimmed.replace(/\s+/g, ''));
    if (!trimmed || (trimmed.length < 2 && !cveLike)) {
      this.clearSearch();
      return;
    }

    if (!this.state.isExample()) {
      // Prefer full scan pool (before patch/severity slice) so filters still compose.
      const { cves, matchedBy, capped } = filterLocalMatches(
        this.state.cves(),
        trimmed,
      );
      this.state.setSearchResults(trimmed, cves, matchedBy, capped);
      return;
    }

    this.state.loading.set(true);
    this.http
      .get<CatalogSearchResponse>(`${this.base}/api/customer/catalog/search`, {
        params: { q: trimmed },
        headers: this.headers(),
      })
      .pipe(
        catchError(() =>
          of({
            q: trimmed,
            matchedBy: 'none' as const,
            cves: [] as CveItem[],
            total: 0,
            capped: false,
          }),
        ),
        tap({
          next: (res) => {
            this.state.setSearchResults(
              res.q ?? trimmed,
              res.cves ?? [],
              res.matchedBy ?? 'none',
              Boolean(res.capped),
            );
            this.state.loading.set(false);
          },
          error: () => this.state.loading.set(false),
        }),
      )
      .subscribe();
  }

  clearSearch(): void {
    const wasSearching = this.state.searchActive();
    this.state.clearSearch();
    if (wasSearching && this.state.isExample()) {
      this.loadCatalog(1);
    }
  }

  /** Load NVD / VulnCheck / KEV sync timestamps when backend exposes them. */
  loadFeedStatus(): void {
    this.http
      .get<FeedsResponse>(`${this.base}/api/customer/feeds`, {
        headers: this.headers(),
      })
      .pipe(
        catchError(() => of({ feeds: [] as LiveFeedStatus[] })),
        tap((res) => {
          if (res.feeds?.length) {
            this.state.setFeedStatus(res.feeds);
          }
        }),
      )
      .subscribe();
  }

  getEngagement(): Observable<EngagementResponse> {
    return this.http
      .get<EngagementResponse>(`${this.base}/api/customer/engagement`, {
        headers: this.headers(),
      })
      .pipe(this.engagementFallback());
  }

  recordVisit(): Observable<EngagementResponse> {
    return this.http
      .post<EngagementResponse>(
        `${this.base}/api/customer/engagement/visit`,
        { action: 'visit' },
        { headers: this.headers() },
      )
      .pipe(this.engagementFallback());
  }

  /** Must not swallow errors — callers persist "liked" only on real success. */
  recordLike(): Observable<EngagementResponse> {
    return this.http.post<EngagementResponse>(
      `${this.base}/api/customer/engagement/like`,
      { action: 'like' },
      { headers: this.headers() },
    );
  }

  private engagementFallback(): OperatorFunction<
    EngagementResponse,
    EngagementResponse
  > {
    return catchError(() => of({ visits: 0, likes: 0 }));
  }

  uploadScan(file: File, mode: ScanMode, os: ScanOs): Observable<CveItem[]> {
    const body = new FormData();
    body.append('file', file);
    body.append('mode', mode);
    body.append('os', os);

    this.state.loading.set(true);
    this.state.error.set(null);

    return this.http
      .post<ScanResponse>(`${this.base}/api/customer/scan`, body, {
        headers: this.headers(),
      })
      .pipe(
        map((res) => res.cves ?? []),
        tap({
          next: (cves) => {
            this.state.setResults(cves, false);
            this.state.loading.set(false);
          },
          error: (err) => {
            this.state.loading.set(false);
            this.state.error.set(err?.error?.error?.message ?? 'Scan failed');
          },
        }),
      );
  }

  private fallbackCommand(mode: ScanMode, os: ScanOs): string {
    if (mode === 'browser') {
      const browser: Record<ScanOs, string> = {
        macos: [
          ': > scan_results.txt',
          'CHROME_SQL="SELECT url FROM urls WHERE last_visit_time > (strftime(\'%s\',\'now\',\'-7 days\') + 11644473600) * 1000000"',
          'for p in \\',
          '  "$HOME/Library/Application Support/Google/Chrome/Default/History" \\',
          '  "$HOME/Library/Application Support/Google/Chrome/Profile 1/History" \\',
          '  "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/Default/History" \\',
          '  "$HOME/Library/Application Support/Microsoft Edge/Default/History" \\',
          '  "$HOME/Library/Application Support/Arc/User Data/Default/History"; do',
          '  [ -f "$p" ] || continue',
          '  cp "$p" /tmp/cvescan_hist.db 2>/dev/null && sqlite3 /tmp/cvescan_hist.db "$CHROME_SQL" >> scan_results.txt 2>/dev/null',
          'done',
          'if [ -f "$HOME/Library/Safari/History.db" ]; then',
          '  cp "$HOME/Library/Safari/History.db" /tmp/cvescan_safari.db 2>/dev/null && sqlite3 /tmp/cvescan_safari.db "SELECT DISTINCT url FROM history_items WHERE id IN (SELECT history_item FROM history_visits WHERE visit_time > (strftime(\'%s\',\'now\',\'-7 days\') - 978307200))" >> scan_results.txt 2>/dev/null',
          'fi',
          'for p in "$HOME/Library/Application Support/Firefox/Profiles"/*.default*/places.sqlite; do',
          '  [ -f "$p" ] || continue',
          '  cp "$p" /tmp/cvescan_ff.db 2>/dev/null && sqlite3 /tmp/cvescan_ff.db "SELECT url FROM moz_places WHERE last_visit_date > (strftime(\'%s\',\'now\',\'-7 days\') * 1000000)" >> scan_results.txt 2>/dev/null',
          'done',
          'sort -u scan_results.txt -o scan_results.txt',
        ].join('\n'),
        linux: [
          ': > scan_results.txt',
          'CHROME_SQL="SELECT url FROM urls WHERE last_visit_time > (strftime(\'%s\',\'now\',\'-7 days\') + 11644473600) * 1000000"',
          'for p in \\',
          '  "$HOME/.config/google-chrome/Default/History" \\',
          '  "$HOME/.config/chromium/Default/History" \\',
          '  "$HOME/.config/BraveSoftware/Brave-Browser/Default/History" \\',
          '  "$HOME/.config/microsoft-edge/Default/History"; do',
          '  [ -f "$p" ] || continue',
          '  cp "$p" /tmp/cvescan_hist.db 2>/dev/null && sqlite3 /tmp/cvescan_hist.db "$CHROME_SQL" >> scan_results.txt 2>/dev/null',
          'done',
          'for p in "$HOME/.mozilla/firefox"/*.default*/places.sqlite; do',
          '  [ -f "$p" ] || continue',
          '  cp "$p" /tmp/cvescan_ff.db 2>/dev/null && sqlite3 /tmp/cvescan_ff.db "SELECT url FROM moz_places WHERE last_visit_date > (strftime(\'%s\',\'now\',\'-7 days\') * 1000000)" >> scan_results.txt 2>/dev/null',
          'done',
          'sort -u scan_results.txt -o scan_results.txt',
        ].join('\n'),
        windows: [
          '$out = Join-Path $env:USERPROFILE "scan_results.txt"',
          'Set-Content -Path $out -Value $null -Encoding utf8',
          '$sql = "SELECT url FROM urls WHERE last_visit_time > (strftime(\'%s\',\'now\',\'-7 days\') + 11644473600) * 1000000"',
          '$paths = @(',
          '  "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\History",',
          '  "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Profile 1\\History",',
          '  "$env:LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\User Data\\Default\\History",',
          '  "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\History"',
          ')',
          'foreach ($p in $paths) {',
          '  if (-not (Test-Path $p)) { continue }',
          '  $tmp = Join-Path $env:TEMP "cvescan_hist.db"',
          '  Copy-Item $p $tmp -Force',
          '  sqlite3 $tmp $sql | Add-Content -Path $out -Encoding utf8',
          '}',
          '$ffSql = "SELECT url FROM moz_places WHERE last_visit_date > (strftime(\'%s\',\'now\',\'-7 days\') * 1000000)"',
          'Get-ChildItem "$env:APPDATA\\Mozilla\\Firefox\\Profiles" -Filter places.sqlite -Recurse -ErrorAction SilentlyContinue | ForEach-Object {',
          '  $tmp = Join-Path $env:TEMP "cvescan_ff.db"',
          '  Copy-Item $_.FullName $tmp -Force',
          '  sqlite3 $tmp $ffSql | Add-Content -Path $out -Encoding utf8',
          '}',
          'if (Test-Path $out) { (Get-Content $out | Sort-Object -Unique) | Set-Content -Path $out -Encoding utf8 }',
        ].join('\n'),
        iphone: '# Browser mode is desktop-only',
        android: '# Browser mode is desktop-only',
      };
      return browser[os];
    }

    if (mode === 'network') {
      return 'nmap -sV -oX scan_results.xml localhost';
    }

    const local: Record<ScanOs, string> = {
      macos:
        "system_profiler SPSoftwareDataType SPApplicationsDataType | grep -E 'Version:|^    [^ ].*:$' > scan_results.txt",
      linux:
        "dpkg-query -W -f='${Package} ${Version}\\n' > scan_results.txt 2>/dev/null || rpm -qa > scan_results.txt",
      windows:
        'winget list --accept-source-agreements | Out-File -FilePath "$env:USERPROFILE\\scan_results.txt" -Encoding utf8',
      iphone:
        'brew install libimobiledevice ideviceinstaller 2>/dev/null; ideviceinstaller list --all > scan_results.txt',
      android: 'adb shell pm list packages -f > scan_results.txt',
    };
    return local[os];
  }

  private fallbackHint(mode: ScanMode, os: ScanOs): string {
    if (mode === 'browser') {
      return 'Quit browsers first if a DB is locked. Merges last 7 days from installed browsers → upload scan_results.txt';
    }
    if (mode === 'network') {
      return 'Requires nmap. Writes XML → upload scan_results.xml';
    }
    if (os === 'iphone') {
      return 'Beta — works only from a MacBook. Phone must be connected by USB. Then run the command and upload scan_results.txt';
    }
    if (os === 'android') {
      return 'Phone must be connected by USB. Then run the command and upload scan_results.txt';
    }
    return 'Run the command, then upload scan_results.txt';
  }

  private withDeviceHint(mode: ScanMode, os: ScanOs, hint: string): string {
    if (mode !== 'local') return hint;
    if (os === 'iphone') {
      if (/only from a macbook/i.test(hint)) return hint;
      return `Beta — works only from a MacBook. ${hint}`;
    }
    if (os === 'android') {
      if (/connected by usb/i.test(hint)) return hint;
      return `Phone must be connected by USB. ${hint}`;
    }
    return hint;
  }
}

const LOCAL_SEARCH_LIMIT = 50;

function looksLikeCveQuery(q: string): boolean {
  return /^cve-?\d{0,4}-?\d*$/i.test(q.trim().replace(/\s+/g, ''));
}

function filterLocalMatches(
  rows: CveItem[],
  q: string,
): {
  cves: CveItem[];
  matchedBy: 'cve_id' | 'product' | 'description' | 'none';
  capped: boolean;
} {
  const trimmed = q.trim();
  if (looksLikeCveQuery(trimmed)) {
    const prefix = trimmed.toUpperCase().replace(/\s+/g, '').replace(/^CVE(?!-)/, 'CVE-');
    const normalized = prefix === 'CVE' ? 'CVE-' : prefix;
    const hits = rows
      .filter((r) => r.cve_id.toUpperCase().startsWith(normalized))
      .slice(0, LOCAL_SEARCH_LIMIT);
    if (hits.length) {
      return {
        cves: hits,
        matchedBy: 'cve_id',
        capped: hits.length >= LOCAL_SEARCH_LIMIT,
      };
    }
  }

  const token = trimmed.toLowerCase();
  const byProduct = rows
    .filter((r) => (r.product ?? '').toLowerCase().includes(token))
    .slice(0, LOCAL_SEARCH_LIMIT);
  if (byProduct.length) {
    return {
      cves: byProduct,
      matchedBy: 'product',
      capped: byProduct.length >= LOCAL_SEARCH_LIMIT,
    };
  }

  const byDesc = rows
    .filter(
      (r) =>
        (r.title ?? '').toLowerCase().includes(token) ||
        (r.description ?? '').toLowerCase().includes(token),
    )
    .slice(0, LOCAL_SEARCH_LIMIT);
  return {
    cves: byDesc,
    matchedBy: byDesc.length ? 'description' : 'none',
    capped: byDesc.length >= LOCAL_SEARCH_LIMIT,
  };
}
