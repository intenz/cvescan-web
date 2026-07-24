/** Marketing + documentation copy for /external-api (examples only — no live UI calls). */

export const EXTERNAL_API_BASE = 'https://api.cvescan.app/api/external';
export const EXTERNAL_API_SITE = 'https://cvescan.app';

export const EXTERNAL_API_BENEFITS = [
  {
    title: 'Scan many users in one request',
    body: 'Upload up to 10 inventory (.txt) or nmap (.xml) files per call (Postman, curl, or your agent). One Bearer key covers fleet jobs and multi-user pipelines — no browser upload bottleneck.',
  },
  {
    title: 'Wire CPE → CVE into your stack',
    body: 'Drop matching into SIEMs, asset CMDB, ticketing, or custom dashboards. Send CPE strings or product/version pairs and get structured CVEs with CVSS, CISA KEV, and enrichment sources.',
  },
  {
    title: 'JSON or CSV report file',
    body: 'Get per-file JSON with severity summary, or set format=csv to download cvescan-report.csv in the same request — ready for audits and spreadsheets.',
  },
  {
    title: 'Remediation in the payload',
    body: 'Curated products can include remediation: package-manager update commands (macOS / Linux / Windows), patch_available vs latest version, and optional macosHint for GUI apps. Same signals as the public scanner.',
  },
  {
    title: 'Privacy-first matching',
    body: 'The External API reads the shared vulnerability catalog only. Your inventory lists are processed for matching and are not stored as customer scan archives.',
  },
  {
    title: 'Same engine as cvescan.app',
    body: 'Commercial keys hit the same matching engine that powers https://cvescan.app — Local/Network inventory matching, consistent CVSS / KEV results between the public scanner and your integrations.',
  },
  {
    title: 'Custom build for your stack',
    body: 'Need something unique? We can design and ship a tailored integration — custom endpoints, report formats, auth models, or workflows wired into your product. Tell us the use case.',
  },
] as const;

export type CodeLang = 'curl' | 'javascript' | 'python';

export interface ApiExample {
  lang: CodeLang;
  label: string;
  code: string;
}

export interface ApiEndpointDoc {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  title: string;
  summary: string;
  auth: boolean;
  request?: string;
  response?: string;
  examples: ApiExample[];
}

