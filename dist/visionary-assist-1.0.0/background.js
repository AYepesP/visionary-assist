import { getSettings, updateSettings } from "./shared/storage.js";

chrome.runtime.onInstalled.addListener(async () => {
  await getSettings();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.settings) return;

  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id || !tab.url?.startsWith("http")) continue;
      getSettings().then((settings) => {
        chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATED", settings }).catch(() => {});
      });
    }
  });
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;

  if (command === "toggle-theme") {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_THEME_PAGE" }).catch(() => {});
    return;
  }

  if (command === "toggle-picker") {
    chrome.tabs.sendMessage(tab.id, { type: "OPEN_PICKER" }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SETTINGS") {
    getSettings().then(sendResponse);
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    updateSettings(message.patch).then(sendResponse);
    return true;
  }
});