(function () {
  const scriptOrigin = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : window.location.origin;

  const config = {
    apiBaseUrl: window.THINKIFIC_SUNBIRD_API_BASE || `${scriptOrigin}/public`,
    sourceLanguage: window.THINKIFIC_SUNBIRD_SOURCE_LANGUAGE || "eng",
    languages: window.THINKIFIC_SUNBIRD_LANGUAGES || null,
    protectedTerms: window.THINKIFIC_SUNBIRD_PROTECTED_TERMS || [],
    trackingEnabled: window.THINKIFIC_SUNBIRD_TRACKING !== false,
    fallbackLanguages: [
      { code: "eng", label: "English" },
      { code: "ach", label: "Acholi" },
      { code: "teo", label: "Ateso" },
      { code: "lug", label: "Luganda" },
      { code: "lgg", label: "Lugbara" },
      { code: "nyn", label: "Runyankole" }
    ],
    batchSize: 6,
    maxNodesPerRun: 90,
    viewportBuffer: 900
  };

  const state = {
    originalText: new WeakMap(),
    cache: new Map(),
    currentLanguage: "eng",
    currentLabel: "English",
    translating: false,
    open: false
  };

  function getVisitorId() {
    const key = "thinkific_sunbird_visitor_id";
    try {
      const existing = window.localStorage.getItem(key);
      if (existing) return existing;
      const created = `snb_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(key, created);
      return created;
    } catch {
      return "";
    }
  }

  function getUserEmail() {
    const meta = document.querySelector('meta[name="user-email"], meta[name="thinkific-user-email"]');
    if (meta?.content) return meta.content;
    if (window.currentUser?.email) return window.currentUser.email;
    if (window.Thinkific?.current_user?.email) return window.Thinkific.current_user.email;
    if (window.thinkific?.current_user?.email) return window.thinkific.current_user.email;
    return "";
  }

  function getFootprint(extra = {}) {
    return {
      visitorId: getVisitorId(),
      userEmail: getUserEmail(),
      sourceLanguage: config.sourceLanguage,
      currentLanguage: state.currentLanguage,
      pageTitle: document.title,
      pageUrl: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...extra
    };
  }

  function trackWidgetEvent(type, extra = {}) {
    if (!config.trackingEnabled) return;

    const payload = getFootprint({ type, ...extra });

    if (window.mixpanel?.track) {
      window.mixpanel.track(`Translation Widget ${type}`, payload);
    }

    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${config.apiBaseUrl}/widget-events`, new Blob([body], { type: "application/json" }));
      } else {
        fetch(`${config.apiBaseUrl}/widget-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true
        }).catch(() => {});
      }
    } catch {
      // Tracking should never block translation.
    }
  }

  function isVisibleElement(el) {
    if (!el || !document.documentElement.contains(el)) return false;

    let current = el;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0" ||
        current.getAttribute("aria-hidden") === "true"
      ) {
        return false;
      }
      current = current.parentElement;
    }

    const rects = Array.from(el.getClientRects());
    if (!rects.length) return false;

    return rects.some((rect) =>
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= -config.viewportBuffer &&
      rect.top <= window.innerHeight + config.viewportBuffer
    );
  }

  function getTranslatableText(value) {
    const text = value.replace(/\s+/g, " ").trim();
    if (text.length < 2) return "";
    if (text.length > 500) return "";
    if (/^[\d\s:.,%$/#()\-+]+$/.test(text)) return "";
    return text;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getProtectedTerms() {
    return Array.isArray(config.protectedTerms)
      ? config.protectedTerms.map((term) => String(term || "").trim()).filter(Boolean)
      : [];
  }

  function protectTerms(text) {
    const terms = getProtectedTerms();
    if (!terms.length) return { text, placeholders: [] };

    const placeholders = [];
    let protectedText = text;

    terms
      .sort((first, second) => second.length - first.length)
      .forEach((term) => {
        const token = `__SNB_PROTECTED_${placeholders.length}__`;
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapeRegExp(term)})(?=$|[^\\p{L}\\p{N}_])`, "gu");
        let matched = false;
        protectedText = protectedText.replace(pattern, (match, prefix, value) => {
          matched = true;
          return `${prefix}${token}`;
        });
        if (matched) placeholders.push({ token, value: term });
      });

    return { text: protectedText, placeholders };
  }

  function restoreProtectedTerms(text, placeholders = []) {
    return placeholders.reduce(
      (value, placeholder) => value.replaceAll(placeholder.token, placeholder.value),
      text || ""
    );
  }

  function shouldSkipNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (!node.nodeValue || !getTranslatableText(node.nodeValue)) return true;
    if (parent.closest("[data-snb]")) return true;
    if (parent.closest("[data-snb-no-translate], [translate='no'], .snb-no-translate, .notranslate")) return true;
    if (parent.closest("script,style,noscript,svg,canvas,code,pre,input,textarea,select,video,audio,iframe")) return true;
    if (parent.isContentEditable) return true;
    if (!isVisibleElement(parent)) return true;
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

    return nodes.slice(0, config.maxNodesPerRun);
  }

  function chunks(items, size) {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
  }

  function applyTranslatedText(node, translatedText) {
    const original = state.originalText.get(node) || node.nodeValue;
    const leading = original.match(/^\s*/)?.[0] || "";
    const trailing = original.match(/\s*$/)?.[0] || "";
    node.nodeValue = `${leading}${translatedText || getTranslatableText(original)}${trailing}`;
  }

  async function translateBatch(items, targetLanguage) {
    const texts = items.map((item) => item.text);
    const key = `${targetLanguage}:${JSON.stringify(texts)}`;
    if (state.cache.has(key)) return state.cache.get(key);

    const res = await fetch(`${config.apiBaseUrl}/translate/page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, sourceLanguage: config.sourceLanguage, targetLanguage })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const error = new Error(body.error || `Translation failed: ${res.status}`);
      error.code = body.code || "";
      error.status = res.status;
      throw error;
    }

    const payload = await res.json();
    const translations = (payload.translations || []).map((translation, index) =>
      restoreProtectedTerms(translation, items[index]?.placeholders)
    );
    state.cache.set(key, translations);
    return translations;
  }

  async function switchLanguage(code, label) {
    if (state.translating || code === state.currentLanguage) {
      closeMenu();
      return;
    }

    const startedAt = Date.now();
    state.translating = true;
    closeMenu();
    setFabState("loading", "Finding text...");
    trackWidgetEvent("Language Selected", {
      targetLanguage: code,
      targetLabel: label
    });

    try {
      const nodes = collectTextNodes();
      if (code === config.sourceLanguage) {
        nodes.forEach((n) => {
          n.nodeValue = state.originalText.get(n) || n.nodeValue;
        });
      } else {
        let completed = 0;
        for (const batch of chunks(nodes, config.batchSize)) {
          const originals = batch.map((n) => {
            const original = getTranslatableText(state.originalText.get(n) || n.nodeValue);
            return protectTerms(original);
          });
          const translations = await translateBatch(originals, code);
          batch.forEach((n, i) => applyTranslatedText(n, translations[i]));
          completed += batch.length;
          setFabState("loading", `Translating ${completed}/${nodes.length}`);
        }
      }

      state.currentLanguage = code;
      state.currentLabel = label;
      setFabState("done");
      trackWidgetEvent("Translation Completed", {
        targetLanguage: code,
        targetLabel: label,
        nodeCount: nodes.length,
        translatedCount: code === config.sourceLanguage ? 0 : nodes.length,
        durationMs: Date.now() - startedAt,
        status: "success"
      });
    } catch (err) {
      const message = err.code === "quota_exceeded" || err.status === 429
        ? "Daily translation quota reached"
        : err.message;
      setFabState("error", message);
      trackWidgetEvent("Translation Failed", {
        targetLanguage: code,
        targetLabel: label,
        durationMs: Date.now() - startedAt,
        status: "failure",
        error: message
      });
    } finally {
      state.translating = false;
    }
  }

  async function loadLanguages() {
    if (Array.isArray(config.languages) && config.languages.length) return config.languages;
    try {
      const res = await fetch(`${config.apiBaseUrl}/languages`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const src = data.sourceLanguage || { code: "eng", name: "English" };
      return [
        { code: src.code, label: src.name },
        ...(data.targetLanguages || []).map((l) => ({ code: l.code, label: l.name }))
      ];
    } catch {
      return config.fallbackLanguages;
    }
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    });
    children.forEach((c) => c && node.appendChild(c));
    return node;
  }

  let fabEl;
  let fabIcon;
  let fabLabel;
  let menuEl;
  let tooltipEl;

  const GLOBE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  const SPINNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" class="snb-spin"/></svg>`;

  function setFabState(stateName, message) {
    if (!fabEl) return;
    fabIcon.innerHTML = stateName === "loading" ? SPINNER_SVG : GLOBE_SVG;
    fabEl.setAttribute("aria-label", stateName === "loading" ? "Translating..." : "Switch language");

    if (stateName === "done") {
      fabLabel.textContent = state.currentLabel;
      fabEl.dataset.snbActive = "true";
      showTooltip("");
    } else if (stateName === "error") {
      showTooltip(message || "Translation failed");
      setTimeout(() => showTooltip(""), 3500);
      fabLabel.textContent = state.currentLabel;
    } else {
      showTooltip(message || "Translating...");
      fabLabel.textContent = "...";
    }
  }

  function showTooltip(message) {
    if (!tooltipEl) return;
    tooltipEl.textContent = message;
    tooltipEl.style.opacity = message ? "1" : "0";
  }

  function openMenu() {
    if (!menuEl) return;
    state.open = true;
    trackWidgetEvent("Menu Opened");
    menuEl.style.display = "block";
    requestAnimationFrame(() => {
      menuEl.style.opacity = "1";
      menuEl.style.transform = "translateY(0)";
    });
    fabEl.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    if (!menuEl) return;
    state.open = false;
    menuEl.style.opacity = "0";
    menuEl.style.transform = "translateY(8px)";
    setTimeout(() => {
      if (!state.open) menuEl.style.display = "none";
    }, 200);
    fabEl.setAttribute("aria-expanded", "false");
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      [data-snb="root"] {
        all: initial;
        position: fixed;
        bottom: 24px;
        right: 20px;
        z-index: 2147483000;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }
      [data-snb="tooltip"] {
        background: #1e293b;
        border-radius: 7px;
        color: #f1f5f9;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.3;
        max-width: 220px;
        opacity: 0;
        padding: 6px 10px;
        pointer-events: none;
        text-align: right;
        transition: opacity 0.2s;
        white-space: nowrap;
      }
      [data-snb="menu"] {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        box-shadow: 0 12px 36px rgba(15,23,42,0.18);
        display: none;
        max-height: 320px;
        min-width: 180px;
        opacity: 0;
        overflow-y: auto;
        padding: 6px;
        transform: translateY(8px);
        transition: opacity 0.18s, transform 0.18s;
      }
      [data-snb="menu-item"] {
        all: unset;
        border-radius: 9px;
        color: #1e293b;
        cursor: pointer;
        display: block;
        font-size: 14px;
        font-weight: 600;
        padding: 9px 14px;
        width: 100%;
        box-sizing: border-box;
        transition: background 0.12s;
      }
      [data-snb="menu-item"]:hover {
        background: #f0fdf4;
        color: #059669;
      }
      [data-snb="menu-item"][aria-selected="true"] {
        background: #06b981;
        color: #fff;
      }
      [data-snb="fab"] {
        all: unset;
        align-items: center;
        background: #06b981;
        border-radius: 50px;
        box-shadow: 0 4px 18px rgba(6,185,129,0.4);
        color: #fff;
        cursor: pointer;
        display: flex;
        gap: 7px;
        padding: 0 18px 0 14px;
        height: 48px;
        transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
        white-space: nowrap;
      }
      [data-snb="fab"]:hover {
        background: #059669;
        box-shadow: 0 6px 24px rgba(6,185,129,0.5);
        transform: translateY(-1px);
      }
      [data-snb="fab"]:active { transform: scale(0.97); }
      [data-snb="fab-label"] {
        font-size: 14px;
        font-weight: 700;
        line-height: 1;
      }
      @keyframes snb-rotate { to { transform: rotate(360deg); } }
      .snb-spin { animation: snb-rotate 0.9s linear infinite; transform-origin: center; }
      @media (max-width: 600px) {
        [data-snb="root"] { bottom: 16px; right: 14px; }
        [data-snb="menu"] { max-height: 260px; min-width: 160px; }
      }
    `;
    document.head.appendChild(style);
  }

  async function mount() {
    if (document.querySelector("[data-snb='root']")) return;

    const languages = await loadLanguages();
    injectStyles();

    tooltipEl = el("div", { "data-snb": "tooltip" });

    menuEl = el("div", { "data-snb": "menu", role: "listbox", "aria-label": "Select language" });
    languages.forEach(({ code, label }) => {
      const item = el("button", {
        "data-snb": "menu-item",
        type: "button",
        role: "option",
        "aria-selected": code === state.currentLanguage ? "true" : "false",
        text: label
      });
      item.addEventListener("click", () => {
        menuEl.querySelectorAll("[data-snb='menu-item']").forEach((b) => b.setAttribute("aria-selected", "false"));
        item.setAttribute("aria-selected", "true");
        switchLanguage(code, label);
      });
      menuEl.appendChild(item);
    });

    fabIcon = el("span", { "data-snb": "fab-icon", html: GLOBE_SVG });
    fabLabel = el("span", { "data-snb": "fab-label", text: "Language" });

    fabEl = el("button", {
      "data-snb": "fab",
      type: "button",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
      "aria-label": "Switch language"
    }, [fabIcon, fabLabel]);

    fabEl.addEventListener("click", () => state.open ? closeMenu() : openMenu());

    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-snb='root']")) closeMenu();
    });

    const root = el("div", { "data-snb": "root" }, [tooltipEl, menuEl, fabEl]);
    document.body.appendChild(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