export const EXTERNAL_API_ENDPOINTS: ApiEndpointDoc[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    title: 'Health check',
    summary: 'Public liveness probe. No Bearer key required.',
    auth: false,
    response: `{
  "ok": true,
  "service": "external"
}`,
    examples: [
      {
        lang: 'curl',
        label: 'cURL',
        code: `curl -sS 'https://api.cvescan.app/api/external/health'`,
      },
      {
        lang: 'javascript',
        label: 'JavaScript',
        code: `const res = await fetch('https://api.cvescan.app/api/external/health');
const data = await res.json(); // { ok: true, service: 'external' }`,
      },
      {
        lang: 'python',
        label: 'Python',
        code: `import requests
print(requests.get('https://api.cvescan.app/api/external/health').json())`,
      },
    ],
  },
  {
    id: 'match-post',
    method: 'POST',
    path: '/match',
    title: 'Match by CPEs or products',
    summary:
      'Primary matching endpoint. Send either a list of CPE 2.3 strings or product name/version pairs. Returns matched CVEs with severity, enrichment, and remediation when available for curated products.',
    auth: true,
    request: `{
  "cpes": [
    "cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*"
  ]
}

// — or —

{
  "products": [
    { "name": "OpenSSH", "version": "8.9p1" },
    { "name": "nginx", "version": "1.24.0" }
  ]
}`,
    response: `{
  "count": 1,
  "cves": [
    {
      "cve_id": "CVE-2021-44228",
      "title": "Apache Log4j2 JNDI injection",
      "severity": "CRITICAL",
      "cvss": 10.0,
      "product": "log4j",
      "version": "2.14.1",
      "kev": true,
      "sources": ["nvd", "kev"],
      "matched_cpes": [
        "cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*"
      ],
      "nuclei_template_url": "https://…",
      "patch_available": true,
      "remediation": {
        "important": true,
        "productId": "…",
        "userVersion": "2.14.1",
        "latestVersion": "2.17.1",
        "patchAvailable": true,
        "macosHint": null,
        "commands": {
          "macos": "brew upgrade …",
          "linux": "sudo apt …",
          "windows": "winget upgrade …"
        }
      }
    }
  ]
}`,
    examples: [
      {
        lang: 'curl',
        label: 'cURL',
        code: `curl -sS -X POST 'https://api.cvescan.app/api/external/match' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "products": [
      { "name": "OpenSSH", "version": "8.9p1" },
      { "name": "nginx", "version": "1.24.0" }
    ]
  }'`,
      },
      {
        lang: 'javascript',
        label: 'JavaScript',
        code: `const res = await fetch('https://api.cvescan.app/api/external/match', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    cpes: ['cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*'],
  }),
});
const { count, cves } = await res.json();
console.log(count, cves.map((c) => c.cve_id));`,
      },
      {
        lang: 'python',
        label: 'Python',
        code: `import requests

r = requests.post(
    'https://api.cvescan.app/api/external/match',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'products': [
            {'name': 'OpenSSH', 'version': '8.9p1'},
            {'name': 'nginx', 'version': '1.24.0'},
        ]
    },
)
data = r.json()
print(data['count'], [c['cve_id'] for c in data['cves']])`,
      },
    ],
  },
  {
    id: 'match-get',
    method: 'GET',
    path: '/match?cpe=',
    title: 'Match a single CPE',
    summary:
      'Convenience lookup for one CPE 2.3 string via query. Same response shape as POST /match.',
    auth: true,
    request: `GET /match?cpe=cpe:2.3:a:openbsd:openssh:8.9p1:*:*:*:*:*:*:*`,
    examples: [
      {
        lang: 'curl',
        label: 'cURL',
        code: `curl -sS -G 'https://api.cvescan.app/api/external/match' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  --data-urlencode 'cpe=cpe:2.3:a:openbsd:openssh:8.9p1:*:*:*:*:*:*:*'`,
      },
      {
        lang: 'javascript',
        label: 'JavaScript',
        code: `const cpe = encodeURIComponent(
  'cpe:2.3:a:openbsd:openssh:8.9p1:*:*:*:*:*:*:*',
);
const res = await fetch(
  \`https://api.cvescan.app/api/external/match?cpe=\${cpe}\`,
  { headers: { Authorization: 'Bearer YOUR_API_KEY' } },
);
const { count, cves } = await res.json();`,
      },
      {
        lang: 'python',
        label: 'Python',
        code: `import requests

r = requests.get(
    'https://api.cvescan.app/api/external/match',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    params={'cpe': 'cpe:2.3:a:openbsd:openssh:8.9p1:*:*:*:*:*:*:*'},
)
print(r.json())`,
      },
    ],
  },
  {
    id: 'cve-get',
    method: 'GET',
    path: '/cve/:cveId',
    title: 'Lookup a CVE by id',
    summary:
      'Returns the full catalog row for a CVE (title, description, CVSS, affected CPEs, KEV, Nuclei fields). Useful after match to enrich a ticket or report.',
    auth: true,
    response: `{
  "cve_id": "CVE-2021-44228",
  "title": "…",
  "description": "…",
  "severity": "CRITICAL",
  "cvss": 10.0,
  "affected_cpes": [ "…" ],
  "kev": true,
  "sources": ["nvd", "kev"],
  "nuclei_template_url": "https://…"
}`,
    examples: [
      {
        lang: 'curl',
        label: 'cURL',
        code: `curl -sS 'https://api.cvescan.app/api/external/cve/CVE-2021-44228' \\
  -H 'Authorization: Bearer YOUR_API_KEY'`,
      },
      {
        lang: 'javascript',
        label: 'JavaScript',
        code: `const res = await fetch(
  'https://api.cvescan.app/api/external/cve/CVE-2021-44228',
  { headers: { Authorization: 'Bearer YOUR_API_KEY' } },
);
const cve = await res.json();`,
      },
      {
        lang: 'python',
        label: 'Python',
        code: `import requests

r = requests.get(
    'https://api.cvescan.app/api/external/cve/CVE-2021-44228',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
)
print(r.json()['cve_id'], r.json()['severity'])`,
      },
    ],
  },
  {
    id: 'scan-batch',
    method: 'POST',
    path: '/scan-batch',
    title: 'Batch scan up to 10 files',
    summary:
      'Multipart upload of up to 10 inventory (.txt) or nmap (.xml) files. mode=local|network (browser is not supported). Returns per-file CVE matches + summary (JSON), or set format=csv to download cvescan-report.csv. Files are not stored.',
    auth: true,
    request: `multipart/form-data

files=@user-a.txt   (repeat up to 10; field name "files" or "file")
files=@user-b.txt
mode=local          (optional: local | network — not browser)
os=macos            (optional: macos | linux | windows | iphone | android)
format=json         (optional: json | csv)

Postman: Body → form-data → several Files named "files" + optional Text fields.`,
    response: `{
  "batchSize": 2,
  "mode": "local",
  "os": "macos",
  "meta": { "stored": false },
  "summary": {
    "filesOk": 2,
    "filesFailed": 0,
    "uniqueCves": 15,
    "bySeverity": { "CRITICAL": 1, "HIGH": 4, "MEDIUM": 6, "LOW": 2, "UNKNOWN": 2 }
  },
  "results": [
    { "filename": "user-a.txt", "ok": true, "count": 8, "cves": [ /* … */ ] },
    { "filename": "user-b.txt", "ok": true, "count": 7, "cves": [ /* … */ ] }
  ]
}

// format=csv → attachment cvescan-report.csv
// columns: source_file,cve_id,severity,cvss,product,version,published,kev,title`,
    examples: [
      {
        lang: 'curl',
        label: 'cURL',
        code: `# JSON (default)
curl -sS -X POST 'https://api.cvescan.app/api/external/scan-batch' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -F 'files=@user-a.txt' \\
  -F 'files=@user-b.txt' \\
  -F 'mode=local' \\
  -F 'os=macos'

# CSV report file
curl -sS -X POST 'https://api.cvescan.app/api/external/scan-batch' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -F 'files=@user-a.txt' \\
  -F 'files=@user-b.txt' \\
  -F 'format=csv' \\
  -o cvescan-report.csv`,
      },
      {
        lang: 'javascript',
        label: 'JavaScript',
        code: `const form = new FormData();
form.append('files', fileA, 'user-a.txt');
form.append('files', fileB, 'user-b.txt');
form.append('mode', 'local');
form.append('os', 'macos');
// form.append('format', 'csv'); // download report instead of JSON

const res = await fetch('https://api.cvescan.app/api/external/scan-batch', {
  method: 'POST',
  headers: { Authorization: 'Bearer YOUR_API_KEY' },
  body: form,
});
const data = await res.json();
console.log(data.summary, data.results.map((r) => r.filename));`,
      },
      {
        lang: 'python',
        label: 'Python',
        code: `import requests

files = [
    ('files', ('user-a.txt', open('user-a.txt', 'rb'), 'text/plain')),
    ('files', ('user-b.txt', open('user-b.txt', 'rb'), 'text/plain')),
]
data = {'mode': 'local', 'os': 'macos'}  # add 'format': 'csv' for report file

r = requests.post(
    'https://api.cvescan.app/api/external/scan-batch',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    files=files,
    data=data,
)
print(r.json())  # or r.content when format=csv`,
      },
    ],
  },
];

