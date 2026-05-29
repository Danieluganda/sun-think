(function () {
  const scriptOrigin = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : window.location.origin;

  const config = {
    apiBaseUrl: window.THINKIFIC_SUNBIRD_API_BASE || `${scriptOrigin}/public`,
    sourceLanguage: window.THINKIFIC_SUNBIRD_SOURCE_LANGUAGE || "eng",
    languages: window.THINKIFIC_SUNBIRD_LANGUAGES || null,
    fallbackLanguages: [
      { code: "eng", label: "English" },
      { code: "ach", label: "Acholi" },
      { code: "teo", label: "Ateso" },
      { code: "lug", label: "Luganda" },
      { code: "lgg", label: "Lugbara" },
      { code: "nyn", label: "Runyankole" }
    ],
    batchSize: 12
  };

  const state = {
    originalText: new WeakMap(),
    cache: new Map(),
    currentLanguage: "eng",
    translating: false
  };

  function shouldSkipNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (!node.nodeValue || !node.nodeValue.trim()) return true;
    if (parent.closest("[data-sunbird-language-switcher]")) return true;
    if (parent.closest("script, style, noscript, svg, canvas, code, pre, input, textarea, select")) return true;
    if (parent.isContentEditable) return true;
    return false;
  }

  function collectTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node = walker.nextNode();

    while (node) {
      if (!shouldSkipNode(node)) {
        if (!state.originalText.has(node)) state.originalText.set(node, node.nodeValue);
        nodes.push(node);
      }
      node = walker.nextNode();
    }

    return nodes;
  }

  function chunks(items, size) {
    const output = [];
    for (let index = 0; index < items.length; index += size) {
      output.push(items.slice(index, index + size));
    }
    return output;
  }

  async function translateBatch(texts, targetLanguage) {
    const cacheKey = `${targetLanguage}:${JSON.stringify(texts)}`;
    if (state.cache.has(cacheKey)) return state.cache.get(cacheKey);

    const response = await fetch(`${config.apiBaseUrl}/translate/page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts,
        sourceLanguage: config.sourceLanguage,
        targetLanguage
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Translation failed: ${response.status}`);
    }

    const payload = await response.json();
    state.cache.set(cacheKey, payload.translations);
    return payload.translations;
  }

  async function switchLanguage(targetLanguage) {
    if (state.translating || targetLanguage === state.currentLanguage) return;
    state.translating = true;
    setButtonsDisabled(true);
    setStatus("Translating...");

    try {
      const nodes = collectTextNodes();
      if (targetLanguage === "eng") {
        nodes.forEach((node) => {
          node.nodeValue = state.originalText.get(node) || node.nodeValue;
        });
      } else {
        for (const batch of chunks(nodes, config.batchSize)) {
          const originals = batch.map((node) => state.originalText.get(node) || node.nodeValue);
          const translations = await translateBatch(originals, targetLanguage);
          batch.forEach((node, index) => {
            node.nodeValue = translations[index] || node.nodeValue;
          });
        }
      }

      state.currentLanguage = targetLanguage;
      setActiveLanguage(targetLanguage);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      state.translating = false;
      setButtonsDisabled(false);
    }
  }

  function setActiveLanguage(language) {
    document.querySelectorAll("[data-sunbird-lang]").forEach((button) => {
      const isActive = button.dataset.sunbirdLang === language;
      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("active", button.dataset.sunbirdLang === language);
    });

    const select = document.querySelector("[data-sunbird-language-select]");
    if (select) select.value = language;
  }

  function setButtonsDisabled(disabled) {
    document.querySelectorAll("[data-sunbird-lang]").forEach((button) => {
      button.disabled = disabled;
    });
    const select = document.querySelector("[data-sunbird-language-select]");
    if (select) select.disabled = disabled;
  }

  function setStatus(message) {
    const status = document.querySelector("[data-sunbird-status]");
    if (status) status.textContent = message;
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      [data-sunbird-language-switcher] {
        align-items: center;
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid #d9e3ee;
        border-radius: 14px;
        box-shadow: 0 16px 42px rgba(15, 23, 42, 0.18);
        display: flex;
        gap: 6px;
        max-width: calc(100vw - 32px);
        padding: 7px;
        position: fixed;
        right: 18px;
        top: 92px;
        z-index: 2147483000;
      }
      [data-sunbird-lang] {
        background: transparent;
        border: 0;
        border-radius: 10px;
        color: #202333;
        cursor: pointer;
        font: 700 14px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        min-height: 36px;
        padding: 0 13px;
        white-space: nowrap;
      }
      [data-sunbird-lang]:hover {
        background: #eef7f3;
      }
      [data-sunbird-lang].active {
        background: #06b981;
        color: #ffffff;
      }
      [data-sunbird-lang]:disabled {
        cursor: wait;
        opacity: 0.72;
      }
      [data-sunbird-status] {
        color: #5b6472;
        font: 600 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        max-width: 220px;
        padding: 0 8px;
      }
      [data-sunbird-language-select] {
        appearance: none;
        background: #06b981;
        border: 0;
        border-radius: 10px;
        color: #ffffff;
        cursor: pointer;
        font: 800 14px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        min-height: 38px;
        min-width: 180px;
        padding: 0 36px 0 12px;
      }
      [data-sunbird-language-select-wrap] {
        position: relative;
      }
      [data-sunbird-language-select-wrap]::after {
        color: #ffffff;
        content: "v";
        font: 800 12px/1 system-ui, sans-serif;
        pointer-events: none;
        position: absolute;
        right: 12px;
        top: 13px;
      }
      @media (max-width: 760px) {
        [data-sunbird-language-switcher] {
          bottom: 14px;
          left: 10px;
          overflow-x: auto;
          right: 10px;
          top: auto;
          justify-content: flex-start;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function loadLanguages() {
    if (Array.isArray(config.languages) && config.languages.length) return config.languages;

    try {
      const response = await fetch(`${config.apiBaseUrl}/languages`);
      if (!response.ok) throw new Error(`Languages failed: ${response.status}`);
      const payload = await response.json();
      const source = payload.sourceLanguage || { code: "eng", name: "English" };
      return [
        { code: source.code, label: source.name },
        ...(payload.targetLanguages || []).map((language) => ({
          code: language.code,
          label: language.name
        }))
      ];
    } catch {
      return config.fallbackLanguages;
    }
  }

  async function mountSwitcher() {
    if (document.querySelector("[data-sunbird-language-switcher]")) return;

    const languages = await loadLanguages();
    injectStyles();
    const wrapper = document.createElement("div");
    wrapper.dataset.sunbirdLanguageSwitcher = "true";

    if (languages.length > 5) {
      const selectWrap = document.createElement("div");
      selectWrap.dataset.sunbirdLanguageSelectWrap = "true";
      const select = document.createElement("select");
      select.dataset.sunbirdLanguageSelect = "true";
      select.setAttribute("aria-label", "Select language");
      languages.forEach((language) => {
        const option = document.createElement("option");
        option.value = language.code;
        option.textContent = language.label;
        select.appendChild(option);
      });
      select.addEventListener("change", () => switchLanguage(select.value));
      selectWrap.appendChild(select);
      wrapper.appendChild(selectWrap);
    } else {
      languages.forEach((language) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.sunbirdLang = language.code;
        button.textContent = language.label;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => switchLanguage(language.code));
        wrapper.appendChild(button);
      });
    }

    const status = document.createElement("span");
    status.dataset.sunbirdStatus = "true";
    wrapper.appendChild(status);

    document.body.appendChild(wrapper);
    setActiveLanguage(state.currentLanguage);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSwitcher);
  } else {
    mountSwitcher();
  }
})();
