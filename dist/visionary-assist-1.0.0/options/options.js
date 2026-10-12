import { getSettings, updateSettings } from "../shared/storage.js";

const fields = {
  enabled: document.getElementById("enabled"),
  devMode: document.getElementById("devMode"),
  allowedHosts: document.getElementById("allowedHosts"),
  darkTheme: document.getElementById("darkTheme"),
  fillIndicators: document.getElementById("fillIndicators"),
  dropdownPicker: document.getElementById("dropdownPicker"),
  themeMode: document.getElementById("themeMode"),
  fillBackground: document.getElementById("fillBackground"),
  fillBorder: document.getElementById("fillBorder"),
};

const status = document.getElementById("status");

function setStatus(message) {
  status.textContent = message;
}

function fillForm(settings) {
  fields.enabled.checked = settings.enabled;
  fields.devMode.checked = settings.devMode;
  fields.allowedHosts.value = settings.allowedHosts.join("\n");
  fields.darkTheme.checked = settings.features.darkTheme;
  fields.fillIndicators.checked = settings.features.fillIndicators;
  fields.dropdownPicker.checked = settings.features.dropdownPicker;
  fields.themeMode.value = settings.theme.mode;
  fields.fillBackground.value = settings.fillIndicator.backgroundColor;
  fields.fillBorder.value = settings.fillIndicator.borderColor;
}

function readForm() {
  return {
    enabled: fields.enabled.checked,
    devMode: fields.devMode.checked,
    allowedHosts: fields.allowedHosts.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    features: {
      darkTheme: fields.darkTheme.checked,
      fillIndicators: fields.fillIndicators.checked,
      dropdownPicker: fields.dropdownPicker.checked,
    },
    theme: {
      mode: fields.themeMode.value,
    },
    fillIndicator: {
      backgroundColor: fields.fillBackground.value.trim(),
      borderColor: fields.fillBorder.value.trim(),
    },
  };
}

async function save() {
  const next = await updateSettings(readForm());
  setStatus("Saved.");
  return next;
}

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    save().catch(() => setStatus("Could not save settings."));
  }, 250);
}

async function init() {
  const settings = await getSettings();
  fillForm(settings);

  for (const element of Object.values(fields)) {
    element.addEventListener("change", scheduleSave);
    element.addEventListener("input", scheduleSave);
  }
}

init();