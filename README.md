# ⛽ Topoff

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Topoff fills the job application fields that standard autofill always skips.**

LinkedIn URL, GitHub, portfolio, work authorization, salary expectations, disability status, veteran status — all the fields that slow you down on every single application.

---

## The problem

Browser autofill handles name, email, phone, and address just fine. But it has no idea what a "LinkedIn URL" field means. Every job application, you're copying and pasting the same handful of URLs and answers by hand.

Topoff fixes that.

---

## How it works

1. Fill out your profile once in the Topoff popup (stored locally — never sent anywhere)
2. Navigate to any job application
3. Topoff automatically highlights matched fields with an inline badge
4. Click a badge to fill that field, or hit **Fill All** to fill everything at once

### Fields Topoff covers

| Field | Type |
|---|---|
| LinkedIn URL | Text input |
| GitHub URL | Text input |
| Portfolio / Website | Text input |
| Work Authorization | Text input |
| Desired Salary | Text input |
| Pronouns | Text input |
| Phone (backup) | Text input |
| Disability Status | Dropdown |
| Veteran Status | Dropdown |
| Ethnicity / Race | Dropdown |
| Gender | Dropdown |

### Supported platforms

Greenhouse · Lever · Workday · iCIMS · Taleo · SmartRecruiters · Jobvite · LinkedIn · Indeed · Glassdoor · ZipRecruiter · Wellfound · Ashby · BambooHR · and more

---

## Install

### Firefox (stable release)
> Coming soon to [addons.mozilla.org](https://addons.mozilla.org)

### Load manually (developer mode)
1. Download the latest release ZIP from the [Releases](../../releases) page
2. Open Firefox and navigate to `about:debugging`
3. Click **This Firefox → Load Temporary Add-on**
4. Select `manifest.json` from the unzipped folder

---

## Privacy

All data is stored locally using `browser.storage.local`. Topoff makes zero network requests and has no backend. Your profile never leaves your device.

→ [Full privacy policy](PRIVACY.md)

---

## Contributing

Found a job board that Topoff doesn't detect? Have a field it misses?

**The easiest way to contribute:**
1. Open an [Issue](../../issues) describing the site and field
2. Include what the input's `name`, `id`, or label text says (right-click → Inspect)

**To contribute code:**
1. Fork the repo
2. Make your changes in `content/content.js` (field rules) or `popup/` (UI)
3. Test by loading as a temporary add-on in Firefox (`about:debugging`)
4. Open a pull request

---

## Roadmap

- [ ] Submit to Firefox Add-ons (AMO)
- [ ] Chrome port (manifest v3)
- [ ] Auto-detect new/unknown job boards (opt-in)
- [ ] Cover letter snippet storage
- [ ] Multiple profiles (e.g. different salary targets per role type)

---

## Project structure

```
topoff/
├── manifest.json          # Extension config, permissions, platform list
├── popup/
│   ├── popup.html         # Toolbar popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Profile save/load, page scan, fill trigger
├── content/
│   └── content.js         # Injected into job pages — detects fields, fills them
├── icons/
│   └── icon*.png          # Extension icons at 16/32/48/96/128px
├── PRIVACY.md
└── README.md
```

---

## Built with

- Firefox WebExtensions API
- `browser.storage.local` for local-only profile storage
- Zero dependencies, zero build step — plain HTML/CSS/JS

---

*Built by Alex Carrick. Released under the [MIT License](LICENSE).*
