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
    this.http
      .get<CommandResponse>(`${this.base}/api/customer/commands`, {
        params: { mode, os },
        headers: this.headers(),
      })
      .pipe(
        catchError(() =>
          of({
            command: this.fallbackCommand(os),
            hint: this.fallbackHint(os),
          }),
        ),
      )
      .subscribe((res) =>
        this.state.setCommand(res.command, this.withDeviceHint(os, res.hint)),
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

  private fallbackCommand(os: ScanOs): string {
    const map: Record<ScanOs, string> = {
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
    return map[os];
  }

  private fallbackHint(os: ScanOs): string {
    if (os === 'iphone' || os === 'android') {
      return 'Phone must be connected by USB. Then run the command and upload scan_results.txt';
    }
    return 'Run the command, then upload scan_results.txt';
  }

  private withDeviceHint(os: ScanOs, hint: string): string {
    if (os !== 'iphone' && os !== 'android') return hint;
    if (/connected by usb/i.test(hint)) return hint;
    return `Phone must be connected by USB. ${hint}`;
  }
}
