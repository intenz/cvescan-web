import type { CveItem, ScanOs } from './models';

export type RemediationKind = 'package' | 'script' | 'store';

export type Remediation = {
  kind: RemediationKind;
  /** Shell command or short instruction to copy. */
  command: string;
  hint: string;
};

/** Map common display / CPE product tokens → package manager names. */
const BREW_ALIASES: Record<string, string> = {
  chrome: 'google-chrome',
  'google-chrome': 'google-chrome',
  chromium: 'chromium',
  firefox: 'firefox',
  node: 'node',
  nodejs: 'node',
  python: 'python',
  python3: 'python',
  openssl: 'openssl',
  git: 'git',
  docker: 'docker',
  nginx: 'nginx',
  redis: 'redis',
  postgresql: 'postgresql',
  postgres: 'postgresql',
  mysql: 'mysql',
  mongodb: 'mongodb-community',
  vscode: 'visual-studio-code',
  'visual-studio-code': 'visual-studio-code',
  postman: 'postman',
  slack: 'slack',
  zoom: 'zoom',
  wireshark: 'wireshark',
  jq: 'jq',
  curl: 'curl',
  wget: 'wget',
  go: 'go',
  rust: 'rust',
  php: 'php',
  ruby: 'ruby',
  java: 'openjdk',
  openjdk: 'openjdk',
  log4j: 'log4j',
};

const APT_ALIASES: Record<string, string> = {
  chrome: 'google-chrome-stable',
  'google-chrome': 'google-chrome-stable',
  node: 'nodejs',
  nodejs: 'nodejs',
  python: 'python3',
  python3: 'python3',
  postgresql: 'postgresql',
  postgres: 'postgresql',
  docker: 'docker.io',
  vscode: 'code',
};

function productToken(cve: CveItem): string | null {
  const fromField = (cve.product ?? '').trim().toLowerCase();
  if (fromField && fromField !== '*') return fromField;
  const cpe = cve.matched_cpes?.[0] ?? cve.affected_cpes?.[0];
  if (!cpe) return null;
  const parts = cpe.toLowerCase().split(':');
  // cpe:2.3:a:vendor:product:version:...
  const product = parts[4];
  if (product && product !== '*') return product;
  return null;
}

function hasVersion(cve: CveItem): boolean {
  const v = (cve.version ?? '').trim();
  return Boolean(v && v !== '*' && v !== '-');
}

function scriptRemediation(cve: CveItem, product: string | null): Remediation {
  const lines = [
    `# Remediation for ${cve.cve_id}`,
    product ? `# Product: ${product}` : '# Product: unknown — identify the affected package first',
    '# 1. Check vendor advisory / NVD references for the fixed version',
    '# 2. Update or replace the vulnerable software',
    '# 3. Restart the service / application if required',
  ];
  if (cve.nuclei_template_url) {
    lines.push(`# Nuclei detection: ${cve.nuclei_template_url}`);
  }
  const ref = cve.references?.[0];
  if (ref) lines.push(`# Reference: ${ref}`);

  return {
    kind: 'script',
    command: lines.join('\n'),
    hint: 'No package-manager mapping — follow vendor advisory and update manually.',
  };
}

export function buildRemediation(cve: CveItem, os: ScanOs): Remediation {
  const product = productToken(cve);

  if (os === 'iphone') {
    return {
      kind: 'store',
      command: 'Open the App Store → Updates → update the affected app',
      hint: 'iOS apps are updated through the App Store.',
    };
  }
  if (os === 'android') {
    return {
      kind: 'store',
      command: 'Open Google Play → Manage apps & device → Update the affected app',
      hint: 'Android apps are updated through Google Play.',
    };
  }

  if (!product || !hasVersion(cve)) {
    return scriptRemediation(cve, product);
  }

  if (os === 'macos') {
    const formula = BREW_ALIASES[product] ?? product.replace(/_/g, '-');
    return {
      kind: 'package',
      command: `brew update && brew upgrade ${formula}`,
      hint: `Upgrade ${formula} with Homebrew. If the formula name differs, search: brew search ${product}`,
    };
  }

  if (os === 'linux') {
    const pkg = APT_ALIASES[product] ?? product.replace(/_/g, '-');
    return {
      kind: 'package',
      command: `sudo apt update && sudo apt upgrade ${pkg}`,
      hint: `Debian/Ubuntu-style upgrade. On RHEL/Fedora try: sudo dnf upgrade ${pkg}`,
    };
  }

  if (os === 'windows') {
    const name = product.replace(/_/g, ' ');
    return {
      kind: 'package',
      command: `winget upgrade --name "${name}"`,
      hint: `If that fails, find the package id: winget search ${name}`,
    };
  }

  return scriptRemediation(cve, product);
}
