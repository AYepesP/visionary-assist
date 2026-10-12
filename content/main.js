import { fetchSettings, isHostAllowed } from "./settings-client.js";
import { ThemeManager } from "./theme.js";
import { FormTracker } from "./form-tracker.js";
import { DropdownDetector } from "./dropdown-detector.js";
import { Picker } from "./picker.js";

const themeManager = new ThemeManager();
const formTracker = new FormTracker();
const picker = new Picker();
const dropdownDetector = new DropdownDetector(picker);

let active = false;
let themeForcedOff = false;

function showDevBadge(connected) {
  const existing = document.getElementById("fva-dev-badge");
  if (existing) existing.remove();

  const badge = document.createElement("div");
  badge.id = "fva-dev-badge";
  badge.textContent = connected
    ? "Visionary Assist active (dev mode)"
    : "Visionary Assist failed to start — check extension errors";
  badge.style.cssText = [
    "position:fixed",
    "bottom:12px",
    "right:12px",
    "z-index:2147483645",
    "padding:8px 12px",
    "border-radius:8px",
    "font:600 12px/1.2 system-ui,sans-serif",
    "color:#fff",
    `background:${connected ? "#2f6f3e" : "#8b2f2f"}`,
    "box-shadow:0 4px 16px rgba(0,0,0,.35)",
    "pointer-events:none",
  ].join(";");
  document.documentElement.appendChild(badge);
}

async function applySettings(settings) {
  const allowed = isHostAllowed(location.hostname, settings);
  active = allowed;

  if (!allowed) {
    themeManager.disable();
    formTracker.disable();
    dropdownDetector.disable();
    picker.close();
    document.getElementById("fva-dev-badge")?.remove();
    return;
  }

  if (settings.devMode) {
    showDevBadge(true);
  } else {
    document.getElementById("fva-dev-badge")?.remove();
  }

  const darkThemeOn = settings.features.darkTheme && !themeForcedOff;
  if (darkThemeOn) {
    themeManager.enable(settings);
  } else {
    themeManager.disable();
  }

  if (settings.features.fillIndicators) {
    formTracker.enable(settings);
  } else {
    formTracker.disable();
  }

  if (settings.features.dropdownPicker) {
    dropdownDetector.enable();
  } else {
    dropdownDetector.disable();
    picker.close();
  }
}

async function init() {
  const settings = await fetchSettings();
  await applySettings(settings);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ ok: true, active });
    return;
  }

  if (message.type === "SETTINGS_UPDATED" || message.type === "APPLY_SETTINGS") {
    const settings = message.settings ?? null;
    if (settings) {
      applySettings(settings);
    } else {
      init();
    }
    return;
  }

  if (message.type === "TOGGLE_THEME_PAGE") {
    themeForcedOff = !themeForcedOff;
    init();
    return;
  }

  if (message.type === "OPEN_PICKER" && active) {
    const target = document.activeElement;
    if (target) {
      dropdownDetector.handleFocus(target, { forceOpen: true });
    }
  }
});

init().catch(() => showDevBadge(false));