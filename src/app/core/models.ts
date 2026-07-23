export type ScanMode = 'local' | 'browser' | 'network';
export type ScanOs = 'macos' | 'linux' | 'windows' | 'iphone' | 'android';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface RemediationPayload {
  important: true;
  productId: string;
  userVersion: string | null;
  latestVersion: string | null;
  patchAvailable: boolean | null;
  /** Non-copyable macOS GUI hint (shown above brew command). */
  macosHint?: string | null;
  commands: {
    macos: string | null;
    linux: string | null;
    windows: string | null;
  };
}

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
  /** Present on scan matches; optional on catalog rows. */
  affected_cpes?: string[];
  matched_cpes?: string[];
  /** Curated product remediation from /scan (not catalog). */
  remediation?: RemediationPayload;
}

export const EXAMPLE_CVES: CveItem[] = [];

export function formatPatchLabel(
  patch: boolean | null | undefined,
  tracked = false,
): string {
  if (patch === true) return '✓ yes';
  if (patch === false) return '✗ no';
  // Tracked product, but no version to compare → unknown (not "untracked").
  if (tracked) return '?';
  return '—';
}

/** Concrete version on the CVE (not * / - / empty). */
export function hasConcreteCveVersion(
  version: string | null | undefined,
): boolean {
  const t = version?.trim();
  return Boolean(t && t !== '*' && t !== '-');
}

export function formatPatchShort(
  patch: boolean | null | undefined,
  tracked = false,
): string {
  if (patch === true) return 'yes';
  if (patch === false) return 'no';
  if (tracked) return '?';
  return '—';
}

/** Deduplicate remediation payloads by productId (keep first). */
export function uniqueRemediations(cves: CveItem[]): RemediationPayload[] {
  const seen = new Set<string>();
  const out: RemediationPayload[] = [];
  for (const c of cves) {
    const r = c.remediation;
    if (!r) continue;
    if (seen.has(r.productId)) continue;
    seen.add(r.productId);
    out.push(r);
  }
  return out;
}

export function hasRemediationCommands(r: RemediationPayload): boolean {
  return Boolean(
    r.macosHint ||
      r.commands.macos ||
      r.commands.linux ||
      r.commands.windows,
  );
}

/** Show Remediation only when an update is available (not “up to date”). */
export function needsRemediation(r: RemediationPayload): boolean {
  return r.patchAvailable === true && hasRemediationCommands(r);
}

/** CVE row can open Remediation (tracked + update available + commands). */
export function cveNeedsRemediation(cve: CveItem): boolean {
  return cve.patch_available === true && Boolean(cve.remediation && needsRemediation(cve.remediation));
}
