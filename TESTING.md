# Testing Visionary Assist

**Version:** 0.1.7

## Before you test

1. Reload the extension at `brave://extensions` or `chrome://extensions`
2. Hard-refresh the page tab: `Ctrl+Shift+R`
3. Confirm **Site access** is **On all sites** (extension details)

---

## Host allowlist

The extension should only affect sites you choose (unless dev mode is on).

| Setting | Effect |
|---------|--------|
| **Dev mode on** | Every website is affected |
| **Dev mode off** | Only hostnames in **Allowed hosts** |
| **Popup → Add this site** | Adds current hostname to the list |

To test allowlist behavior:

1. Turn **dev mode off** in settings
2. Add `localhost` to allowed hosts (for test page)
3. Visit a site **not** in the list → popup shows **Inactive**, no green badge, no theme changes
4. Visit `localhost:5173` → popup shows **Active**, features work

---

## Local test page (recommended)

From this folder:

```bash
npm run test:serve
```

Open **http://localhost:5173/test-page.html**

Add `localhost` to allowed hosts, or keep dev mode on.

### What to verify

| Feature | How | Expected |
|---------|-----|----------|
| Active | Open popup on test page | Pill shows **Active** |
| Connected | Popup hint | "Connected" or refresh hint |
| Dev badge | Load page (dev mode on) | Green badge bottom-right |
| Dark theme | Toggle in popup | Page inverts |
| Tab theme toggle | `Ctrl+Shift+D` | Theme on/off this tab only |
| Fill indicator | Type in "Full name" | Gray fill + green outline |
| Dropdown picker | Click "Department" | Modal only — no native dropdown |
| Picker search | Type `eng` | All letters stay; filters to Engineering |
| Picker select | Click an option | Field updates, modal closes |
| Picker dark | Dark theme on | Dark panel, light readable text |
| Add host | Popup on unlisted site | "Add this site" button works |

---

## Troubleshooting

### Nothing happens

1. Reload extension + hard-refresh tab
2. Check extension **Errors** on the extensions page
3. Popup: if **Inactive**, add host or enable dev mode
4. Popup: if **Refresh this tab to connect** → `Ctrl+Shift+R`

### Picker list wrong colors (dark theme on)

Picker uses invert-compensated CSS in `styles/picker.css`. If colors look wrong after a theme change, reload extension and refresh tab.

### Features on every website

**Dev mode is on.** Turn it off in settings once allowed hosts are configured.

---

## Testing on the real work app

1. Add work hostname via popup or settings
2. Turn off dev mode
3. Open a real form page and refresh
4. Run through `DOM_INSPECTION.md` checklist
5. Test all three features; note anything that fails

---

## After code changes

1. Reload extension (version in `manifest.json` should bump)
2. Hard-refresh every open tab you are testing on
3. Re-check popup connection status