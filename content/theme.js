const ROOT_CLASS = "fva-dark-theme";
const CUSTOM_CLASS = "fva-theme-custom";

export class ThemeManager {
  constructor() {
    this.enabled = false;
  }

  /**
   * @param {import('../shared/types.js').ExtensionSettings} settings
   */
  enable(settings) {
    this.enabled = true;
    document.documentElement.classList.add(ROOT_CLASS);
    document.documentElement.classList.toggle(CUSTOM_CLASS, settings.theme.mode === "custom");
  }

  disable() {
    this.enabled = false;
    document.documentElement.classList.remove(ROOT_CLASS, CUSTOM_CLASS);
  }
}