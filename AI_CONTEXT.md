# Visionary Assist — AI Context

> Bespoke Chrome extension built for one person. Not intended for general distribution.

## Purpose

Help my partner, who has a visual disability, fill out forms at work. The extension is not meant for anyone else.

## Problem

When she fills out forms at work:

- **Dropdowns** are extremely hard to use — small text, long lists, no search
- **Light theme** on the site causes eye strain
- **Progress** is hard to see — she can't tell which sections are already completed

## Solution (three features)

1. **Dark theme** — CSS injection (invert filter or custom dark palette)
2. **Fill indicators** — completed fields get a visible background/border
3. **Dropdown picker** — intercepts `<select>` clicks, opens a searchable modal instead of the native dropdown

## Constraints

- Optimize for her work sites only, not the open web
- Simplicity over feature breadth
- Must work on her company's custom internal web app

## Work app (known so far)

- Custom-built for the company — not Salesforce, ServiceNow, etc.
- Looks old/outdated — likely native HTML forms (`<select>`, `<input>`)
- **DOM not yet inspected** on the real app — see `DOM_INSPECTION.md`
- Extension install on work machine not yet confirmed

## Technical notes (for future sessions)

- Content script is a **single file**: `content/content.js` (no ES modules in content script — required for Brave compatibility)
- Page invert uses `filter` on `html`; picker uses **invert-compensated colors** in `styles/picker.css` so the modal stays dark
- Native `<select>`: `mousedown` is prevented so only our picker opens; search filters with `includes` (substring match)
- Host gating: `shared/storage.js` → `isHostAllowed()`; dev mode bypasses allowlist
- Popup can add current hostname via `addAllowedHost()`

## Project status (v0.1.7 — session end)

### Done

- [x] Extension loads in Brave/Chrome
- [x] Dark theme (invert + custom modes)
- [x] Fill indicators on inputs, textareas, selects
- [x] Dropdown picker with search and keyboard navigation
- [x] Picker dark styling that works with page invert
- [x] Host allowlist + dev mode
- [x] Popup UI (status pill, toggles, add-site button)
- [x] Settings page UI
- [x] Local test page (`test/test-page.html`)

### Not done yet

- [ ] DOM inspection on real work app
- [ ] Tune for non-native dropdowns if needed
- [ ] Production config: allowed hosts only, dev mode off
- [ ] Work machine extension install test
- [ ] Optional polish: custom icons, TTS read-back, usage guide

## Related project

`visionary reader` — Google Search TTS extension. Separate tool, same accessibility motivation.