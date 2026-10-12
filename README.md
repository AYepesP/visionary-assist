# Visionary Assist

Personal Chrome extension (Manifest V3) that helps one person fill out work forms with a visual disability. Not intended for general distribution.

**Current version:** 0.1.7

## What it does

| Feature | Description |
|---------|-------------|
| **Dark theme** | Inverts the page (or applies a custom dark palette) to reduce eye strain |
| **Fill indicators** | Highlights completed form fields with a visible background and border |
| **Dropdown picker** | Replaces native `<select>` dropdowns with a large, searchable modal |

## Quick start

### Install

1. Open `chrome://extensions` or `brave://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this folder
4. Set **Site access** to **On all sites** (extension details page)

### Limit to specific websites

By default **dev mode** is on, so the extension runs everywhere while you set up. For daily use:

1. Visit the work form site
2. Open the extension **popup** → click **Add this site to allowed hosts**
3. Open **Settings** → turn off **Dev mode**
4. Refresh the work tab

Only hostnames in the allowed list are affected. Enter hostnames only — not full URLs.

Example: for `https://forms.mycompany.com/intake` → add `forms.mycompany.com`

### Local testing

```bash
npm run test:serve
```

Open **http://localhost:5173/test-page.html** and add `localhost` to allowed hosts (or keep dev mode on).

After code changes: reload the extension, then hard-refresh the page (`Ctrl+Shift+R`).

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+D` | Toggle dark theme on the current tab |
| `Ctrl+Shift+F` | Open picker on the focused dropdown |

## Project structure

```
visionary-assist/
├── manifest.json           # Extension config
├── background.js           # Settings sync, keyboard shortcuts
├── content/
│   └── content.js          # All page logic (theme, tracker, picker)
├── styles/
│   ├── theme.css           # Page dark theme
│   ├── form-tracker.css    # Filled-field styles
│   └── picker.css          # Dropdown modal (incl. invert compensation)
├── shared/                   # Settings defaults and storage helpers
├── popup/                    # Toolbar popup (toggles, add-site button)
├── options/                  # Full settings page
├── test/test-page.html       # Local form test page
└── assets/                   # Icons
```

Legacy modular files under `content/` (`main.js`, `theme.js`, etc.) are unused — logic lives in `content/content.js`.

## Documentation

| File | Purpose |
|------|---------|
| [AI_CONTEXT.md](AI_CONTEXT.md) | Product intent and constraints (for AI / future you) |
| [PLAN.md](PLAN.md) | Implementation phases and what's left |
| [TESTING.md](TESTING.md) | How to test features and troubleshoot |
| [DOM_INSPECTION.md](DOM_INSPECTION.md) | Checklist for inspecting the real work app |

## Popup

- **Active / Inactive** pill for the current site
- Feature toggles (dark theme, fill indicators, dropdown picker)
- **Add this site to allowed hosts** when the current hostname is not listed
- Connection hint if the content script needs a tab refresh

## Settings

- **Allowed hosts** — hostnames where the extension runs
- **Dev mode** — run on every site (testing only; ignores allowed hosts)
- Theme mode, fill indicator colors, per-feature toggles

## Related project

[visionary reader](../visionary%20reader/) — separate Chrome extension for Google Search TTS. Same accessibility motivation, different problem.

## Next steps

See [PLAN.md](PLAN.md). Main remaining work:

1. DOM inspection on the real work form app
2. Tune dropdown detection if widgets are not native `<select>`
3. Turn off dev mode and use allowed hosts only
4. Test install on her work machine