export const EXTERNAL_API_VS_PUBLIC = [
  {
    label: 'Public scanner (cvescan.app)',
    body: 'No account. Local inventory upload, Browser URL probe, or Network nmap XML — interactive UI with Noise / Patch filters.',
  },
  {
    label: 'External API',
    body: 'Bearer key. Programmatic POST /match, GET /cve/:id, and scan-batch (local|network files). Same matching engine; Browser site-probe is UI-only today.',
  },
] as const;

export const EXTERNAL_API_ROADMAP = [
  'Scheduled reporting webhooks and signed audit exports',
  'Org-level usage dashboards on cvescan.app',
  'Higher rate limits / org API keys for large fleets',
  'Browser / URL scan mode on the commercial API (UI-only today)',
] as const;

export const EXTERNAL_API_ERRORS = [
  { status: 401, code: 'UNAUTHORIZED', meaning: 'Missing or invalid Bearer API key' },
  { status: 400, code: 'TOO_MANY_FILES', meaning: 'More than 10 files in scan-batch' },
  { status: 400, code: 'NO_FILE', meaning: 'scan-batch missing multipart files' },
  { status: 400, code: 'INVALID_MODE', meaning: 'scan-batch mode=browser is not supported' },
  { status: 400, code: 'VALIDATION', meaning: 'Invalid body (e.g. empty cpes/products)' },
  { status: 404, code: 'NOT_FOUND', meaning: 'Unknown CVE id on GET /cve/:cveId' },
  { status: 504, code: 'SCAN_TIMEOUT', meaning: 'A file in scan-batch timed out' },
] as const;
