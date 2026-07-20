import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { CveItem, ScanMode, ScanOs } from './models';
import { ScanStateService } from './scan-state.service';

interface CommandResponse {
  command: string;
  hint: string;
}

interface ScanResponse {
  cves: CveItem[];
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
            hint: 'Run the command, then upload scan_results.txt',
          }),
        ),
      )
      .subscribe((res) => this.state.setCommand(res.command, res.hint));
  }

  loadCatalog(): void {
    this.state.loading.set(true);
    this.http
      .get<ScanResponse>(`${this.base}/api/customer/catalog`, {
        headers: this.headers(),
      })
      .pipe(
        map((res) => res.cves ?? []),
        catchError(() => of([] as CveItem[])),
        tap({
          next: (cves) => {
            if (cves.length) {
              this.state.setResults(cves, true);
            }
            this.state.loading.set(false);
          },
          error: () => this.state.loading.set(false),
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
        'Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion | Out-File -Encoding utf8 scan_results.txt',
      iphone: 'ideviceinstaller -l > scan_results.txt',
      android: 'adb shell pm list packages -f > scan_results.txt',
    };
    return map[os];
  }
}
