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

export const EXAMPLE_CVES: CveItem[] = [
  {
    cve_id: 'CVE-2024-49138',
    title: 'Windows CLFS Driver',
    description:
      'A privilege escalation vulnerability in the Windows Common Log File System driver allows local attackers to gain SYSTEM privileges.',
    severity: 'CRITICAL',
    cvss: 9.8,
    cvss_vector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    product: 'Windows CLFS Driver',
    version: '≤ 10.0.22631',
    published: '2024-12-10',
    patch_available: true,
    cwe_id: 'CWE-787',
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-49138'],
    kev: true,
    nuclei_template_url: null,
  },
  {
    cve_id: 'CVE-2024-37085',
    title: 'VMware ESXi',
    description:
      'VMware ESXi contains an authentication bypass vulnerability affecting Active Directory domain authentication.',
    severity: 'HIGH',
    cvss: 7.2,
    cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H',
    product: 'VMware ESXi',
    version: '< ESXi80U3-24022510',
    published: '2024-07-30',
    patch_available: true,
    cwe_id: 'CWE-287',
    references: ['https://nvd.nist.gov/vuln/detail/CVE-2024-37085'],
    kev: false,
    nuclei_template_url: null,
  },
];
