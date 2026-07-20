# CVEScan Web

Angular frontend for [cvescan.app](https://cvescan.app) — runtime CVE scanning from OS command output.

**No client scan data is stored.** Upload a `.txt` inventory, get matched CVEs.

## Structure (product base)

- Header: brand + External API
- Navigation: Local program | Browser | Network
- Command: macOS | Linux | Windows | iPhone | Android + copyable command
- Upload: `scan_results.txt`
- Content: CVE table with checkboxes
- Sidebar: CVE details on row click
- Footer: selected CVE aggregate + Export CSV
- Copyright: © Viktor Hnativ · AI based · support

Visual language inspired by the Figma prototype (tokens + layout details), implemented with custom `cves-*` SCSS — HTML from the prototype is not copied.

## Stack

- Angular 19 (standalone components)
- SCSS design tokens
- Talks to Customer API with `X-CVEScan-Client` header

## Local run

```bash
npm install
npm start
```

App: `http://localhost:4200`  
API (separate repo `cvescan-api`): `http://localhost:3000`

Configure `src/environments/environment.development.ts`:

- `apiUrl`
- `clientSecret` (must match API `CVESCAN_CLIENT_SECRET`)

## External API page

`/external-api` — documentation stub only (no live External API calls from the UI).

## License / contact

Copyright © Viktor Hnativ. All rights reserved 2026.  
AI based · [LinkedIn](https://www.linkedin.com/in/viktor-hnativ-968355110) · support@cvescan.app
