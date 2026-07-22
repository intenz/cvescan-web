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
  detected?: Array<{ name: string; version?: string; port?: string }>;
  detectedTotal?: number;
}

interface SiteScanResponse {
  cves: CveItem[];
  url?: string;
  finalUrl?: string;
  detected?: Array<{ name: string; version?: string }>;
  ips?: string[];
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

type SearchMatchedBy =
  | 'cve_id'
  | 'product'
  | 'version'
  | 'description'
  | 'date'
  | 'none';

interface CatalogSearchResponse {
  q: string;
  matchedBy: SearchMatchedBy;
  cves: CveItem[];
  total: number;
  capped: boolean;
}

interface FeedsResponse {
  feeds: LiveFeedStatus[];
  /** Max supported_targets.synced_at from support crawl. */
  supportSyncedAt?: string | null;
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
              res.ips ?? [],
            );
            this.state.loading.set(false);
          },
          error: (err) => {
            this.state.loading.set(false);
            this.state.error.set(
              this.scanLimitOr(
                err,
                err?.error?.error?.message ??
                  err?.error?.message ??
                  'Site scan failed',
              ),
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
    if (this.state.searchActive()) {
      // Re-run search so severity is applied server-side (before the hit cap).
      this.search(this.state.searchQuery());
      return;
    }
    if (this.state.isExample()) {
      this.loadCatalog(1, filter);
    }
  }

  /**
   * Cascaded search: catalog via API; after a real scan — filter in-memory matches.
   * Composes with severity + Patch filters (client-side on the hit list).
   */
  search(q: string): void {
    const trimmed = q.trim().replace(/\s+/g, ' ');
    const cveLike = /^cve-?\d{0,4}-?\d*$/i.test(trimmed.replace(/\s+/g, ''));

    // Empty → back to catalog. Short non-CVE while typing → keep current results
    // (do not clearSearch / reload catalog on a trailing space after 1 letter).
    if (!trimmed) {
      this.clearSearch();
      return;
    }
    if (trimmed.length < 2 && !cveLike) {
      return;
    }

    if (!this.state.isExample()) {
      const { cves, matchedBy, capped } = filterLocalMatches(
        this.state.cves(),
        trimmed,
      );
      this.state.setSearchResults(trimmed, cves, matchedBy, capped);
      return;
    }

    const requestQ = trimmed;
    this.state.loading.set(true);
    this.http
      .get<CatalogSearchResponse>(`${this.base}/api/customer/catalog/search`, {
        params: {
          q: trimmed,
          severity: this.state.severityFilter(),
        },
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
            // Ignore stale responses when the user kept typing (esp. with spaces).
            if (this.state.searchInput().trim().replace(/\s+/g, ' ') !== requestQ) {
              return;
            }
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
        catchError(() =>
          of({ feeds: [] as LiveFeedStatus[], supportSyncedAt: null }),
        ),
        tap((res) => {
          if (res.feeds?.length) {
            this.state.setFeedStatus(res.feeds);
          }
          this.state.setSupportSyncedAt(res.supportSyncedAt ?? null);
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
        map((res) => res),
        tap({
          next: (res) => {
            const cves = res.cves ?? [];
            if (mode === 'network' || mode === 'local') {
              this.state.setUploadResults(
                cves,
                res.detected ?? [],
                res.detectedTotal,
              );
            } else {
              this.state.detectedStack.set([]);
              this.state.detectedTotal.set(0);
              this.state.siteIps.set([]);
              this.state.setResults(cves, false);
            }
            this.state.loading.set(false);
          },
          error: (err) => {
            this.state.loading.set(false);
            this.state.error.set(
              this.scanLimitOr(err, err?.error?.error?.message ?? 'Scan failed'),
            );
          },
        }),
        map((res) => res.cves ?? []),
      );
  }

  /** Customer CSV report from already-matched scan results (not External API). */
  downloadScanReport(cves: CveItem[]): Observable<void> {
    const payload = {
      cves: cves.map((c) => ({
        cve_id: c.cve_id,
        title: c.title,
        severity: c.severity,
        cvss: c.cvss,
        product: c.product,
        version: c.version,
        published: c.published,
        kev: c.kev,
        patch_available: c.patch_available,
      })),
    };
    return this.http
      .post(`${this.base}/api/customer/report/csv`, payload, {
        headers: this.headers(),
        responseType: 'blob',
      })
      .pipe(
        tap((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'cvescan-report.csv';
          a.click();
          URL.revokeObjectURL(url);
        }),
        map(() => undefined),
        catchError((err) => {
          const msg = this.scanLimitOr(
            err,
            'Could not download scan report — try again',
          );
          this.state.error.set(msg);
          throw err;
        }),
      );
  }

  /** Shared copy when customer scan endpoints return HTTP 429. */
  private scanLimitOr(err: { status?: number } | null | undefined, fallback: string): string {
    if (err?.status === 429) {
      return 'Too many scans — try again in a minute';
    }
    return fallback;
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
      return 'nmap -sV -sC --top-ports 1000 -oX scan_results.xml 192.168.0.0/24';
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
      return 'Requires nmap. Replace 192.168.0.0/24 with your LAN (or a single host like 192.168.0.10). Only scan networks you own → upload scan_results.xml';
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

function isYearToken(t: string): boolean {
  return /^(19|20)\d{2}$/.test(t);
}

function isVersionToken(t: string): boolean {
  return /^\d+(\.\d+){0,5}$/.test(t) && !isYearToken(t);
}

function parseLocalSearchQuery(q: string): {
  productPhrase: string;
  version: string | null;
  year: string | null;
} {
  const phrase = q.trim().toLowerCase().replace(/\s+/g, ' ');
  const tokens = phrase.split(' ').filter(Boolean);
  const versionTokens = tokens.filter(isVersionToken);
  const yearTokens = tokens.filter(isYearToken);
  const productTokens = tokens.filter(
    (t) => t.length >= 2 && !isVersionToken(t) && !isYearToken(t),
  );
  return {
    productPhrase: productTokens.join(' '),
    version:
      versionTokens.sort((a, b) => b.length - a.length || b.localeCompare(a))[0] ??
      null,
    year: yearTokens[0] ?? null,
  };
}

function versionFieldMatches(row: CveItem, version: string): boolean {
  const v = version.toLowerCase();
  return (
    (row.version ?? '').toLowerCase().includes(v) ||
    (row.title ?? '').toLowerCase().includes(v) ||
    (row.description ?? '').toLowerCase().includes(v)
  );
}

function publishedInYear(row: CveItem, year: string): boolean {
  const published = row.published ?? '';
  return published.startsWith(year);
}

function filterLocalMatches(
  rows: CveItem[],
  q: string,
): {
  cves: CveItem[];
  matchedBy: SearchMatchedBy;
  capped: boolean;
} {
  const trimmed = q.trim().replace(/\s+/g, ' ');
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

  const parsed = parseLocalSearchQuery(trimmed);

  if (parsed.productPhrase) {
    const byProduct = rows
      .filter((r) => {
        if (!productFieldMatches(r.product ?? '', parsed.productPhrase)) return false;
        if (parsed.version && !versionFieldMatches(r, parsed.version)) return false;
        if (parsed.year && !publishedInYear(r, parsed.year)) return false;
        return true;
      })
      .slice(0, LOCAL_SEARCH_LIMIT);
    if (byProduct.length) {
      return {
        cves: byProduct,
        matchedBy: parsed.version ? 'version' : 'product',
        capped: byProduct.length >= LOCAL_SEARCH_LIMIT,
      };
    }
  }

  if (parsed.version && !parsed.productPhrase) {
    const byVersion = rows
      .filter((r) => versionFieldMatches(r, parsed.version!))
      .slice(0, LOCAL_SEARCH_LIMIT);
    if (byVersion.length) {
      return {
        cves: byVersion,
        matchedBy: 'version',
        capped: byVersion.length >= LOCAL_SEARCH_LIMIT,
      };
    }
  }

  const yearOnly =
    Boolean(parsed.year) && !parsed.productPhrase && !parsed.version;

  if (yearOnly && parsed.year) {
    const byDate = rows
      .filter((r) => publishedInYear(r, parsed.year!))
      .slice(0, LOCAL_SEARCH_LIMIT);
    if (byDate.length) {
      return {
        cves: byDate,
        matchedBy: 'date',
        capped: byDate.length >= LOCAL_SEARCH_LIMIT,
      };
    }
  }

  const phrase = trimmed.toLowerCase();
  const byDesc = rows
    .filter(
      (r) =>
        (r.title ?? '').toLowerCase().includes(phrase) ||
        (r.description ?? '').toLowerCase().includes(phrase),
    )
    .slice(0, LOCAL_SEARCH_LIMIT);
  return {
    cves: byDesc,
    matchedBy: byDesc.length ? 'description' : 'none',
    capped: byDesc.length >= LOCAL_SEARCH_LIMIT,
  };
}

/** Match "google chrome" against product "chrome" / "google_chrome". */
function productFieldMatches(product: string, q: string): boolean {
  const p = product.toLowerCase();
  if (!p) return false;
  const phrase = q.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!phrase) return false;
  if (p.includes(phrase)) return true;
  if (p.includes(phrase.replace(/\s+/g, '_'))) return true;
  const tokens = phrase.split(' ').filter((t) => t.length >= 2);
  if (!tokens.length) return false;
  // Multi-word: any meaningful token is enough (chrome in "google chrome").
  if (tokens.length > 1) {
    return tokens.some((t) => t.length >= 3 && p.includes(t));
  }
  return p.includes(tokens[0]!);
}
