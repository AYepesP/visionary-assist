const PICKER_ID = "fva-picker-root";

/** @param {HTMLSelectElement} select */
function captureSelectState(select) {
  const selectedAttributes = [];
  for (let i = 0; i < select.options.length; i++) {
    selectedAttributes.push(select.options[i].hasAttribute("selected"));
  }
  return {
    value: select.value,
    selectedIndex: select.selectedIndex,
    selectedAttributes,
    dataFvaSelectedValue: select.getAttribute("data-fva-selected-value"),
    hadPickerApplied: select.classList.contains("fva-picker-applied"),
    hadPickerPulse: select.classList.contains("fva-picker-applied-pulse"),
  };
}

/** @param {HTMLSelectElement} select @param {ReturnType<typeof captureSelectState>} snapshot */
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

/** @param {HTMLSelectElement} select @param {string} value */
function selectOptionValueExists(select, value) {
  for (let i = 0; i < select.options.length; i++) {
    const option = select.options[i];
    if (option.value === value && !option.disabled) return true;
  }
  return false;
}

/**
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

export class Picker {
  constructor() {
    this.root = null;
    this.payload = null;
    this.filteredOptions = [];
    this.highlightIndex = 0;
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  /**
   * @param {{ element: Element, type: string, label: string, options: Array<{ value: string, label: string }> }} payload
   */
  open(payload) {
    if (!payload.options.length) return;

    this.payload = payload;
    this.filteredOptions = [...payload.options];
    this.highlightIndex = 0;
    this.ensureRoot();
    this.render();
    this.root.hidden = false;
    document.addEventListener("keydown", this.onKeyDown, true);
  }

  close() {
    this.root?.setAttribute("hidden", "");
    document.removeEventListener("keydown", this.onKeyDown, true);
    this.payload = null;
  }

  ensureRoot() {
    if (this.root) return;

    this.root = document.createElement("div");
    this.root.id = PICKER_ID;
    this.root.innerHTML = `
      <div class="fva-picker-backdrop" data-action="close"></div>
      <section class="fva-picker-panel" role="dialog" aria-modal="true" aria-label="Dropdown picker">
        <header class="fva-picker-header">
          <h2 class="fva-picker-title"></h2>
          <button type="button" class="fva-picker-close" data-action="close" aria-label="Close picker">×</button>
        </header>
        <input class="fva-picker-search" type="search" placeholder="Search options..." aria-label="Search dropdown options" />
        <p class="fva-picker-error" role="alert" hidden></p>
        <ul class="fva-picker-list" role="listbox"></ul>
      </section>
    `;

    document.body.appendChild(this.root);

    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = chrome.runtime.getURL("styles/picker.css");
    document.head.appendChild(style);

    this.root.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.dataset.action === "close") {
        this.close();
        return;
      }

      const option = target.closest("[data-option-index]");
      if (option instanceof HTMLElement) {
        const index = Number(option.dataset.optionIndex);
        this.selectOption(index);
      }
    });

    const search = this.root.querySelector(".fva-picker-search");
    search?.addEventListener("input", () => {
      this.filterOptions(search.value);
    });
  }

  clearError() {
    const error = this.root?.querySelector(".fva-picker-error");
    if (!error) return;
    error.textContent = "";
    error.hidden = true;
  }

  showError(message) {
    const error = this.root?.querySelector(".fva-picker-error");
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }

  render() {
    if (!this.root || !this.payload) return;

    const title = this.root.querySelector(".fva-picker-title");
    const list = this.root.querySelector(".fva-picker-list");
    const search = this.root.querySelector(".fva-picker-search");

    if (title) title.textContent = this.payload.label;
    this.clearError();
    if (search) {
      search.value = "";
      search.focus();
    }
    if (!list) return;

    list.innerHTML = this.filteredOptions
      .map(
        (option, index) => `
          <li
            class="fva-picker-option${index === this.highlightIndex ? " is-active" : ""}"
            role="option"
            data-option-index="${index}"
          >${option.label}</li>
        `
      )
      .join("");
  }

  filterOptions(query) {
    const normalized = query.trim().toLowerCase();
    if (!this.payload) return;

    this.clearError();
    this.filteredOptions = !normalized
      ? [...this.payload.options]
      : this.payload.options.filter((option) =>
          option.label.toLowerCase().includes(normalized)
        );

    this.highlightIndex = 0;
    this.render();
  }

  onKeyDown(event) {
    if (!this.payload || this.root?.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.highlightIndex = Math.min(this.highlightIndex + 1, this.filteredOptions.length - 1);
      this.render();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.highlightIndex = Math.max(this.highlightIndex - 1, 0);
      this.render();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      this.selectOption(this.highlightIndex);
    }
  }

  selectOption(index) {
    const option = this.filteredOptions[index];
    if (!option || !this.payload) return;

    const applied = this.applySelection(this.payload.element, this.payload.type, option);
    if (!applied) return;
    this.close();
  }

  /**
   * @param {Element} element
   * @param {string} type
   * @param {{ value: string, label: string }} option
   */
  applySelection(element, type, option) {
    if (type === "select" && element instanceof HTMLSelectElement) {
      const result = applyNativeSelectValue(element, option.value);
      if (!result.ok) {
        this.showError(result.reason);
        return false;
      }
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    if (type === "aria-combobox") {
      if (element instanceof HTMLElement) {
        element.textContent = option.label;
        element.setAttribute("aria-label", option.label);
      }
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    return false;
  }
}