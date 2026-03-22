# Chrome Web Store Submission Checklist

## Before you submit

- [ ] Generate real screenshots (see below)
- [ ] Push repo to GitHub — privacy policy is then live at `https://github.com/YOUR_USERNAME/flaghero/blob/main/privacy-policy.md`

---

## Store listing fields

| Field | Value |
|---|---|
| **Name** | FlagHero |
| **Short description** | Save, organize, and apply URL flags with one click. Built for PMs, CS, ops, and anyone who isn't writing the code. |
| **Category** | Productivity |
| **Language** | English |
| **Full description** | See `listing.md` |
| **Privacy policy URL** | `https://github.com/YOUR_USERNAME/flaghero/blob/main/privacy-policy.md` |

---

## Assets

| Asset | File | Status |
|---|---|---|
| Icon 16×16 | `icons/icon16.png` | ✓ Ready |
| Icon 48×48 | `icons/icon48.png` | ✓ Ready |
| Icon 128×128 | `icons/icon128.png` | ✓ Ready |
| Small promo tile (440×280) | `store/promo-small.png` | ✓ Ready |
| Marquee promo tile (1400×560) | `store/promo-marquee.png` | ✓ Ready |
| Screenshots (1280×800 or 640×400) | — | ⚠ Need to capture |

---

## Screenshots to capture

Take these after loading the extension in Chrome. Use a 1280×800 browser window.

1. **Popup on a flagged URL** — open a page that has query params, show the "Flags on this page" section with a couple of params visible and the Save button prominent.
2. **Saved library** — show 4-5 saved flags with notes, tags, and the Apply buttons.
3. **Param Doctor** — open the "Not working?" panel for a flag and show the key variant suggestions.
4. **Conflict dialog** — trigger the "replace existing flag" warning.
5. **Eng mode** — same popup view but with Eng mode active, showing technical terminology.

---

## Privacy questionnaire answers (during submission)

**Single purpose:** Saves and applies URL query parameters (flags) across any website.

**Permission justifications:**
- `activeTab` — Read the current tab's URL to detect flags; update it to apply saved flags.
- `tabs` — Listen for URL changes to passively log flag history.
- `storage` — Store the user's flag library and preferences locally.
- `host_permissions: <all_urls>` — Required to modify URLs on any domain. The extension does not read page content.

**Remote code:** None. All code is bundled in the extension.

**Data collection:** None. All data is stored locally in the user's browser.

---

## Packaging the extension

```bash
cd /path/to/flaghero
zip -r flaghero-0.1.0.zip . \
  --exclude "*.DS_Store" \
  --exclude "store/*" \
  --exclude "*.svg" \
  --exclude "*.md" \
  --exclude "*.zip"
```

Upload `flaghero-0.1.0.zip` on the Chrome Web Store Developer Dashboard.
