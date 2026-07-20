export type ScanMode = 'local' | 'browser' | 'network';
export type ScanOs = 'macos' | 'linux' | 'windows' | 'iphone' | 'android';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface CveItem {
  cve_id: string;
  title: string;
  description: string;
  severity: Severity;
  cvss: number | null;
  cvss_vector: string | null;
  product: string | null;
  version: string | null;
  published: string | null;
  patch_available: boolean | null;
  cwe_id: string | null;
  references: string[];
  kev: boolean;
  nuclei_template_url: string | null;
}

export const EXAMPLE_CVES: CveItem[] = [];
