const DROPDOWN_SELECTOR = "select, [role='combobox'], [aria-haspopup='listbox']";

export class DropdownDetector {
  /**
   * @param {import('./picker.js').Picker} picker
   */
  constructor(picker) {
    this.picker = picker;
    this.enabled = false;
    this.onFocusIn = this.onFocusIn.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    document.addEventListener("focusin", this.onFocusIn, true);
    document.addEventListener("click", this.onClick, true);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    document.removeEventListener("focusin", this.onFocusIn, true);
    document.removeEventListener("click", this.onClick, true);
  }

  /**
   * @param {Element} target
   * @param {{ forceOpen?: boolean }} [options]
   */
  handleFocus(target, options = {}) {
    if (!this.enabled && !options.forceOpen) return;
    if (!(target instanceof Element)) return;
    if (!target.matches(DROPDOWN_SELECTOR)) return;

    const payload = this.extractDropdown(target);
    if (!payload) return;

    this.picker.open(payload);
  }

  onFocusIn(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    this.handleFocus(target);
  }

  onClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const dropdown = target.closest(DROPDOWN_SELECTOR);
    if (dropdown) this.handleFocus(dropdown);
  }

  /**
   * @param {Element} element
   */
  extractDropdown(element) {
    if (element instanceof HTMLSelectElement) {
      const options = Array.from(element.options).map((option) => ({
        value: option.value,
        label: option.textContent?.trim() || option.value,
      }));

      return {
        element,
        type: "select",
        label: this.getFieldLabel(element),
        options,
      };
    }

    if (element.matches("[role='combobox'], [aria-haspopup='listbox']")) {
      return {
        element,
        type: "aria-combobox",
        label: this.getFieldLabel(element),
        options: this.extractAriaOptions(element),
      };
    }

    return null;
  }

  /**
   * @param {Element} element
   */
  getFieldLabel(element) {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label?.textContent) return label.textContent.trim();
    }

    const aria = element.getAttribute("aria-label");
    if (aria) return aria;

    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      if (labelEl?.textContent) return labelEl.textContent.trim();
    }

    if (element instanceof HTMLSelectElement && element.name) {
      return element.name;
    }

    return "Dropdown";
  }

  /**
   * @param {Element} element
   */
  extractAriaOptions(element) {
    const panelId = element.getAttribute("aria-controls");
    if (panelId) {
      const panel = document.getElementById(panelId);
      if (panel) {
        return Array.from(panel.querySelectorAll("[role='option']")).map((option) => ({
          value: option.getAttribute("data-value") || option.textContent?.trim() || "",
          label: option.textContent?.trim() || "",
        }));
      }
    }

    return Array.from(document.querySelectorAll("[role='option']")).map((option) => ({
      value: option.getAttribute("data-value") || option.textContent?.trim() || "",
      label: option.textContent?.trim() || "",
    }));
  }
}