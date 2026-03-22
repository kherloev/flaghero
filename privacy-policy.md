# FlagHero Privacy Policy

_Last updated: March 2026_

FlagHero is a Chrome browser extension that helps you save, organise, and apply URL query parameters. This policy explains what data FlagHero handles and how.

---

## What data FlagHero stores

FlagHero stores the following data **locally in your browser** using Chrome's built-in `chrome.storage.local` API:

- **Your saved flag library** — the key, value, note, and tags you enter when saving a flag.
- **Browsing history of flagged URLs** — when you visit a URL that contains query parameters, FlagHero records the URL, domain, and parameters. This is stored locally and capped at 500 entries.
- **Your preferences** — your chosen language mode (Standard or Engineering).

## What data FlagHero does NOT collect

- FlagHero does **not** transmit any data to any server.
- FlagHero does **not** have analytics or telemetry of any kind.
- FlagHero does **not** require an account and has no login system.
- FlagHero does **not** read the content of web pages — only the URL of your active tab.
- FlagHero does **not** share data with any third party.

## Why FlagHero requests certain permissions

| Permission | Reason |
|---|---|
| `activeTab` / `tabs` | To read the URL of your current tab (detect flags) and update it (apply a flag). FlagHero only accesses the URL, never page content. |
| `storage` | To save your flag library and preferences locally in your browser. |
| Access to all URLs (`host_permissions`) | So FlagHero can apply flags to pages on any domain. This does not grant access to page content. |

## Data export and deletion

You can export your entire flag library at any time via the Export option in the extension. You can delete individual flags or your full history from within the extension. Uninstalling FlagHero removes all locally stored data.

## Changes to this policy

If this policy changes in a meaningful way, the updated version will be published at the same URL and the "Last updated" date will be revised.

## Contact

Questions about this policy can be raised via the [GitHub repository](https://github.com/kherloev/flaghero/issues).
