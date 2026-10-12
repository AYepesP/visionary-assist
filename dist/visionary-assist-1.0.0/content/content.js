(function () {
  "use strict";

  document.documentElement.setAttribute("data-fva-loaded", "true");

  const DEFAULT_SETTINGS = {
    enabled: true,
    devMode: false,
    allowedHosts: [],
    features: {
      darkTheme: true,
      fillIndicators: true,
      dropdownPicker: true,
    },
    theme: { mode: "invert" },
    fillIndicator: {
      backgroundColor: "#b8c0c8",
      borderColor: "#6b9e6b",
    },
  };

  let pickerUseDarkTheme = true;

  const FIELD_SELECTOR = [
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset'])",
    "textarea",
    "select",
    '[role="combobox"]',
    '[role="listbox"]',
  ].join(", ");

  const DROPDOWN_SELECTOR = "select, [role='combobox'], [aria-haspopup='listbox']";

  /**
   * @param {HTMLSelectElement} select
   */
  function captureSelectState(select) {
    const selectedAttributes = [];
    for (let i = 0; i < select.options.length; i++) {
      selectedAttributes.push(select.options[i].hasAttribute("selected"));
    }
    return {
      value: select.value,
      selectedIndex: select.selectedIndex,
      selectedAttributes: selectedAttributes,
      dataFvaSelectedValue: select.getAttribute("data-fva-selected-value"),
      hadPickerApplied: select.classList.contains("fva-picker-applied"),
      hadPickerPulse: select.classList.contains("fva-picker-applied-pulse"),
    };
  }

  /**
   * @param {HTMLSelectElement} select
   * @param {ReturnType<typeof captureSelectState>} snapshot
   */
  function restoreSelectState(select, snapshot) {
    if (!snapshot) return;

    select.value = snapshot.value;
    if (select.selectedIndex !== snapshot.selectedIndex && snapshot.selectedIndex >= 0) {
      select.selectedIndex = snapshot.selectedIndex;
    }

    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      const hadSelected = snapshot.selectedAttributes[i];
      option.selected = i === select.selectedIndex;
      if (hadSelected) {
        option.setAttribute("selected", "selected");
      } else {
        option.removeAttribute("selected");
      }
    }

    if (snapshot.dataFvaSelectedValue != null) {
      select.setAttribute("data-fva-selected-value", snapshot.dataFvaSelectedValue);
    } else {
      select.removeAttribute("data-fva-selected-value");
    }

    select.classList.toggle("fva-picker-applied", snapshot.hadPickerApplied);
    select.classList.toggle("fva-picker-applied-pulse", snapshot.hadPickerPulse);
  }

  /**
   * @param {HTMLSelectElement} select
   * @param {string} value
   */
  function selectOptionValueExists(select, value) {
    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      if (option.value === value && !option.disabled) return true;
    }
    return false;
  }

  /**
   * Sets a native <select> value for form submission and syncs selected="selected"
   * on <option> elements. Rolls back on failure so the form keeps its prior value.
   * @param {HTMLSelectElement} select
   * @param {string} value
   * @returns {{ ok: true } | { ok: false, reason: string }}
   */
  function applyNativeSelectValue(select, value) {
    if (!(select instanceof HTMLSelectElement)) {
      return { ok: false, reason: "This field is not a dropdown. Nothing was changed." };
    }
    if (select.disabled) {
      return { ok: false, reason: "This dropdown is disabled. Nothing was changed." };
    }
    if (!selectOptionValueExists(select, value)) {
      return {
        ok: false,
        reason: "That option is no longer available on the page. Nothing was changed.",
      };
    }

    const snapshot = captureSelectState(select);

    try {
      select.value = value;

      if (select.value !== value || select.selectedIndex < 0) {
        restoreSelectState(select, snapshot);
        return {
          ok: false,
          reason: "Could not apply that value. Your previous selection was kept.",
        };
      }

      for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        const isSelected = i === select.selectedIndex;
        option.selected = isSelected;
        if (isSelected) {
          option.setAttribute("selected", "selected");
        } else {
          option.removeAttribute("selected");
        }
      }

      select.setAttribute("data-fva-selected-value", value);
      select.classList.add("fva-picker-applied");
      select.classList.remove("fva-picker-applied-pulse");
      void select.offsetWidth;
      select.classList.add("fva-picker-applied-pulse");

      return { ok: true };
    } catch (_error) {
      restoreSelectState(select, snapshot);
      return {
        ok: false,
        reason: "Something went wrong. Your previous selection was kept.",
      };
    }
  }

  let active = false;
  let themeForcedOff = false;

  function mergeSettings(raw) {
    const stored = raw || {};
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      features: { ...DEFAULT_SETTINGS.features, ...stored.features },
      theme: { ...DEFAULT_SETTINGS.theme, ...stored.theme },
      fillIndicator: { ...DEFAULT_SETTINGS.fillIndicator, ...stored.fillIndicator },
    };
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("settings", (result) => {
        resolve(mergeSettings(result.settings));
      });
    });
  }

  function isHostAllowed(hostname, settings) {
    if (!settings.enabled) return false;
    if (settings.devMode) return true;
    return settings.allowedHosts.some(
      (host) => hostname === host || hostname.endsWith("." + host)
    );
  }

  function showBadge(text, color) {
    let badge = document.getElementById("fva-dev-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "fva-dev-badge";
      document.documentElement.appendChild(badge);
    }
    badge.textContent = text;
    badge.style.cssText = [
      "position:fixed",
      "bottom:12px",
      "right:12px",
      "z-index:2147483645",
      "padding:8px 12px",
      "border-radius:8px",
      "font:600 12px/1.2 system-ui,sans-serif",
      "color:#fff",
      "background:" + color,
      "box-shadow:0 4px 16px rgba(0,0,0,.35)",
      "pointer-events:none",
    ].join(";");
  }

  function hideBadge() {
    document.getElementById("fva-dev-badge")?.remove();
  }

  const themeManager = {
    enable(settings) {
      document.documentElement.classList.add("fva-dark-theme");
      document.documentElement.classList.toggle("fva-theme-custom", settings.theme.mode === "custom");
    },
    disable() {
      document.documentElement.classList.remove("fva-dark-theme", "fva-theme-custom");
    },
  };

  const formTracker = {
    enabled: false,
    observer: null,
    settings: null,

    enable(settings) {
      this.settings = settings;
      if (!this.enabled) {
        this.enabled = true;
        document.addEventListener("input", this.onFieldChange, true);
        document.addEventListener("change", this.onFieldChange, true);
        this.observer = new MutationObserver(() => this.refreshAll());
        if (document.body) {
          this.observer.observe(document.body, { childList: true, subtree: true });
        }
      }
      this.refreshAll();
    },

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
    },

    onFieldChange(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches(FIELD_SELECTOR)) return;
      formTracker.updateField(target);
    },

    refreshAll() {
      for (const field of document.querySelectorAll(FIELD_SELECTOR)) {
        this.updateField(field);
      }
    },

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
    },

    readValue(field) {
      if (
        field instanceof HTMLSelectElement ||
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
      ) {
        return (field.value || "").trim();
      }
      return (field.textContent || field.getAttribute("aria-label") || "").trim();
    },
  };

  const picker = {
    root: null,
    payload: null,
    filteredOptions: [],
    highlightIndex: 0,

    applyTheme() {
      if (!this.root) return;
      this.root.classList.toggle("fva-picker-dark", pickerUseDarkTheme);
      this.root.classList.toggle("fva-picker-light", !pickerUseDarkTheme);
    },

    open(payload) {
      if (!payload.options.length) return;
      const isNewTarget = !this.payload || this.payload.element !== payload.element;
      this.payload = payload;
      this.ensureRoot();
      this.applyTheme();
      if (isNewTarget) {
        this.filteredOptions = payload.options.slice();
        this.highlightIndex = 0;
        this.renderInitial();
      }
      this.root.hidden = false;
      document.addEventListener("keydown", this.onKeyDown, true);
    },

    close() {
      if (this.root) this.root.hidden = true;
      document.removeEventListener("keydown", this.onKeyDown, true);
      this.payload = null;
    },

    ensureRoot() {
      if (this.root) return;

      this.root = document.createElement("div");
      this.root.id = "fva-picker-root";
      this.root.hidden = true;
      this.root.innerHTML =
        '<div class="fva-picker-backdrop" data-action="close"></div>' +
        '<section class="fva-picker-panel" role="dialog" aria-modal="true" aria-label="Dropdown picker">' +
        '<header class="fva-picker-header">' +
        '<h2 class="fva-picker-title"></h2>' +
        '<button type="button" class="fva-picker-close" data-action="close" aria-label="Close picker">×</button>' +
        "</header>" +
        '<input class="fva-picker-search" type="search" placeholder="Search options..." aria-label="Search dropdown options" />' +
        '<p class="fva-picker-error" role="alert" hidden></p>' +
        '<ul class="fva-picker-list" role="listbox"></ul>' +
        "</section>";

      document.body.appendChild(this.root);

      this.root.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.dataset.action === "close") {
          this.close();
          return;
        }
        const option = target.closest("[data-option-index]");
        if (option instanceof HTMLElement) {
          this.selectOption(Number(option.dataset.optionIndex));
        }
      });

      const search = this.root.querySelector(".fva-picker-search");
      search?.addEventListener("input", () => this.filterOptions(search.value));
    },

    clearError() {
      const error = this.root?.querySelector(".fva-picker-error");
      if (!error) return;
      error.textContent = "";
      error.hidden = true;
    },

    showError(message) {
      const error = this.root?.querySelector(".fva-picker-error");
      if (!error) return;
      error.textContent = message;
      error.hidden = false;
    },

    renderInitial() {
      if (!this.root || !this.payload) return;
      const title = this.root.querySelector(".fva-picker-title");
      const search = this.root.querySelector(".fva-picker-search");
      if (title) title.textContent = this.payload.label;
      this.clearError();
      if (search) {
        search.value = "";
        search.focus();
      }
      this.renderList();
    },

    renderList() {
      if (!this.root || !this.payload) return;
      const list = this.root.querySelector(".fva-picker-list");
      if (!list) return;
      list.innerHTML = this.filteredOptions
        .map(function (option, index) {
          return (
            '<li class="fva-picker-option' +
            (index === picker.highlightIndex ? " is-active" : "") +
            '" role="option" data-option-index="' +
            index +
            '">' +
            option.label +
            "</li>"
          );
        })
        .join("");
    },

    filterOptions(query) {
      const normalized = query.trim().toLowerCase();
      if (!this.payload) return;
      this.clearError();
      this.filteredOptions = !normalized
        ? this.payload.options.slice()
        : this.payload.options.filter(function (option) {
            return option.label.toLowerCase().includes(normalized);
          });
      this.highlightIndex = 0;
      this.renderList();
    },

    onKeyDown(event) {
      if (!picker.payload || picker.root?.hidden) return;
      const search = picker.root.querySelector(".fva-picker-search");
      const typingInSearch = event.target === search;

      if (event.key === "Escape") {
        event.preventDefault();
        picker.close();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        picker.highlightIndex = Math.min(picker.highlightIndex + 1, picker.filteredOptions.length - 1);
        picker.renderList();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        picker.highlightIndex = Math.max(picker.highlightIndex - 1, 0);
        picker.renderList();
      } else if (event.key === "Enter" && !typingInSearch) {
        event.preventDefault();
        picker.selectOption(picker.highlightIndex);
      } else if (event.key === "Enter" && typingInSearch && picker.filteredOptions.length) {
        event.preventDefault();
        picker.selectOption(picker.highlightIndex);
      }
    },

    selectOption(index) {
      const option = this.filteredOptions[index];
      if (!option || !this.payload) return;
      const element = this.payload.element;
      if (this.payload.type === "select" && element instanceof HTMLSelectElement) {
        const result = applyNativeSelectValue(element, option.value);
        if (!result.ok) {
          this.showError(result.reason);
          return;
        }
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (this.payload.type === "aria-combobox") {
        if (element instanceof HTMLElement) {
          element.textContent = option.label;
          element.setAttribute("aria-label", option.label);
        }
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
      this.close();
    },
  };

  const dropdownDetector = {
    enabled: false,

    enable() {
      if (this.enabled) return;
      this.enabled = true;
      document.addEventListener("mousedown", this.onMouseDown, true);
      document.addEventListener("focusin", this.onFocusIn, true);
      document.addEventListener("keydown", this.onKeyDown, true);
    },

    disable() {
      if (!this.enabled) return;
      this.enabled = false;
      document.removeEventListener("mousedown", this.onMouseDown, true);
      document.removeEventListener("focusin", this.onFocusIn, true);
      document.removeEventListener("keydown", this.onKeyDown, true);
    },

    onMouseDown(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const dropdown = target.closest(DROPDOWN_SELECTOR);
      if (!dropdown) return;

      if (dropdown instanceof HTMLSelectElement) {
        event.preventDefault();
        event.stopPropagation();
        dropdownDetector.handleFocus(dropdown);
      }
    },

    onFocusIn(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target instanceof HTMLSelectElement) return;
      if (target.matches("[role='combobox'], [aria-haspopup='listbox']")) {
        dropdownDetector.handleFocus(target);
      }
    },

    onKeyDown(event) {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (event.key !== " " && event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      dropdownDetector.handleFocus(target);
    },

    handleFocus(target, options) {
      options = options || {};
      if (!this.enabled && !options.forceOpen) return;
      if (!(target instanceof Element)) return;
      if (!target.matches(DROPDOWN_SELECTOR)) return;
      const payload = this.extractDropdown(target);
      if (payload) picker.open(payload);
    },

    extractDropdown(element) {
      if (element instanceof HTMLSelectElement) {
        if (element.disabled) return null;
        const options = Array.from(element.options)
          .filter(function (option) {
            return !option.disabled;
          })
          .map(function (option) {
            return { value: option.value, label: (option.textContent || option.value).trim() };
          });
        if (!options.length) return null;
        return {
          element: element,
          type: "select",
          label: this.getFieldLabel(element),
          options: options,
        };
      }
      if (element.matches("[role='combobox'], [aria-haspopup='listbox']")) {
        return {
          element: element,
          type: "aria-combobox",
          label: this.getFieldLabel(element),
          options: this.extractAriaOptions(element),
        };
      }
      return null;
    },

    getFieldLabel(element) {
      if (element.id) {
        const label = document.querySelector('label[for="' + CSS.escape(element.id) + '"]');
        if (label && label.textContent) return label.textContent.trim();
      }
      const aria = element.getAttribute("aria-label");
      if (aria) return aria;
      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        const labelEl = document.getElementById(labelledBy);
        if (labelEl && labelEl.textContent) return labelEl.textContent.trim();
      }
      if (element instanceof HTMLSelectElement && element.name) return element.name;
      return "Dropdown";
    },

    extractAriaOptions(element) {
      const panelId = element.getAttribute("aria-controls");
      if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
          return Array.from(panel.querySelectorAll("[role='option']")).map(function (option) {
            return {
              value: option.getAttribute("data-value") || (option.textContent || "").trim(),
              label: (option.textContent || "").trim(),
            };
          });
        }
      }
      return Array.from(document.querySelectorAll("[role='option']")).map(function (option) {
        return {
          value: option.getAttribute("data-value") || (option.textContent || "").trim(),
          label: (option.textContent || "").trim(),
        };
      });
    },
  };

  function applySettings(settings) {
    active = isHostAllowed(location.hostname, settings);

    if (!active) {
      themeManager.disable();
      formTracker.disable();
      dropdownDetector.disable();
      picker.close();
      hideBadge();
      return;
    }

    if (settings.devMode) {
      showBadge("Visionary Assist active", "#2f6f3e");
    } else {
      hideBadge();
    }

    pickerUseDarkTheme = settings.features.darkTheme && !themeForcedOff;
    picker.applyTheme();

    if (pickerUseDarkTheme) {
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

  function init() {
    showBadge("Visionary Assist loading…", "#555");
    getSettings().then(applySettings).catch(function (err) {
      showBadge("FVA error: " + err.message, "#8b2f2f");
    });
  }

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "sync" && changes.settings) {
      applySettings(mergeSettings(changes.settings.newValue));
    }
  });

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (message.type === "PING") {
      sendResponse({ ok: true, active: active });
      return;
    }
    if (message.type === "SETTINGS_UPDATED" || message.type === "APPLY_SETTINGS") {
      if (message.settings) {
        applySettings(message.settings);
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
      if (target) dropdownDetector.handleFocus(target, { forceOpen: true });
    }
  });

  init();
})();