import { Component, OnInit, PLATFORM_ID, effect, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CopyrightComponent } from './components/copyright/copyright.component';
import { HeaderComponent } from './components/header/header.component';
import { ThemeService } from './core/theme.service';
import { AnalyticsService } from './core/analytics.service';
import { ApiService } from './core/api.service';
import { ScanStateService } from './core/scan-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CopyrightComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly theme = inject(ThemeService);
  private readonly analytics = inject(AnalyticsService);
  private readonly api = inject(ApiService);
  private readonly state = inject(ScanStateService);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    // Keep command text aligned with the active mode + OS tabs (header is global).
    effect(() => {
      const mode = this.state.mode();
      const os = this.state.os();
      if (!isPlatformBrowser(this.platformId)) return;
      this.api.loadCommand(mode, os);
    });
  }

  ngOnInit(): void {
    this.theme.init();
    this.analytics.init();
  }
}
