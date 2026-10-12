import { DEFAULT_SETTINGS } from "./defaults.js";

const STORAGE_KEY = "settings";

/**
 * @returns {Promise<import('./types.js').ExtensionSettings>}
 */
export async function getSettings() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
}

/**
 * @param {Partial<import('./types.js').ExtensionSettings>} patch
 * @returns {Promise<import('./types.js').ExtensionSettings>}
 */
export async function updateSettings(patch) {
  const current = await getSettings();
  const next = {
    ...current,
    ...patch,
    features: { ...current.features, ...patch.features },
    theme: { ...current.theme, ...patch.theme },
    fillIndicator: { ...current.fillIndicator, ...patch.fillIndicator },
  };
  await chrome.storage.sync.set({ [STORAGE_KEY]: next });
  return next;
}

/**
 * @param {string} hostname
 * @param {string[]} allowedHosts
 */
export function isHostInList(hostname, allowedHosts) {
  return allowedHosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );
}

/**
 * @param {string} hostname
 * @param {import('./types.js').ExtensionSettings} settings
 */
export function isHostAllowed(hostname, settings) {
  if (!settings.enabled) return false;
  if (settings.devMode) return true;
  return isHostInList(hostname, settings.allowedHosts);
}

/**
 * @param {string} hostname
 * @returns {Promise<import('./types.js').ExtensionSettings>}
 */
export async function addAllowedHost(hostname) {
  const host = hostname.trim();
  if (!host) return getSettings();

  const current = await getSettings();
  if (isHostInList(host, current.allowedHosts)) return current;

  return updateSettings({
    allowedHosts: [...current.allowedHosts, host],
  });
}