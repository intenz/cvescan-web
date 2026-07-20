export const LIVE_FEEDS = [
  'NVD LIVE',
  'VulnCheck LIVE',
  'CISA KEV LIVE',
] as const;

export const UPLOAD_STAGES = [
  'Reading file…',
  'Parsing inventory…',
  'Resolving CPE…',
  'Matching CVEs…',
  'Enriching KEV / VulnCheck…',
  'Ranking by severity…',
] as const;
