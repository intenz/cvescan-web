import type { RemediationPayload } from './models';

export type MergedOsCommands = {
  macos: string | null;
  linux: string | null;
  windows: string | null;
};

function uniq(pkgs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of pkgs) {
    const t = p.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Parse brew / apt / winget upgrade lines into mergeable package tokens. */
export function parseMergeableCommand(
  cmd: string,
):
  | { kind: 'brew-cask'; packages: string[] }
  | { kind: 'brew-formula'; packages: string[] }
  | { kind: 'apt'; packages: string[] }
  | { kind: 'winget'; packages: string[] }
  | null {
  const t = cmd.trim().replace(/\s+/g, ' ');
  if (!t) return null;

  let m = t.match(
    /^brew update && brew upgrade --cask (.+)$/i,
  );
  if (m?.[1]) {
    return { kind: 'brew-cask', packages: m[1].split(' ').filter(Boolean) };
  }

  m = t.match(/^brew update && brew upgrade (?!--cask)(.+)$/i);
  if (m?.[1]) {
    return { kind: 'brew-formula', packages: m[1].split(' ').filter(Boolean) };
  }

  m = t.match(/^sudo apt update && sudo apt upgrade (.+)$/i);
  if (m?.[1]) {
    return { kind: 'apt', packages: m[1].split(' ').filter(Boolean) };
  }

  // winget upgrade --id A [--id B ...]
  if (/^winget upgrade\b/i.test(t)) {
    const ids = [...t.matchAll(/--id\s+(\S+)/gi)].map((x) => x[1]!);
    if (ids.length) return { kind: 'winget', packages: ids };
  }

  return null;
}

function mergeOs(
  cmds: Array<string | null | undefined>,
  os: 'macos' | 'linux' | 'windows',
): string | null {
  const casks: string[] = [];
  const formulas: string[] = [];
  const apt: string[] = [];
  const winget: string[] = [];
  const leftovers: string[] = [];

  for (const raw of cmds) {
    if (!raw?.trim()) continue;
    // Per-product blocks may include brew + /Applications hint — merge line by line.
    for (const line of raw.split(/\n+/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parsed = parseMergeableCommand(trimmed);
      if (!parsed) {
        leftovers.push(trimmed);
        continue;
      }
      if (parsed.kind === 'brew-cask') casks.push(...parsed.packages);
      else if (parsed.kind === 'brew-formula') formulas.push(...parsed.packages);
      else if (parsed.kind === 'apt') apt.push(...parsed.packages);
      else winget.push(...parsed.packages);
    }
  }

  const parts: string[] = [];

  if (os === 'macos') {
    const c = uniq(casks);
    const f = uniq(formulas);
    if (c.length || f.length) {
      const brew: string[] = ['brew update'];
      if (c.length) brew.push(`brew upgrade --cask ${c.join(' ')}`);
      if (f.length) brew.push(`brew upgrade ${f.join(' ')}`);
      parts.push(brew.join(' && '));
    }
  }

  if (os === 'linux') {
    const pkgs = uniq(apt);
    if (pkgs.length) {
      parts.push(`sudo apt update && sudo apt upgrade ${pkgs.join(' ')}`);
    }
  }

  if (os === 'windows') {
    const ids = uniq(winget);
    if (ids.length) {
      parts.push(`winget upgrade ${ids.map((id) => `--id ${id}`).join(' ')}`);
    }
  }

  // Unrecognized per-product commands — keep as separate lines.
  parts.push(...leftovers);

  return parts.length ? parts.join('\n') : null;
}

/**
 * Collapse same-manager commands across selected products into one copyable
 * block per OS (space-separated packages, not commas).
 */
export function mergeRemediationCommands(
  items: RemediationPayload[],
): MergedOsCommands {
  return {
    macos: mergeOs(
      items.map((i) => i.commands.macos),
      'macos',
    ),
    linux: mergeOs(
      items.map((i) => i.commands.linux),
      'linux',
    ),
    windows: mergeOs(
      items.map((i) => i.commands.windows),
      'windows',
    ),
  };
}

export function hasMergedCommands(m: MergedOsCommands): boolean {
  return Boolean(m.macos || m.linux || m.windows);
}
