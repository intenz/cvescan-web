# CVEScan — Launch Copy

> **Order:** 1) Reddit (detailed) → 2) LinkedIn (short + link to Reddit)  
> **https://cvescan.app**

After Reddit is live, paste the post URL into LinkedIn where it says `REDDIT_POST_URL`.

---

## Images

| Channel | Image |
|---------|--------|
| Reddit | Vertical · CVSS scores + Scan Now |
| LinkedIn | Wide · `scan_results.txt` + stats (**100k+**, not 240k) |

---

## Hook lines (pick / remix)

Clicky but honest — Local is **one upload**, Browser is closer to **one paste**:

```
Want to know your vulnerabilities — without installing heavy security software?
```

```
One upload. See the risks on the software you actually run.
```

```
Free. Fast. No account. Your file isn’t stored after the scan.
```

```
Paste a public URL — get a quick read on exposed stack risks.
```

```
All the risk signal. None of the enterprise bloat.
```

```
Transparent by design: no signup, no retention of your inventory, results in seconds.
```

---

## 1 · Reddit first (detailed)

**Where:** start with `r/netsec` or `r/cybersecurity` (one post).

### Title

```
Want to know which CVEs hit YOUR stack? Free runtime matcher — one upload, no account, nothing stored
```

### Body

```
Want to know your vulnerabilities without installing a heavy security suite?

I kept asking a simple question the big CVE sites don’t answer well:
“Which CVEs hit what I’m actually running — right now?”

So I built CVEScan (free): https://cvescan.app

One upload (or a public URL) → CVSS-ranked risks on your real stack.
No account. No dark patterns. Your inventory isn’t stored after the scan.
Fast — matching is usually a couple of seconds once the file is up.


## Privacy & speed (on purpose)

- No signup / no login wall
- Upload is processed for matching and not kept as a scan archive
- Clear modes, clear limits — no “agent on every laptop” story
- Built to be transparent: you see what you sent, you see what matched


## What it does (3 modes)

**1) Local Programs — one upload**
- Copy a one-liner for your OS (macOS / Linux / Windows; iOS/Android helpers too)
- Examples: system_profiler / dpkg|rpm / winget list
- Upload scan_results.txt → matched CVEs for installed apps
- Example from my machine: ~355 apps → ~2500 matching CVEs

**2) Network — nmap XML**
- Run nmap service detection, save XML (-oX)
- Upload scan_results.xml → CVEs for detected products/versions
- Only scan hosts you own or have permission to scan

**3) Browser — paste a URL**
- Public https:// only (headers / HTML / stack signals)
- Not logged-in pages, not VPN-only apps
- Quick external “what risks show from the outside?”


## How matching works (short)

1. Parse inventory / nmap / site signals → product + version hints
2. Resolve to CPE-style identity where possible
3. Match against an NVD-backed catalog (100k+ CVEs; still growing)
4. Show CVSS, KEV flags when available
5. Optional CSV report after a scan


## What’s intentionally out of scope

- Not an enterprise agent / continuous monitoring / Qualys replacement
- Not a full exploit scanner
- Matching can false-positive — I want that feedback


## Extra

- External API if you want CPE → CVE in your own flow: https://cvescan.app
- Building in public / job-hunting — this is a real product I use myself

**Community & support**
- Discord (bugs, ideas, chat): https://discord.gg/3TtceteFB
- Email: support@cvescan.app
- CVEScan is free by choice — if it helps you, there’s an optional Support / donate on the site (PayPal / crypto). No pressure.


## Feedback I’d love

- Matching quality on your inventories
- False positives that annoyed you
- Would you use Local, Network, or Browser more?

Happy to dig into CPE resolution, nmap parsing, or the pipeline in the comments.
```

---

## 2 · LinkedIn second (after Reddit)

*Image: wide banner*  
*Replace `REDDIT_POST_URL`*

```
Want to know your vulnerabilities — without installing heavy security software?

I built CVEScan: one upload (or a public URL) → see the CVE risks on what you’re actually running.

Free · fast · no account
Your file isn’t stored after the scan. Transparent by design.

Local apps · nmap XML · public website check
→ https://cvescan.app

Full breakdown (how it works, limits, privacy):
REDDIT_POST_URL

If you’re in IT/security, try it and tell me where matching is wrong.
Open to roles where shipping this kind of product matters — happy to chat.
```

---

## Checklist

- [ ] Post Reddit + vertical image
- [ ] Copy thread URL → LinkedIn `REDDIT_POST_URL` + wide image
- [ ] Reply to comments

---

*Last updated: 2026-07-22*
