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
      'Upload installed software. We map each product CPE → CVE and list known vulnerabilities.',
    available: true,
  },
  {
    id: 'browser',
    label: 'Browser',
    description:
      'Scan the last week of browser history and flag vulnerable sites.',
    available: false,
  },
  {
    id: 'network',
    label: 'Network',
    description:
      'Scan with nmap to find exposed services and related CVE risks.',
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
  /** Short line under the page H1 (above the scan strip). */
  tagline:
    'Upload installed software. We map each product CPE → CVE and list known vulnerabilities.',
};

export const EXTERNAL_API_SEO = {
  title: 'CVEScan External API — Commercial CPE → CVE Matching',
  description:
    'Commercial CPE to CVE matching API for integrations. Map software inventories to NVD vulnerabilities with CVSS severity — privacy-first, no client scan files stored.',
  canonical: `${SITE_URL}/external-api`,
};

export const FAQ_SEO = {
  title: 'CVEScan FAQ — CPE → CVE Matching, Privacy & Scan Modes',
  description:
    'Answers about CVEScan: how CPE to CVE matching works, uploading scan_results.txt safely, supported OS platforms, NVD / VulnCheck / CISA KEV data, and upcoming Browser and Network modes.',
  canonical: `${SITE_URL}/faq`,
  h1: 'Frequently asked questions',
  lead: 'How CVEScan works, what data we use, and what happens when you upload an inventory file.',
};

/** Crawlable copy kept on the home page (visually hidden in UI). */
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

export const SEO_PRIVACY =
  'No client data stored. Upload an inventory file, get matched CVEs from NVD — your scan_results.txt is not retained after the scan.';

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I check installed programs for CVEs?',
    answer:
      'Open CVEScan, choose Local Programs, pick your OS, copy the inventory command, and run it on your machine. That command only lists installed software and versions into scan_results.txt — it does not modify the system. Upload the file in the browser. We resolve each product to a CPE, match it against NVD, and show CVEs with CVSS severity so you can see what is unpatched.',
  },
  {
    question: 'How does CPE to CVE matching work?',
    answer:
      'CPE (Common Platform Enumeration) is a standard way to name a product and version. CVEScan normalizes each line from your inventory to a CPE-like identity, then looks up which CVEs in the National Vulnerability Database (NVD) apply to that software. Results can include CVSS scores and, when available, signals such as CISA KEV or VulnCheck enrichment so you can prioritize what to fix first.',
  },
  {
    question: 'Is it safe to upload scan_results.txt?',
    answer:
      'Yes. Client scan files from the web product are never stored. The file is processed for matching and discarded afterward — it is not kept for marketing, training, or later reuse. Prefer running the inventory command yourself and uploading only the text output you generated. If you use the commercial External API, that path reads the shared vulnerability catalog and does not keep your web-upload inventories either.',
  },
  {
    question: 'Can I scan Linux, Windows, and macOS packages for vulnerabilities?',
    answer:
      'Yes. Local Programs currently supports inventory commands for macOS, Linux, Windows, iPhone, and Android. Each OS tab shows a read-only command tailored to that platform. After you upload the result, matching works the same way: installed software → CPE → CVE. Coverage depends on how well the product names/versions map into CPE and NVD data.',
  },
  {
    question: 'What is a runtime CVE scanner?',
    answer:
      'A runtime CVE scanner checks software that is actually installed on a device (apps, packages, versions) — not only lockfiles or source dependencies in a repo. That helps answer “what on this machine is vulnerable right now?” CVEScan focuses on that inventory → CPE → CVE flow against live vulnerability feeds such as NVD, with CVSS and optional KEV / VulnCheck context.',
  },
  {
    question: 'Where does CVEScan get vulnerability data?',
    answer:
      'The product is built around NVD as the primary CVE catalog (shown as NVD LIVE in the UI). We also surface related live-feed context such as VulnCheck and CISA KEV when available, so findings are not only theoretical severity — they can reflect known exploitation signals. Exact enrichment can evolve as feeds are updated.',
  },
  {
    question: 'What are Browser and Network scan modes?',
    answer:
      'Browser mode (coming soon) will scan roughly the last week of browser history and flag sites associated with known risks. Network mode (coming soon) will use nmap-style discovery to find exposed services and map them to related CVE risks. Today only Local Programs is available; the other modes are listed so you can see the roadmap.',
  },
  {
    question: 'Do I need an account or API key to use the website scanner?',
    answer:
      'No account is required for the public Local Programs flow: pick OS, run the command, upload scan_results.txt, and view matches. The External API is a separate commercial CPE → CVE matching interface for integrations and requires an API key. Contact support@cvescan.app if you need API access.',
  },
  {
    question: 'What file format should I upload?',
    answer:
      'Upload a plain-text .txt file produced by the OS command shown in the UI (typically named scan_results.txt). The content should be a software inventory — package or app names with versions — not a binary installer or screenshot. If parsing fails, re-run the command for your OS tab and upload the fresh output.',
  },
  {
    question: 'Why might some installed programs show no CVEs?',
    answer:
      'No match can mean the product is not in NVD under a resolvable CPE, the version string could not be parsed, the name is too generic, or there are simply no published CVEs for that version. Try clearer product names when possible. Absence of results is not a guarantee the software is safe — it means we could not confidently map it in the current catalog.',
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

export function howToJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Scan installed software for CVEs with CVEScan',
    description: HOME_SEO.description,
    step: HOW_IT_WORKS.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.body,
    })),
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
