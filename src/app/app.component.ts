import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ThemeService } from './core/theme.service';
import { AnalyticsService } from './core/analytics.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly theme = inject(ThemeService);
  private readonly analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.theme.init();
    this.analytics.init();
  }
}
