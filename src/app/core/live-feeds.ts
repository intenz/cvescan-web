export type LiveFeedId = 'nvd' | 'vulncheck' | 'kev';

export interface LiveFeedDefinition {
  id: LiveFeedId;
  label: string;
  description: string;
}

export interface LiveFeedStatus {
  id: LiveFeedId;
  /** ISO-8601 from API when available. */
  lastUpdated: string | null;
}

export const LIVE_FEED_DEFINITIONS: LiveFeedDefinition[] = [
  {
    id: 'nvd',
    label: 'NVD LIVE',
    description: 'National Vulnerability Database — primary CVE catalog.',
  },
  {
    id: 'vulncheck',
    label: 'VulnCheck LIVE',
    description: 'VulnCheck enrichment — exploit context and priority signals.',
  },
  {
    id: 'kev',
    label: 'CISA KEV LIVE',
    description: 'CISA Known Exploited Vulnerabilities — confirmed in-the-wild exploitation.',
  },
];

/** @deprecated use LIVE_FEED_DEFINITIONS */
export const LIVE_FEEDS = LIVE_FEED_DEFINITIONS.map((f) => f.label);

export function formatFeedUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return 'Last updated: pending sync';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Last updated: pending sync';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Last updated: just now';
  if (diffMin < 60) return `Last updated: ${diffMin} min ago`;
  if (diffHr < 24) return `Last updated: ${diffHr} h ago`;
  if (diffDay < 7) return `Last updated: ${diffDay} d ago`;

  return `Last updated: ${date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}`;
}

export function liveFeedTooltip(
  feed: LiveFeedDefinition,
  lastUpdated: string | null | undefined,
): string {
  return `${feed.description} ${formatFeedUpdatedAt(lastUpdated)}`;
}
