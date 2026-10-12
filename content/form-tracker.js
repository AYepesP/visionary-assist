const FIELD_SELECTOR = [
  "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset'])",
  "textarea",
  "select",
  '[role="combobox"]',
  '[role="listbox"]',
].join(", ");

export class FormTracker {
  constructor() {
    this.enabled = false;
    this.observer = null;
    this.settings = null;
    this.onFieldChange = this.onFieldChange.bind(this);
  }

  /**
   * @param {import('../shared/types.js').ExtensionSettings} settings
   */
  enable(settings) {
    if (this.enabled) {
      this.settings = settings;
      this.refreshAll();
      return;
    }

    this.enabled = true;
    this.settings = settings;
    document.addEventListener("input", this.onFieldChange, true);
    document.addEventListener("change", this.onFieldChange, true);
    this.observeDom();
    this.refreshAll();
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    document.removeEventListener("input", this.onFieldChange, true);
    document.removeEventListener("change", this.onFieldChange, true);
    this.observer?.disconnect();
    this.observer = null;

    for (const field of document.querySelectorAll(FIELD_SELECTOR)) {
      field.classList.remove("fva-filled");
      field.style.removeProperty("--fva-fill-bg");
      field.style.removeProperty("--fva-fill-border");
    }
  }

  observeDom() {
    this.observer = new MutationObserver(() => this.refreshAll());
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  refreshAll() {
    for (const field of document.querySelectorAll(FIELD_SELECTOR)) {
      this.updateField(field);
    }
  }

  onFieldChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches(FIELD_SELECTOR)) return;
    this.updateField(target);
  }

  /**
   * @param {Element} field
   */
  updateField(field) {
    if (!this.settings) return;

    const value = this.readValue(field);
    const filled = value.length > 0;

    field.classList.toggle("fva-filled", filled);
    if (filled) {
      field.style.setProperty("--fva-fill-bg", this.settings.fillIndicator.backgroundColor);
      field.style.setProperty("--fva-fill-border", this.settings.fillIndicator.borderColor);
    } else {
      field.style.removeProperty("--fva-fill-bg");
      field.style.removeProperty("--fva-fill-border");
    }
  }

  /**
   * @param {Element} field
   */
  readValue(field) {
    if (field instanceof HTMLSelectElement || field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      return (field.value ?? "").trim();
    }

    return (field.textContent ?? field.getAttribute("aria-label") ?? "").trim();
  }
}