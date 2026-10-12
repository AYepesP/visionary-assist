/** @type {import('./types.js').ExtensionSettings} */
export const DEFAULT_SETTINGS = {
  enabled: true,
  devMode: false,
  allowedHosts: [],
  features: {
    darkTheme: true,
    fillIndicators: true,
    dropdownPicker: true,
  },
  theme: {
    mode: "invert",
  },
  fillIndicator: {
    backgroundColor: "#b8c0c8",
    borderColor: "#6b9e6b",
  },
};