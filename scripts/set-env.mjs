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
console.log(
  `Wrote environment.ts (apiUrl=${apiUrl}, clientSecret=${clientSecret ? '[set]' : '[empty]'}, ga=${gaMeasurementId || '[empty]'}, gsc=${googleSiteVerification ? '[set]' : '[empty]'})`,
);
