# DOM Inspection Checklist

Run this on a real work form page before tuning dropdown detection.

## 1. Page structure

- [ ] Full URL (hostname only is fine for settings — no credentials in notes)
- [ ] Is the form in the main document or inside an `<iframe>`?
- [ ] Does the page reload on navigation, or is it a single-page app?

## 2. Dropdown elements

For each problematic dropdown, record:

| Field label | HTML element | Notes |
|-------------|--------------|-------|
| e.g. Department | `<select name="dept">` | native |

Check in DevTools:

- [ ] Is it a native `<select>`?
- [ ] If not, what tag / `role` / classes does it use?
- [ ] Where do options live? (`<option>`, another element, loaded on click?)
- [ ] Does opening the dropdown add new DOM nodes?

## 3. How to inspect (quick steps)

1. Right-click the dropdown → **Inspect**
2. Note the element tag and attributes (`name`, `id`, `class`, `role`)
3. If `<select>`, expand it and count `<option>` children
4. If custom, click to open the menu and watch Elements panel for new nodes
5. Copy outer HTML of one dropdown into a note (redact sensitive values)

## 4. Form fields

- [ ] List input types used: text, date, radio, checkbox, select, other
- [ ] Are required fields marked visually (asterisk, red border)?
- [ ] Does the form submit on button click or auto-save?

## 5. Dark theme trial

With extension loaded (dev mode on):

- [ ] Does invert mode make the page readable?
- [ ] Are any controls invisible or wrong-colored?
- [ ] Do images/icons look correct?

## 6. Fill indicators trial

- [ ] Fill a text field — does background change?
- [ ] Fill a dropdown — does it mark as complete?
- [ ] Clear a field — does indicator remove?

## 7. Picker trial

- [ ] Focus or click a dropdown — does picker open?
- [ ] Are all options listed?
- [ ] Does search filter correctly?
- [ ] Does selecting an option update the form field?
- [ ] Does the form still submit correctly after using the picker?

## 8. Paste results here

```
Hostname:
Iframe: yes / no
Dropdown type: native select / custom / mixed
Example dropdown HTML:


Issues found:

```