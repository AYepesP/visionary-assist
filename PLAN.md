# Visionary Assist — Implementation Plan

**Version:** 0.1.7  
**Last updated:** End of initial build session

---

## Current status

| Item | Status |
|------|--------|
| Extension installs and runs (Brave/Chrome) | Done |
| Dark theme (invert + custom) | Done — tune on real work site |
| Fill indicators | Done — tune colors on real work site |
| Dropdown picker (`<select>`) | Done — search, keyboard, native dropdown suppressed |
| Picker dark theme with page invert | Done |
| Host allowlist + dev mode | Done |
| Popup (toggles, add-site button) | Done |
| Settings page | Done |
| Local test page | Done |
| Work hostname in allowlist | User can add via popup — confirm for work app |
| DOM inspection on real work app | **Next** |
| Work machine install | Not tested |
| Dev mode off for daily use | User should disable when hosts are set |

---

## Architecture (actual)

```
visionary-assist/
├── manifest.json
├── background.js                 # Service worker: shortcuts, settings messages
├── content/content.js            # Single bundled content script (all page logic)
├── styles/
│   ├── theme.css                 # Page invert / custom dark
│   ├── form-tracker.css          # .fva-filled
│   └── picker.css                # Modal + invert-compensated colors
├── shared/
│   ├── defaults.js
│   ├── storage.js                # getSettings, addAllowedHost, isHostAllowed
│   └── types.js
├── popup/                        # Toolbar popup
├── options/                      # Full settings
├── test/test-page.html
└── assets/
```

Unused legacy files (`content/main.js`, `theme.js`, etc.) can be deleted in a future cleanup — not load-bearing.

### Activation model

| Mode | Behavior |
|------|----------|
| **Dev mode on** | Runs on every `http`/`https` page; allowed hosts ignored |
| **Dev mode off** | Runs only on hostnames in the allowed list |
| **Extension disabled** | No features on any page |

Add hosts via **Settings** or **Popup → Add this site to allowed hosts**.

---

## Phases

### Phase 0 — Setup ✅

- [x] Scaffold extension
- [x] Implement features
- [x] Load unpacked and verify in browser
- [x] Test on local test page

---

### Phase 1 — Dark theme on work site

- [ ] Add work hostname (popup or settings)
- [ ] Turn off dev mode
- [ ] Load real form page; confirm readability
- [ ] If invert breaks layout → switch to **Custom dark palette** in settings
- [ ] Note elements needing CSS exceptions

**Done when:** She can read the form comfortably.

---

### Phase 2 — Fill indicators on work site

- [ ] Verify fields highlight when filled
- [ ] Tune fill colors in settings if low contrast

**Done when:** She can see remaining fields at a glance.

---

### Phase 3 — Dropdown detection (after DOM inspection)

Use `DOM_INSPECTION.md` on the real work app.

- [ ] Confirm dropdowns are native `<select>` or document custom type
- [ ] If custom: extend `content/content.js` detection and option extraction
- [ ] Handle iframes if form is embedded

**Done when:** Every dropdown populates the picker correctly.

---

### Phase 4 — Picker on work site

- [ ] Search → select → field updates
- [ ] Form submits successfully after using picker
- [ ] `Ctrl+Shift+F` works on focused fields

**Done when:** She prefers the picker over native dropdowns.

---

### Phase 5 — Polish

- [ ] Dev mode off; only allowed hosts
- [ ] Custom extension icons
- [ ] Keyboard-only workflow review
- [ ] Optional: TTS read-back on selection (like Visionary Reader)
- [ ] Short usage guide for her

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+D` | Toggle dark theme on current tab only |
| `Ctrl+Shift+F` | Open picker on focused dropdown |

---

## Open questions

- [ ] Exact work hostname(s)
- [ ] Dropdown DOM structure on real app
- [ ] Unpacked extension allowed on work machine?
- [ ] Keyboard-only vs mouse+keyboard preference?
- [ ] Color/contrast preferences?

---

## Next session (in order)

1. Run **DOM inspection** on a real work form (`DOM_INSPECTION.md`)
2. Add work hostname; **turn off dev mode**
3. Tune theme and fill colors on the live form
4. Fix dropdown handling if widgets are not native `<select>`
5. Test on her work machine