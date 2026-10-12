import {
  addAllowedHost,
  getSettings,
  isHostAllowed,
  isHostInList,
  updateSettings,
} from "../shared/storage.js";

const darkTheme = document.getElementById("darkTheme");
const fillIndicators = document.getElementById("fillIndicators");
const dropdownPicker = document.getElementById("dropdownPicker");
const statusPill = document.getElementById("status-pill");
const currentHost = document.getElementById("current-host");
const connectionStatus = document.getElementById("connection-status");
const addHostBtn = document.getElementById("addHost");
const openOptions = document.getElementById("openOptions");
const toast = document.getElementById("toast");

let currentHostname = "";
let toastTimer = null;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toastTimer = setTimeout(() => {
    toast.textContent = "";
  }, 2500);
}

function setPill(active) {
  statusPill.textContent = active ? "Active" : "Inactive";
  statusPill.className = "pill " + (active ? "pill-active" : "pill-inactive");
}

async function applyToTab(settings) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "APPLY_SETTINGS", settings }).catch(() => {});
  }
}

async function refresh() {
  const settings = await getSettings();
  darkTheme.checked = settings.features.darkTheme;
  fillIndicators.checked = settings.features.fillIndicators;
  dropdownPicker.checked = settings.features.dropdownPicker;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.startsWith("http")) {
    currentHost.textContent = "Not on a web page";
    setPill(false);
    statusPill.className = "pill pill-idle";
    statusPill.textContent = "—";
    connectionStatus.textContent = "";
    addHostBtn.hidden = true;
    return;
  }

  currentHostname = new URL(tab.url).hostname;
  currentHost.textContent = currentHostname;

  const active = isHostAllowed(currentHostname, settings);
  const inList = isHostInList(currentHostname, settings.allowedHosts);

  setPill(active);

  if (!settings.enabled) {
    connectionStatus.textContent = "Extension is disabled in settings.";
    addHostBtn.hidden = true;
    return;
  }

  if (settings.devMode && !inList) {
    connectionStatus.textContent = "Dev mode is on — all sites are active.";
    addHostBtn.hidden = false;
    addHostBtn.textContent = "Save this site for when dev mode is off";
  } else if (!inList) {
    connectionStatus.textContent = "This site is not in your allowed hosts list.";
    addHostBtn.hidden = false;
    addHostBtn.textContent = "Add this site to allowed hosts";
  } else {
    connectionStatus.textContent = active
      ? "This site is in your allowed hosts list."
      : "Listed, but extension is inactive.";
    addHostBtn.hidden = true;
  }

  if (!active || !tab.id) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
    if (response?.ok) {
      connectionStatus.textContent += " Connected.";
    } else {
      connectionStatus.textContent = "Refresh this tab to connect (Ctrl+Shift+R).";
    }
  } catch {
    connectionStatus.textContent = "Refresh this tab to connect (Ctrl+Shift+R).";
  }
}

async function patchFeatures(patch) {
  const settings = await getSettings();
  const next = await updateSettings({
    features: { ...settings.features, ...patch },
  });
  await applyToTab(next);
}

addHostBtn.addEventListener("click", async () => {
  addHostBtn.disabled = true;
  try {
    const next = await addAllowedHost(currentHostname);
    showToast(`${currentHostname} added to allowed hosts.`);
    await applyToTab(next);
    await refresh();
  } catch {
    showToast("Could not add host. Try again.");
  } finally {
    addHostBtn.disabled = false;
  }
});

darkTheme.addEventListener("change", () => patchFeatures({ darkTheme: darkTheme.checked }));
fillIndicators.addEventListener("change", () => patchFeatures({ fillIndicators: fillIndicators.checked }));
dropdownPicker.addEventListener("change", () => patchFeatures({ dropdownPicker: dropdownPicker.checked }));

openOptions.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

refresh();