import { writeFileSync } from 'node:fs';

const apiUrl = process.env.API_URL || 'https://api.cvescan.app';
const clientSecret = process.env.CVESCAN_CLIENT_SECRET || '';
const gaMeasurementId = process.env.GA_MEASUREMENT_ID || '';
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION || '';

const contents = `export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl)},
  clientSecret: ${JSON.stringify(clientSecret)},
  gaMeasurementId: ${JSON.stringify(gaMeasurementId)},
  googleSiteVerification: ${JSON.stringify(googleSiteVerification)},
};
`;

writeFileSync(new URL('../src/environments/environment.ts', import.meta.url), contents);

// Fresh lastmod on each production build — helps crawlers notice updates.
const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cvescan.app/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cvescan.app/faq</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://cvescan.app/external-api</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
`;
writeFileSync(new URL('../public/sitemap.xml', import.meta.url), sitemap);

console.log(
  `Wrote environment.ts (apiUrl=${apiUrl}, clientSecret=${clientSecret ? '[set]' : '[empty]'}, ga=${gaMeasurementId || '[empty]'}, gsc=${googleSiteVerification ? '[set]' : '[empty]'}, sitemap lastmod=${lastmod})`,
);
