# Topoff — Privacy Policy

**Last updated: April 2026**

## The short version

Topoff stores your information locally on your device. It never sends your data anywhere. There are no servers, no accounts, no analytics, and no third parties involved.

## What data Topoff stores

When you fill out your profile in the Topoff popup, the following fields are saved locally using Firefox's `browser.storage.local` API:

- LinkedIn URL
- GitHub URL
- Portfolio / personal website URL
- Work authorization status
- Desired salary
- Pronouns
- Phone number (backup)
- Disability status
- Veteran status
- Ethnicity / race
- Gender

## Where your data goes

**Nowhere.** All data is stored exclusively in your browser's local extension storage on your own device. Topoff makes no network requests and has no backend server. Your profile data is never transmitted, shared, sold, or processed by anyone other than you.

## What pages Topoff runs on

Topoff's content script runs on a defined list of job application platforms (Greenhouse, Lever, Workday, iCIMS, LinkedIn, Indeed, etc.) to detect and fill form fields. It does not run on unrelated websites. It reads form structure but does not collect, log, or transmit anything it finds.

## Permissions

Topoff requests the following browser permissions:

- **`storage`** — to save and retrieve your profile locally
- **`activeTab`** — to interact with the active job application page when you click the extension icon

No other permissions are requested.

## Data deletion

To delete all stored data: open the Topoff popup, clear each field in your profile, and click Save. Alternatively, uninstalling the extension removes all associated storage immediately.

## Contact

Questions? Open an issue at https://github.com/alexcarrick/topoff
