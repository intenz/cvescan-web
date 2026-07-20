import type { ScanMode } from './models';

export const SITE_URL = 'https://cvescan.app';
export const SITE_NAME = 'CVEScan';

export interface ScanModeInfo {
  id: ScanMode;
  label: string;
  description: string;
  available: boolean;
}

export const SCAN_MODES: ScanModeInfo[] = [
  {
    id: 'local',
    label: 'Local Programs',
    description:
      'Scans installed software and maps CPE → CVE to surface known vulnerabilities.',
    available: true,
  },
  {
    id: 'browser',
    label: 'Browser',
    description:
      'Scans the last week of browser history and flags vulnerable sites.',
    available: false,
  },
  {
    id: 'network',
    label: 'Network',
    description:
      'Scans the host/network with nmap to find exposed services and related risks.',
    available: false,
  },
];

export function modeInfo(mode: ScanMode): ScanModeInfo {
  return SCAN_MODES.find((m) => m.id === mode) ?? SCAN_MODES[0];
}

export const HOME_SEO = {
  title: 'CVEScan — Runtime CVE Scanner | CPE → CVE for Installed Software',
  description:
    'Runtime CVE scanner: paste OS command output, match installed software via CPE → CVE against NVD. Find unpatched CVEs on macOS, Linux, and Windows — no client data stored. Browser & Network scans coming soon.',
  canonical: `${SITE_URL}/`,
  ogImage: `${SITE_URL}/og-image.png`,
  h1: 'Runtime CVE scanner for installed software',
  lead:
    'Paste OS command output and get NVD-matched CVEs in real time. CVEScan maps your software inventory through CPE → CVE so you can find unpatched vulnerabilities — without storing client scan data.',
};

export const EXTERNAL_API_SEO = {
  title: 'CVEScan External API — Commercial CPE → CVE Matching',
  description:
    'Commercial CPE to CVE matching API for integrations. Map software inventories to NVD vulnerabilities with CVSS severity — privacy-first, no client scan files stored.',
  canonical: `${SITE_URL}/external-api`,
};

export const HOW_IT_WORKS = [
  {
    title: 'Pick your OS',
    body: 'Choose macOS, Linux, Windows, iPhone, or Android to get the right inventory command.',
  },
  {
    title: 'Copy & run the command',
    body: 'Run a read-only command locally to list installed packages and versions into scan_results.txt.',
  },
  {
    title: 'Upload your inventory',
    body: 'Upload the output file. Nothing is stored — the scan runs and client data is discarded.',
  },
  {
    title: 'Match CPE → CVE',
    body: 'CVEScan resolves products to CPE and matches them against NVD for known CVEs with CVSS severity.',
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I check installed programs for CVEs?',
    answer:
      'Pick your OS in CVEScan, copy the inventory command, run it on your machine, and upload scan_results.txt. Local Programs mode maps your installed software through CPE → CVE against NVD to list unpatched vulnerabilities.',
  },
  {
    question: 'How does CPE to CVE matching work?',
    answer:
      'Each product and version is resolved to a Common Platform Enumeration (CPE) identifier, then matched against the National Vulnerability Database (NVD) to find CVEs that affect that software.',
  },
  {
    question: 'Is it safe to upload scan_results.txt?',
    answer:
      'Yes. Client scan files from the web product are never stored. The inventory is processed for matching and not retained for marketing or later reuse.',
  },
  {
    question: 'Can I scan Linux, Windows, and macOS packages for vulnerabilities?',
    answer:
      'Yes. Local Programs supports macOS, Linux, Windows, iPhone, and Android inventory commands so you can check installed packages for known CVEs across common platforms.',
  },
  {
    question: 'What is a runtime CVE scanner?',
    answer:
      'A runtime CVE scanner checks the software actually installed on a system (not just source dependencies) and reports known vulnerabilities from NVD — including CVSS severity and signals like CISA KEV when available.',
  },
  {
    question: 'What are Browser and Network scan modes?',
    answer:
      'Browser mode will scan the last week of browser history for vulnerable sites. Network mode will scan the host/network with nmap to find exposed services and related risks. Both are coming soon; Local Programs is available now.',
  },
];

export function softwareApplicationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web',
    description: HOME_SEO.description,
    featureList: SCAN_MODES.map((m) => `${m.label}: ${m.description}`),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function faqPageJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
