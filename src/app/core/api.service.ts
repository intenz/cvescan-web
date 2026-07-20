import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
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
  /** Optional per-feed sync timestamps from catalog API. */
  feeds?: LiveFeedStatus[];
}

interface FeedsResponse {
  feeds: LiveFeedStatus[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly state = inject(ScanStateService);
  private readonly base = environment.apiUrl;

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'X-CVEScan-Client': environment.clientSecret,
    });
  }

  loadCommand(mode: ScanMode, os: ScanOs): void {
    if (mode === 'browser') {
      this.state.setCommand('', 'Enter a website URL to probe public stack signals');
      return;
    }
    this.http
      .get<CommandResponse>(`${this.base}/api/customer/commands`, {
        params: { mode, os },
        headers: this.headers(),
      })
      .pipe(
        catchError(() =>
          of({
            command: this.fallbackCommand(mode, os),
            hint: this.fallbackHint(mode, os),
          }),
        ),
      )
      .subscribe((res) =>
        this.state.setCommand(res.command, this.withDeviceHint(mode, os, res.hint)),
      );
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
    this.http
      .get<CatalogResponse>(`${this.base}/api/customer/catalog`, {
        params: {
          page: String(page),
          limit: String(this.state.pageSize),
          severity,
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
            feeds: [] as LiveFeedStatus[],
          }),
        ),
        tap({
          next: (res) => {
            this.state.setCatalogPage(
              res.cves ?? [],
              res.total ?? 0,
              res.page ?? page,
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
    if (this.state.isExample()) {
      this.loadCatalog(1, filter);
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

    const local: Record<ScanOs, string> = {
      macos:
        "system_profiler SPSoftwareDataType SPApplicationsDataType | grep -E 'Version|System Version|Location' > scan_results.txt",
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
