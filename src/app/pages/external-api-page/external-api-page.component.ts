import { Component, OnInit, inject } from '@angular/core';
import { CopyrightComponent } from '../../components/copyright/copyright.component';
import { SeoService } from '../../core/seo.service';
import { EXTERNAL_API_SEO } from '../../core/seo-content';

@Component({
  selector: 'cves-external-api-page',
  standalone: true,
  imports: [CopyrightComponent],
  templateUrl: './external-api-page.component.html',
  styleUrl: './external-api-page.component.scss',
})
export class ExternalApiPageComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      title: EXTERNAL_API_SEO.title,
      description: EXTERNAL_API_SEO.description,
      canonical: EXTERNAL_API_SEO.canonical,
    });
  }
}
