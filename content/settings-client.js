export async function fetchSettings() {
  return chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
}

/**
 * @param {string} hostname
 * @param {import('../shared/types.js').ExtensionSettings} settings
 */
export function isHostAllowed(hostname, settings) {
  if (!settings.enabled) return false;
  if (settings.devMode) return true;
  return settings.allowedHosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );
}