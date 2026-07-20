/** Marketing + documentation copy for /external-api (examples only — no live UI calls). */

export const EXTERNAL_API_BASE = 'https://api.cvescan.app/api/external';
export const EXTERNAL_API_SITE = 'https://cvescan.app';

export const EXTERNAL_API_BENEFITS = [
  {
    title: 'Scan many users in one request',
    body: 'Upload up to 10 inventory or nmap files per call (Postman, curl, or your agent). One Bearer key covers fleet jobs and multi-user pipelines — no browser upload bottleneck.',
  },
  {
    title: 'Wire CPE → CVE into your stack',
    body: 'Drop matching into SIEMs, asset CMDB, ticketing, or custom dashboards. Send CPE strings or product/version pairs and get structured CVEs with CVSS, KEV, and enrichment sources.',
  },
  {
    title: 'JSON or CSV report file',
    body: 'Get per-file JSON with severity summary, or set format=csv to download cvescan-report.csv in the same request — ready for audits and spreadsheets.',
  },
  {
    title: 'Prioritize what to fix',
    body: 'Severity, CVSS, CISA KEV flags, and optional Nuclei template links help you decide what to patch first. Upcoming commercial extras: remediation hints and “how to resolve” playbooks per CVE.',
  },
  {
    title: 'Privacy-first matching',
    body: 'The External API reads the shared vulnerability catalog only. Your inventory lists are processed for matching and are not stored as customer scan archives.',
  },
  {
    title: 'Same engine as cvescan.app',
    body: 'Commercial keys hit the same matching engine that powers https://cvescan.app — consistent results between the public scanner and your integrations.',
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
    id: 'match-post',
    method: 'POST',
    path: '/match',
    title: 'Match by CPEs or products',
    summary:
      'Primary matching endpoint. Send either a list of CPE 2.3 strings or product name/version pairs. Returns matched CVEs with severity and enrichment.',
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
      "nuclei_template_url": "https://…"
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
    id: 'scan-batch',
    method: 'POST',
    path: '/scan-batch',
    title: 'Batch scan up to 10 files',
    summary:
      'Multipart upload of up to 10 inventory (.txt) or nmap (.xml) files. Returns per-file CVE matches + summary (JSON), or set format=csv to download cvescan-report.csv. Ideal for Postman / agents scanning multiple users at once. Files are not stored.',
    auth: true,
    request: `multipart/form-data

files=@user-a.txt   (repeat up to 10; field name "files" or "file")
files=@user-b.txt
mode=local          (optional: local | network)
os=macos            (optional)
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

export const EXTERNAL_API_ERRORS = [
  { status: 401, code: 'UNAUTHORIZED', meaning: 'Missing or invalid Bearer API key' },
  { status: 400, code: 'TOO_MANY_FILES', meaning: 'More than 10 files in scan-batch' },
  { status: 400, code: 'NO_FILE', meaning: 'scan-batch missing multipart files' },
  { status: 400, code: 'VALIDATION', meaning: 'Invalid body (e.g. empty cpes/products)' },
] as const;
