/** Attribution / license notices for vulnerability data shown on the site. */

export type DataSourceNotice = {
  id: string;
  title: string;
  summary: string;
  requirement: string;
  linkLabel: string;
  linkHref: string;
};

export const DATA_SOURCES_INTRO =
  'CVEScan shows vulnerability information from public and licensed feeds. We sell CPE → CVE matching — not ownership of CVE databases. Source names appear in the LIVE indicator.';

export const DATA_SOURCE_NOTICES: DataSourceNotice[] = [
  {
    id: 'nvd',
    title: 'NVD (NIST)',
    summary:
      'Primary CVE catalog (descriptions, CVSS, CPE). Used via the NVD API as a public service.',
    requirement:
      'This product uses the NVD API but is not endorsed or certified by the NVD. The NVD name identifies the data source only and does not imply endorsement.',
    linkLabel: 'NVD API Terms of Use',
    linkHref: 'https://nvd.nist.gov/developers/terms-of-use',
  },
  {
    id: 'cve',
    title: 'CVE® (MITRE / CVE Program)',
    summary:
      'CVE identifiers and related records used for matching and display (including cvelistV5 where applicable).',
    requirement:
      'CVE® is a registered trademark of The MITRE Corporation. Usage is under the CVE Program Terms of Use; MITRE copyright and license terms apply to copies and derivatives.',
    linkLabel: 'CVE Terms of Use',
    linkHref: 'https://www.cve.org/Legal/TermsOfUse',
  },
  {
    id: 'kev',
    title: 'CISA KEV',
    summary:
      'Known Exploited Vulnerabilities catalog — used for KEV flags and prioritization signals.',
    requirement:
      'Distributed under Creative Commons CC0 1.0. Use does not authorize the CISA logo or DHS seal, and must not be interpreted as endorsement by CISA or DHS.',
    linkLabel: 'CISA KEV license',
    linkHref: 'https://www.cisa.gov/sites/default/files/licenses/kev/license.txt',
  },
  {
    id: 'vulncheck',
    title: 'VulnCheck',
    summary:
      'Optional enrichment / source tagging shown as VulnCheck LIVE when available.',
    requirement:
      'VulnCheck data is used under VulnCheck service terms. When VulnCheck signals are shown, they are attributed to VulnCheck and are not presented as CVEScan-owned vulnerability research.',
    linkLabel: 'VulnCheck service terms',
    linkHref: 'https://www.vulncheck.com/service-terms',
  },
  {
    id: 'nuclei',
    title: 'ProjectDiscovery Nuclei',
    summary:
      'Open-source detection template links when a matching Nuclei template exists for a CVE.',
    requirement:
      'Nuclei templates are generally MIT-licensed. Template content remains under ProjectDiscovery / contributor licenses; we link to upstream templates rather than claiming ownership.',
    linkLabel: 'nuclei-templates on GitHub',
    linkHref: 'https://github.com/projectdiscovery/nuclei-templates',
  },
];

export const DATA_SOURCES_FOOTER =
  'Questions: support@cvescan.app · Product: cvescan.app';
