# CVEScan — Launch Copy

> **[https://cvescan.app](https://cvescan.app)**

## Done

- [x] **LinkedIn** (2026-07-24)  
  https://www.linkedin.com/posts/viktor-hnativ-968355110_softwareengineering-cybersecurity-cve-ugcPost-7486367385135017985-eMgy/

## Next (pick one)

| Order | Channel            | Why                                      |
| ----- | ------------------ | ---------------------------------------- |
| 1     | **r/netsec**       | Best technical audience for this product |
| 2     | **r/cybersecurity**| Broader; shorter post; link LinkedIn/netsec |
| 3     | X / Twitter        | Short tease + LinkedIn or site           |

---

## Images

| Channel       | Image                                                   |
| ------------- | ------------------------------------------------------- |
| Reddit (both) | Vertical · CVSS scores + Scan Now                       |
| LinkedIn      | Wide / demo video (already posted)                      |
| X             | Same wide crop or 1 demo frame                          |

---

## NEXT · r/netsec (recommended)

**Flair:** Tool / Self-promo (check current sub rules)

### Title

```
Want to know which CVEs hit YOUR stack? Free runtime matcher — one upload, no account, nothing stored
```

### Body

```
Most CVE sites list what’s out there.
I wanted something simpler: which ones hit the software I’m actually running?

So I built CVEScan (free): https://cvescan.app

Upload an inventory or nmap XML (or paste a public URL) → get CVSS-ranked CVEs.
No signup. Your file isn’t kept after the scan. Usually a couple of seconds.
Catalog: **200,000+** CVEs indexed (NVD-backed).

**Modes**
1. Local — run a one-liner (winget / brew / dpkg…), upload scan_results.txt
   Example on my machine: ~355 apps → ~2500 CVEs
2. Network — nmap -sV -oX, upload the XML (only hosts you own/have permission for)
3. Browser — public https URL → headers/HTML stack signals → related CVEs

**Fix & check again**
Where we know it, you’ll see patch hints (winget/brew/apt style for tracked apps).
You update the software yourself, re-run the inventory command, upload again —
those CVEs should drop if the versions moved. CSV export is optional.

**Matching (short)**
Product + version → CPE-ish match → NVD. KEV flags when available.
Not a Qualys replacement, not an exploit scanner. False positives happen — tell me if you hit them.

Short LinkedIn demo (same tool):
https://www.linkedin.com/posts/viktor-hnativ-968355110_softwareengineering-cybersecurity-cve-ugcPost-7486367385135017985-eMgy/

Discord: https://discord.gg/3TtceteFB · support@cvescan.app
```

---

## AFTER · r/cybersecurity (shorter — don’t crosspost)

### Title

```
Built a free no-account tool that maps installed software / nmap / public sites → CVEs
```

### Body

```
If you’ve ever exported installed packages or nmap -sV output and then hunted CVEs one by one — I automated that workflow.

CVEScan: https://cvescan.app

• Local — upload inventory (winget / brew / dpkg…) → CVSS-ranked CVEs
• Network — upload nmap XML (-oX)
• Browser — paste a public URL for stack signals
• Patch hints where available → fix on the machine → re-run inventory & upload again to verify

Free, no login. File isn’t stored after the scan. **200,000+** CVEs indexed.

Demo + context:
https://www.linkedin.com/posts/viktor-hnativ-968355110_softwareengineering-cybersecurity-cve-ugcPost-7486367385135017985-eMgy/

Curious what this community thinks — especially false positives on real inventories.
```

---

## Optional · X / Twitter

```
Free runtime CVE check — upload inventory / nmap / public URL, no account, nothing stored.

200k+ CVEs · patch hints · https://cvescan.app

Demo: https://www.linkedin.com/posts/viktor-hnativ-968355110_softwareengineering-cybersecurity-cve-ugcPost-7486367385135017985-eMgy/
```

---

## LinkedIn (posted — archive)

```
Want to check your app, websites, or entire network for security vulnerabilities in seconds — without heavy software or setting up an account?

I built CVEScan in just 1 week using AI 🚀
Just upload a file or paste a public URL to see your CVE risks and how to fix them 🔥

⚡ Why try it:
• Free & no account needed
• 200,000+ CVEs indexed
• 100% private (files aren't stored)

🎬 Quick demo below!
🔗 https://cvescan.app

I am open to new opportunities…
```

---

_Last updated: 2026-07-24_
