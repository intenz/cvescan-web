# CVEScan — Launch Copy

> **[https://cvescan.app](https://cvescan.app)**  
> **Plan:** today `r/netsec` (main) → tomorrow `r/cybersecurity` (shorter) → then LinkedIn with netsec link

After netsec is live, paste that URL into LinkedIn / cybersecurity where it says `NETSEC_POST_URL`.

---

## Images


| Channel       | Image                                                   |
| ------------- | ------------------------------------------------------- |
| Reddit (both) | Vertical · CVSS scores + Scan Now                       |
| LinkedIn      | Wide · `scan_results.txt` + stats (**200k+**, not 240k) |


---

## 1 · TODAY — r/netsec (main, detailed)

**Flair:** Tool / Self-promo (whatever the sub requires — read rules first)

### Title

```
Want to know which CVEs hit YOUR stack? Free runtime matcher — one upload, no account, nothing stored
```

### Body

```
Most CVE (Common Vulnerabilities and Exposures) sites list what’s out there.
I wanted something simpler: which ones hit the software I’m actually running?

So I built CVEScan (free): https://cvescan.app

Upload an inventory or nmap XML (or paste a public URL) → get CVSS-ranked CVEs.
No signup. Your file isn’t kept after the scan. Usually a couple of seconds.
Catalog: **200,000+** CVEs indexed (NVD-backed).

**🖥️ Modes**
1. Local — run a one-liner (winget / brew / dpkg…), upload scan_results.txt
   Example on my machine: ~355 apps → ~2500 CVEs
2. 🌐 Network — nmap -sV -oX, upload the XML (only hosts you own/have permission for)
3. 🔗 Browser — public https URL → headers/HTML stack signals → related CVEs

**🔥 Fix & check again**
Where we know it, you’ll see patch hints (winget/brew/apt style for tracked apps).
You update the software yourself, re-run the inventory command, upload again —
those CVEs should drop if the versions moved. CSV export is optional.

**⚙️ Matching (short)**
Product + version → CPE-ish match → NVD. KEV flags when available.
Not a Qualys replacement, not an exploit scanner. False positives happen — tell me if you hit them.

💬 Discord: https://discord.gg/3TtceteFB · ✉️ support@cvescan.app
Optional donate on the site if it’s useful — no pressure.
```

---

## 2 · TOMORROW — r/cybersecurity (shorter, different angle)

**Don’t crosspost.** New post, different title. Optional link to the netsec thread.

### Title

```
Built a free no-account tool that maps installed software / nmap / public sites → CVEs
```

### Body

```
If you’ve ever exported installed packages or nmap -sV output and then hunted CVEs (Common Vulnerabilities and Exposures) one by one — I automated that workflow.

CVEScan: https://cvescan.app

• 🖥️ Local — upload inventory (winget / brew / dpkg…) → CVSS-ranked CVEs
• 🌐 Network — upload nmap XML (-oX)
• 🔗 Browser — paste a public URL for stack signals
• 🔥 Patch hints where available → fix on the machine → re-run inventory & upload again to verify

Free, no login. File isn’t stored after the scan. **200,000+** CVEs indexed.

Longer write-up with limits + how matching works:
NETSEC_POST_URL

Curious what this community thinks — especially false positives on real inventories.
```

---

## 3 · LinkedIn (after netsec)

*Image: wide banner*  
*Replace `NETSEC_POST_URL`*

```
Want to know your vulnerabilities — without installing heavy security software?

I built CVEScan: one upload (or a public URL) → see the CVE (Common Vulnerabilities and Exposures) risks on what you’re actually running.

Free · fast · no account · **200,000+** CVEs indexed
Your file isn’t stored after the scan. Transparent by design.

Local apps · nmap XML · public website check · 🔥 patch hints
→ https://cvescan.app

Full breakdown (how it works, limits, privacy):
NETSEC_POST_URL

If you’re in IT/security, try it and tell me where matching is wrong.
Open to roles where shipping this kind of product matters — happy to chat.
```

---

## Checklist

- [ ] **Today:** r/netsec + vertical image → copy thread URL as `NETSEC_POST_URL`
- [ ] **Tomorrow:** r/cybersecurity (shorter body) + same/different vertical image
- [ ] LinkedIn with `NETSEC_POST_URL` + wide image
- [ ] Reply to comments on both threads

---

*Last updated: 2026-07-22*