// ============================================
// AI Chat Pro Client – Settings Page Logic (Web App)
// Uses window.Storage instead of chrome.storage.local
// ============================================

(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    provider: "perplexity",
    apiKeys: {
      perplexity: "",
      openai: "",
      anthropic: "",
      gemini: "",
      lmstudio: "",
    },
    baseUrls: {
      perplexity: "",
      openai: "",
      anthropic: "",
      gemini: "",
      lmstudio: "http://localhost:1234",
    },
    models: {
      perplexity: "sonar",
      openai: "gpt-4o-mini",
      anthropic: "claude-sonnet-4-6",
      gemini: "gemini-2.5-flash",
      lmstudio: "",
    },
    customModels: {
      perplexity: [],
      openai: [],
      anthropic: [],
      gemini: [],
      lmstudio: [],
    },
    modelCheckCache: {
      perplexity: {},
      openai: {},
      anthropic: {},
      gemini: {},
      lmstudio: {},
    },
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt:
      "You are a helpful, accurate, and friendly AI assistant. Provide clear and concise answers. Use markdown formatting when appropriate.",
    theme: "dark",
    fontSize: 14,
    language: "system",
    sendWithEnter: true,
    streamResponses: true,
    showSources: true,
  };

  const t = (key, ...args) => (window.i18n ? window.i18n.t(key, ...args) : key);

  const PROVIDER_CONFIG = {
    perplexity: {
      keyLabel: "Perplexity API Key",
      placeholder: "pplx-xxxxxxxxxxxxxxxxxxxx",
      helpUrl: "https://docs.perplexity.ai/docs/getting-started/overview",
      models: [
        { value: "sonar", label: "Sonar – Fast & efficient" },
        { value: "sonar-pro", label: "Sonar Pro – Higher quality" },
        { value: "sonar-reasoning", label: "Sonar Reasoning – Logical thinking" },
        { value: "sonar-reasoning-pro", label: "Sonar Reasoning Pro – Best quality" },
      ],
    },
    openai: {
      keyLabel: "OpenAI API Key",
      placeholder: "sk-xxxxxxxxxxxxxxxxxxxx",
      helpUrl: "https://platform.openai.com/api-keys",
      models: [
        { value: "gpt-4o", label: "GPT-4o – Latest model" },
        { value: "gpt-4o-mini", label: "GPT-4o Mini – Fast & cheap" },
        { value: "gpt-4-turbo", label: "GPT-4 Turbo – High quality" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo – Budget" },
      ],
    },
    anthropic: {
      keyLabel: "Anthropic API Key",
      placeholder: "sk-ant-xxxxxxxxxxxxxxxxxxxx",
      helpUrl: "https://console.anthropic.com/settings/keys",
      models: [
        { value: "claude-opus-4-6", label: "Claude Opus 4.6 – Most capable" },
        { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 – Balanced" },
        { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 – Fast & efficient" },
      ],
    },
    gemini: {
      keyLabel: "Google API Key",
      placeholder: "AIzaSy-xxxxxxxxxxxxxxxxxxxx",
      helpUrl: "https://aistudio.google.com/app/apikey",
      models: [
        { value: "gemini-2.5-flash",             label: "Gemini 2.5 Flash – Free, recommended" },
        { value: "gemini-2.5-flash-lite",         label: "Gemini 2.5 Flash Lite – Free, fastest" },
        { value: "gemini-2.5-pro",               label: "Gemini 2.5 Pro – Free, most capable" },
        { value: "gemini-2.0-flash",             label: "Gemini 2.0 Flash – Stable" },
        { value: "gemini-3-flash-preview",        label: "Gemini 3 Flash – Preview" },
        { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite – Preview" },
        { value: "gemini-3.1-pro-preview",        label: "Gemini 3.1 Pro – Preview" },
      ],
    },
    lmstudio: {
      keyLabel: "LM Studio API Key (optional)",
      placeholder: "lm-studio-key-optional",
      helpUrl: null,
      keyHint: "Optional. Only sent if your LM Studio server requires authentication.",
      models: [],
    },
  };

  let settings = { ...DEFAULT_SETTINGS };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ---- DOM ----
  const dom = {
    app: $("#app"),
    providerSelect: $("#provider-select"),
    apiKeyGroup: $("#api-key-group"),
    apiKeyLabel: $("#api-key-label"),
    apiKeyHelp: $("#api-key-help"),
    apiKey: $("#api-key"),
    apiKeyHint: $("#api-key-hint"),
    toggleKeyVis: $("#toggle-key-visibility"),
    lmStudioUrlGroup: $("#lmstudio-url-group"),
    lmStudioUrl: $("#lmstudio-url"),
    advancedUrlGroup: $("#advanced-url-group"),
    baseUrl: $("#base-url"),
    btnTestApi: $("#btn-test-api"),
    apiTestResult: $("#api-test-result"),
    modelSelect: $("#model-select"),
    lmStudioModelGroup: $("#lmstudio-model-group"),
    lmStudioModel: $("#lmstudio-model"),
    lmStudioModelHint: $("#lmstudio-model-hint"),
    btnLoadModels: $("#btn-load-models"),
    btnCheckModels: $("#btn-check-models"),
    modelCheckResults: $("#model-check-results"),
    customModelInput: $("#custom-model-input"),
    btnAddModel: $("#btn-add-model"),
    customModelList: $("#custom-model-list"),
    temperature: $("#temperature"),
    temperatureValue: $("#temperature-value"),
    maxTokens: $("#max-tokens"),
    maxTokensValue: $("#max-tokens-value"),
    systemPrompt: $("#system-prompt"),
    fontSize: $("#font-size"),
    fontSizeValue: $("#font-size-value"),
    languageSelect: $("#language-select"),
    sendWithEnter: $("#send-with-enter"),
    showSources: $("#show-sources"),
    saveStatus: $("#save-status"),
    statConversations: $("#stat-conversations"),
    statMessages: $("#stat-messages"),
    btnExportAll: $("#btn-export-all"),
    btnImportAll: $("#btn-import-all"),
    importFileInput: $("#import-file-input"),
    btnClearAll: $("#btn-clear-all"),
    btnResetSettings: $("#btn-reset-settings"),
    btnClearCache: $("#btn-clear-cache"),
    messageList: $("#message-list"),
    btnClearMessages: $("#btn-clear-messages"),
  };

  // ---- Init ----
  async function init() {
    await loadSettings();
    applyLanguage();
    if (window.i18n) window.i18n.applyTranslations();
    populateUI();
    bindEvents();
    loadStats();
    if (window.announcement) {
      window.announcement.fetch(false).finally(() => renderMessageHistory());
    } else {
      renderMessageHistory();
    }
  }

  function applyLanguage() {
    const lang = settings.language || "system";
    if (lang === "system") {
      localStorage.removeItem("ai-chat-lang");
    } else {
      localStorage.setItem("ai-chat-lang", lang);
    }
  }

  async function loadSettings() {
    const data = await window.Storage.get("settings");
    settings = data.settings || { ...DEFAULT_SETTINGS };
    // Migrate legacy schema
    if (!settings.provider) {
      settings.provider = "perplexity";
      settings.apiKeys = {
        perplexity: settings.apiKey || "",
        openai: "",
        anthropic: "",
        gemini: "",
        lmstudio: "",
      };
      settings.models = {
        perplexity: settings.model || "sonar",
        openai: "gpt-4o-mini",
        anthropic: "claude-sonnet-4-6",
        gemini: "gemini-2.5-flash",
        lmstudio: "",
      };
    }
    if (!settings.baseUrls) {
      settings.baseUrls = {
        perplexity: "",
        openai: "",
        anthropic: "",
        gemini: "",
        lmstudio: settings.lmStudioUrl || "http://localhost:1234",
      };
      delete settings.lmStudioUrl;
    }
    settings.apiKeys = { ...DEFAULT_SETTINGS.apiKeys, ...(settings.apiKeys || {}) };
    settings.models = settings.models || DEFAULT_SETTINGS.models;
    settings.baseUrls = settings.baseUrls || { ...DEFAULT_SETTINGS.baseUrls };
    settings.customModels = settings.customModels || {
      perplexity: [], openai: [], anthropic: [], gemini: [], lmstudio: [],
    };
    settings.modelCheckCache = settings.modelCheckCache || {
      perplexity: {}, openai: {}, anthropic: {}, gemini: {}, lmstudio: {},
    };
    if (!settings.language) settings.language = "system";
  }

  async function saveSettings() {
    await window.Storage.set({ settings });
    showSaveStatus();
  }

  function showSaveStatus() {
    dom.saveStatus.classList.remove("hidden");
    clearTimeout(showSaveStatus._timer);
    showSaveStatus._timer = setTimeout(() => {
      dom.saveStatus.classList.add("hidden");
    }, 2000);
  }

  // ---- Populate UI ----
  function populateUI() {
    applyTheme();

    const themeRadio = $(`input[name="theme"][value="${settings.theme}"]`);
    if (themeRadio) themeRadio.checked = true;

    dom.providerSelect.value = settings.provider || "perplexity";
    updateProviderUI(settings.provider || "perplexity");

    dom.temperature.value = settings.temperature;
    dom.temperatureValue.textContent = settings.temperature;

    dom.maxTokens.value = settings.maxTokens;
    dom.maxTokensValue.textContent = settings.maxTokens;

    dom.systemPrompt.value = settings.systemPrompt;

    dom.fontSize.value = settings.fontSize;
    dom.fontSizeValue.textContent = settings.fontSize + "px";

    if (dom.languageSelect) {
      dom.languageSelect.value = settings.language || "system";
    }

    dom.sendWithEnter.checked = settings.sendWithEnter;
    dom.showSources.checked = settings.showSources;
  }

  async function loadLmStudioModels() {
    const baseUrl = (
      dom.lmStudioUrl.value.trim() ||
      settings.baseUrls?.lmstudio ||
      "http://localhost:1234"
    ).replace(/\/$/, "");
    const apiKey = dom.apiKey.value.trim() || settings.apiKeys?.lmstudio || "";

    dom.btnLoadModels.disabled = true;
    dom.btnLoadModels.style.opacity = "0.5";
    dom.lmStudioModelHint.textContent = t("model.lmLoading");

    try {
      const response = await fetch(`${baseUrl}/v1/models`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
      if (!response.ok) throw new Error(`${response.status}`);

      const data = await response.json();
      const models = (data.data || []).map((m) => m.id).filter(Boolean);

      if (models.length === 0) {
        dom.lmStudioModelHint.textContent = t("model.lmNone");
        return;
      }

      const current = settings.models?.lmstudio || "";
      dom.lmStudioModel.innerHTML = models
        .map((id) => `<option value="${id}" ${id === current ? "selected" : ""}>${id}</option>`)
        .join("");

      if (!current || !models.includes(current)) {
        settings.models.lmstudio = models[0];
        dom.lmStudioModel.value = models[0];
        saveSettings();
      }

      dom.lmStudioModelHint.textContent = t("model.lmFound", models.length);
    } catch (err) {
      dom.lmStudioModelHint.textContent = t("model.lmConnError", err.message);
    } finally {
      dom.btnLoadModels.disabled = false;
      dom.btnLoadModels.style.opacity = "";
    }
  }

  function updateProviderUI(provider) {
    const cfg = PROVIDER_CONFIG[provider];
    const isLmStudio = provider === "lmstudio";

    if (isLmStudio) {
      dom.apiKeyGroup.classList.remove("hidden");
      dom.lmStudioUrlGroup.classList.remove("hidden");
      dom.advancedUrlGroup.classList.add("hidden");
      dom.apiKeyLabel.textContent = cfg.keyLabel;
      dom.apiKey.placeholder = cfg.placeholder;
      dom.apiKey.type = "password";
      dom.apiKey.value = settings.apiKeys?.lmstudio || "";
      dom.apiKeyHint.textContent = cfg.keyHint;
      dom.apiKeyHelp.style.display = "none";
      dom.lmStudioUrl.value = settings.baseUrls?.lmstudio || "http://localhost:1234";
    } else {
      dom.apiKeyGroup.classList.remove("hidden");
      dom.lmStudioUrlGroup.classList.add("hidden");
      dom.advancedUrlGroup.classList.remove("hidden");
      dom.advancedUrlGroup.removeAttribute("open");
      dom.apiKeyLabel.textContent = cfg.keyLabel;
      dom.apiKey.placeholder = cfg.placeholder;
      dom.apiKey.type = "password";
      dom.apiKey.value = settings.apiKeys?.[provider] || "";
      dom.apiKeyHint.textContent = t("api.keyHint");
      const storedUrl = settings.baseUrls?.[provider] || "";
      dom.baseUrl.value = storedUrl;
      dom.baseUrl.placeholder =
        {
          perplexity: "https://api.perplexity.ai",
          openai: "https://api.openai.com",
          anthropic: "https://api.anthropic.com",
          gemini: "https://generativelanguage.googleapis.com",
        }[provider] || "";
      if (cfg.helpUrl) {
        dom.apiKeyHelp.href = cfg.helpUrl;
        dom.apiKeyHelp.style.display = "";
      } else {
        dom.apiKeyHelp.style.display = "none";
      }
    }

    if (isLmStudio) {
      dom.modelSelect.classList.add("hidden");
      dom.lmStudioModelGroup.classList.remove("hidden");
      const saved = settings.models?.lmstudio || "";
      if (saved) {
        dom.lmStudioModel.innerHTML = `<option value="${saved}" selected>${saved}</option>`;
      }
      loadLmStudioModels();
    } else {
      dom.modelSelect.classList.remove("hidden");
      dom.lmStudioModelGroup.classList.add("hidden");
      rebuildModelSelect(provider);
      renderModelCheckResults(provider);
    }
  }

  function renderModelCheckResults(provider) {
    const cache = settings.modelCheckCache?.[provider] || {};
    const cfg = PROVIDER_CONFIG[provider];
    if (!cfg) {
      dom.modelCheckResults.innerHTML = "";
      return;
    }
    const custom = (settings.customModels?.[provider] || []).map((id) => ({ value: id, label: id }));
    const allModels = [...cfg.models, ...custom];
    const cached = allModels.filter((m) => cache[m.value]);
    if (cached.length === 0) {
      dom.modelCheckResults.innerHTML = "";
      return;
    }
    const latest = Math.max(...cached.map((m) => cache[m.value].checkedAt || 0));
    const timestampStr = formatCheckTime(latest);
    const rowsHtml = allModels
      .map((m) => {
        const entry = cache[m.value];
        if (!entry) return "";
        const icon = entry.ok
          ? `<svg class="check-icon ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
          : `<svg class="check-icon fail" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        return `<div class="check-item" data-model="${escapeHtml(m.value)}">
          ${icon}
          <span class="check-label">${escapeHtml(m.label || m.value)}</span>
        </div>`;
      })
      .join("");
    dom.modelCheckResults.innerHTML =
      `<div class="check-timestamp">${escapeHtml(t("model.checkLastRun", timestampStr))}</div>` + rowsHtml;
  }

  function formatCheckTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    const lang = window.i18n ? window.i18n.i18nGetLang() : "en";
    const locale = lang === "de" ? "de-DE" : lang === "ru" ? "ru-RU" : "en-GB";
    return d.toLocaleString(locale, {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function rebuildModelSelect(provider) {
    const cfg = PROVIDER_CONFIG[provider];
    const custom = (settings.customModels?.[provider] || []).map((id) => ({ value: id, label: id }));
    const all = [...cfg.models, ...custom];
    dom.modelSelect.innerHTML = all
      .map((m) => `<option value="${m.value}">${m.label}</option>`)
      .join("");
    dom.modelSelect.value = settings.models?.[provider] || cfg.models[0]?.value || "";
    renderCustomModels(provider);
  }

  function renderCustomModels(provider) {
    const custom = settings.customModels?.[provider] || [];
    dom.customModelList.innerHTML = custom
      .map(
        (id) => `
      <span class="custom-model-tag">
        ${escapeHtml(id)}
        <button class="custom-model-remove" data-id="${escapeHtml(id)}" title="${escapeHtml(t("model.removeTitle"))}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </span>`,
      )
      .join("");
    dom.customModelList.querySelectorAll(".custom-model-remove").forEach((btn) => {
      btn.addEventListener("click", () => removeCustomModel(provider, btn.dataset.id));
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function applyTheme() {
    const theme =
      settings.theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : settings.theme;
    dom.app.className = `theme-${theme}`;
    document.body.className = `theme-${theme}`;
    localStorage.setItem("ai-chat-theme", theme);
  }

  // ---- Events ----
  function bindEvents() {
    $$(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".nav-item").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        $$(".settings-section").forEach((s) => s.classList.remove("active"));
        $(`#section-${btn.dataset.section}`).classList.add("active");
        if (btn.dataset.section === "messages") {
          renderMessageHistory();
        }
      });
    });

    if (dom.btnClearMessages) {
      dom.btnClearMessages.addEventListener("click", async () => {
        if (window.announcement) {
          await window.announcement.clearHistory();
        }
        renderMessageHistory();
      });
    }

    dom.providerSelect.addEventListener("change", () => {
      settings.provider = dom.providerSelect.value;
      updateProviderUI(settings.provider);
      saveSettings();
    });

    dom.apiKey.addEventListener("change", () => {
      settings.apiKeys[settings.provider] = dom.apiKey.value.trim();
      saveSettings();
    });

    dom.toggleKeyVis.addEventListener("click", () => {
      dom.apiKey.type = dom.apiKey.type === "password" ? "text" : "password";
    });

    dom.lmStudioUrl.addEventListener("change", () => {
      settings.baseUrls.lmstudio = dom.lmStudioUrl.value.trim() || "http://localhost:1234";
      saveSettings();
    });

    dom.baseUrl.addEventListener("change", () => {
      settings.baseUrls[settings.provider] = dom.baseUrl.value.trim();
      saveSettings();
    });

    dom.btnTestApi.addEventListener("click", testApi);

    dom.modelSelect.addEventListener("change", () => {
      settings.models[settings.provider] = dom.modelSelect.value;
      saveSettings();
    });

    dom.lmStudioModel.addEventListener("change", () => {
      settings.models.lmstudio = dom.lmStudioModel.value;
      saveSettings();
    });

    dom.btnLoadModels.addEventListener("click", loadLmStudioModels);
    dom.btnCheckModels.addEventListener("click", checkAllModels);

    dom.btnAddModel.addEventListener("click", addCustomModel);
    dom.customModelInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addCustomModel();
    });

    dom.temperature.addEventListener("input", () => {
      settings.temperature = parseFloat(dom.temperature.value);
      dom.temperatureValue.textContent = settings.temperature;
      saveSettings();
    });

    dom.maxTokens.addEventListener("input", () => {
      settings.maxTokens = parseInt(dom.maxTokens.value);
      dom.maxTokensValue.textContent = settings.maxTokens;
      saveSettings();
    });

    dom.systemPrompt.addEventListener("change", () => {
      settings.systemPrompt = dom.systemPrompt.value;
      saveSettings();
    });

    $$('input[name="theme"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        settings.theme = radio.value;
        applyTheme();
        saveSettings();
      });
    });

    dom.fontSize.addEventListener("input", () => {
      settings.fontSize = parseInt(dom.fontSize.value);
      dom.fontSizeValue.textContent = settings.fontSize + "px";
      saveSettings();
    });

    if (dom.languageSelect) {
      dom.languageSelect.addEventListener("change", () => {
        settings.language = dom.languageSelect.value;
        applyLanguage();
        if (window.i18n) window.i18n.applyTranslations();
        updateProviderUI(settings.provider || "perplexity");
        saveSettings();
      });
    }

    dom.sendWithEnter.addEventListener("change", () => {
      settings.sendWithEnter = dom.sendWithEnter.checked;
      saveSettings();
    });
    dom.showSources.addEventListener("change", () => {
      settings.showSources = dom.showSources.checked;
      saveSettings();
    });

    dom.btnExportAll.addEventListener("click", exportAllChats);

    if (dom.btnImportAll && dom.importFileInput) {
      dom.btnImportAll.addEventListener("click", () => dom.importFileInput.click());
      dom.importFileInput.addEventListener("change", importBackup);
    }

    dom.btnClearAll.addEventListener("click", clearAllChats);
    dom.btnResetSettings.addEventListener("click", resetSettings);
    if (dom.btnClearCache) dom.btnClearCache.addEventListener("click", clearCacheAndUpdate);

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (settings.theme === "system") applyTheme();
      });
  }

  // ---- API Test ----
  async function testApi() {
    const provider = settings.provider || "perplexity";
    const key = dom.apiKey.value.trim();

    if (provider !== "lmstudio" && !key) {
      showTestResult(t("api.noKey"), "error");
      return;
    }

    dom.btnTestApi.disabled = true;
    dom.btnTestApi.innerHTML = `<span class="loading">${escapeHtml(t("api.testing"))}</span>`;

    try {
      let ok = false;
      let errMsg = "";

      if (provider === "perplexity") {
        const r = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: "Hi" }], max_tokens: 5 }),
        });
        ok = r.ok;
        if (!ok) errMsg = await extractError(r);
      } else if (provider === "openai") {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: "Hi" }], max_tokens: 5 }),
        });
        ok = r.ok;
        if (!ok) errMsg = await extractError(r);
      } else if (provider === "anthropic") {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-allow-browser": "true",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 5,
            messages: [{ role: "user", content: "Hi" }],
          }),
        });
        ok = r.ok;
        if (!ok) errMsg = await extractError(r);
      } else if (provider === "gemini") {
        const model = "gemini-2.5-flash";
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "Hi" }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          },
        );
        ok = r.ok;
        if (!ok) errMsg = await extractError(r);
      } else if (provider === "lmstudio") {
        const baseUrl = (
          dom.lmStudioUrl.value.trim() ||
          settings.baseUrls?.lmstudio ||
          "http://localhost:1234"
        ).replace(/\/$/, "");
        const headers = key ? { Authorization: `Bearer ${key}` } : {};
        const r = await fetch(`${baseUrl}/v1/models`, { headers });
        ok = r.ok;
        if (!ok) errMsg = `(${r.status})`;
      }

      if (ok) {
        showTestResult(
          provider === "lmstudio"
            ? key ? t("api.successLmStudioKey") : t("api.successLmStudio")
            : t("api.success"),
          "success",
        );
      } else {
        showTestResult(t("api.errorPrefix") + errMsg, "error");
      }
    } catch (err) {
      showTestResult(t("api.connError") + err.message, "error");
    } finally {
      dom.btnTestApi.disabled = false;
      dom.btnTestApi.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${escapeHtml(t("api.testBtn"))}`;
    }
  }

  async function extractError(response) {
    const data = await response.json().catch(() => ({}));
    return `(${response.status}): ${data.error?.message || response.statusText}`;
  }

  function showTestResult(message, type) {
    dom.apiTestResult.textContent = message;
    dom.apiTestResult.className = `test-result ${type}`;
  }

  // ---- Data Operations ----
  async function loadStats() {
    const data = await window.Storage.get("conversations");
    const convos = data.conversations || [];
    const totalMessages = convos.reduce((sum, c) => sum + c.messages.length, 0);
    dom.statConversations.textContent = convos.length;
    dom.statMessages.textContent = totalMessages;
  }

  // ---- Message history (announcements) ----
  async function renderMessageHistory() {
    if (!dom.messageList) return;
    dom.messageList.innerHTML = "";

    if (!window.announcement) {
      const empty = document.createElement("div");
      empty.className = "message-empty";
      empty.textContent = t("messages.empty");
      dom.messageList.appendChild(empty);
      return;
    }

    const history = await window.announcement.getHistory();
    if (!history.length) {
      const empty = document.createElement("div");
      empty.className = "message-empty";
      empty.textContent = t("messages.empty");
      dom.messageList.appendChild(empty);
      return;
    }

    const lang = window.i18n ? window.i18n.i18nGetLang() : "en";
    const fmt = new Intl.DateTimeFormat(lang === "en" ? undefined : lang, {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

    history.forEach((entry) => {
      const type = ["info", "update", "warning"].includes(entry.type) ? entry.type : "info";

      const card = document.createElement("div");
      card.className = `message-card message-${type}`;

      const header = document.createElement("div");
      header.className = "message-card-header";

      const icon = document.createElement("span");
      icon.className = "message-icon";
      icon.textContent = type === "warning" ? "⚠️" : type === "update" ? "⬆️" : "ℹ️";
      header.appendChild(icon);

      const title = document.createElement("div");
      title.className = "message-card-title";
      title.textContent = window.announcement.pickLocalized(entry.title, lang);
      header.appendChild(title);

      const time = document.createElement("span");
      time.className = "message-card-time";
      time.textContent = entry.receivedAt ? fmt.format(entry.receivedAt) : "";
      header.appendChild(time);

      card.appendChild(header);

      const body = window.announcement.pickLocalized(entry.body, lang);
      if (body) {
        const bodyEl = document.createElement("div");
        bodyEl.className = "message-card-body";
        bodyEl.textContent = body;
        card.appendChild(bodyEl);
      }

      if (entry.link) {
        const link = document.createElement("a");
        link.className = "message-card-link";
        link.href = entry.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = window.announcement.pickLocalized(entry.linkLabel, lang) || entry.link;
        card.appendChild(link);
      }

      dom.messageList.appendChild(card);
    });
  }

  async function exportAllChats() {
    const data = await window.Storage.get(["conversations", "activeConversationId", "settings"]);
    const convos = data.conversations || [];
    const stgs = data.settings || settings;
    if (convos.length === 0 && !stgs) {
      alert(t("data.noChatToExport"));
      return;
    }
    const backup = {
      type: "ai-chat-pro-client-backup",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      conversations: convos,
      activeConversationId: data.activeConversationId || null,
      settings: stgs,
    };
    const content = JSON.stringify(backup, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-pro-client-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      const isNewFormat = backup.type === "ai-chat-pro-client-backup";
      const isLegacyFormat = Array.isArray(backup.conversations);
      if (!isNewFormat && !isLegacyFormat) throw new Error("invalid");

      const update = {};
      if (Array.isArray(backup.conversations)) update.conversations = backup.conversations;
      if (backup.activeConversationId !== undefined) update.activeConversationId = backup.activeConversationId;
      if (backup.settings && typeof backup.settings === "object") update.settings = backup.settings;

      await window.Storage.set(update);

      if (update.settings) {
        settings = update.settings;
        await loadSettings();
        applyLanguage();
        if (window.i18n) window.i18n.applyTranslations();
        populateUI();
      }
      loadStats();
      alert(t("data.importSuccess"));
    } catch (err) {
      alert(t("data.importError"));
    } finally {
      e.target.value = "";
    }
  }

  async function clearAllChats() {
    if (!confirm(t("data.clearConfirm"))) return;
    await window.Storage.set({ conversations: [], activeConversationId: null });
    loadStats();
    alert(t("data.clearDone"));
  }

  async function clearCacheAndUpdate() {
    if (!confirm(t("data.clearCacheConfirm"))) return;
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) { /* ignore */ }
    const url = "./index.html?v=" + Date.now();
    window.location.replace(url);
  }

  async function resetSettings() {
    if (!confirm(t("data.resetConfirm"))) return;
    settings = {
      ...DEFAULT_SETTINGS,
      apiKeys: { ...DEFAULT_SETTINGS.apiKeys },
      models: { ...DEFAULT_SETTINGS.models },
      baseUrls: { ...DEFAULT_SETTINGS.baseUrls },
      customModels: { perplexity: [], openai: [], anthropic: [], gemini: [], lmstudio: [] },
      modelCheckCache: { perplexity: {}, openai: {}, anthropic: {}, gemini: {}, lmstudio: {} },
    };
    await saveSettings();
    applyLanguage();
    if (window.i18n) window.i18n.applyTranslations();
    populateUI();
    updateProviderUI(settings.provider || "perplexity");
    alert(t("data.resetDone"));
  }

  // ---- Custom Models ----
  function addCustomModel() {
    const provider = settings.provider;
    const id = dom.customModelInput.value.trim();
    if (!id) return;
    if (!settings.customModels[provider]) settings.customModels[provider] = [];
    if (settings.customModels[provider].includes(id)) {
      dom.customModelInput.value = "";
      return;
    }
    settings.customModels[provider].push(id);
    saveSettings();
    dom.customModelInput.value = "";
    rebuildModelSelect(provider);
    dom.modelSelect.value = id;
    settings.models[provider] = id;
    saveSettings();
  }

  function removeCustomModel(provider, id) {
    settings.customModels[provider] = (settings.customModels[provider] || []).filter((m) => m !== id);
    if (settings.modelCheckCache?.[provider]?.[id]) {
      delete settings.modelCheckCache[provider][id];
    }
    if (settings.models[provider] === id) {
      settings.models[provider] = PROVIDER_CONFIG[provider].models[0]?.value || "";
    }
    saveSettings();
    rebuildModelSelect(provider);
    dom.modelSelect.value = settings.models[provider];
    renderModelCheckResults(provider);
  }

  // ---- Model Health Check ----
  async function checkAllModels() {
    const provider = settings.provider;
    if (provider === "lmstudio") return;
    const apiKey = settings.apiKeys?.[provider] || "";
    if (!apiKey) {
      dom.modelCheckResults.innerHTML = `<span class="check-hint">${escapeHtml(t("model.checkNoKey"))}</span>`;
      return;
    }

    const cfg = PROVIDER_CONFIG[provider];
    const custom = (settings.customModels?.[provider] || []).map((id) => ({ value: id, label: id }));
    const allModels = [...cfg.models, ...custom];

    dom.btnCheckModels.disabled = true;
    dom.modelCheckResults.innerHTML = allModels
      .map(
        (m) => `
      <div class="check-item" data-model="${escapeHtml(m.value)}">
        <span class="check-spinner"></span>
        <span class="check-label">${escapeHtml(m.label || m.value)}</span>
      </div>`,
      )
      .join("");

    if (!settings.modelCheckCache) settings.modelCheckCache = {};
    if (!settings.modelCheckCache[provider]) settings.modelCheckCache[provider] = {};
    const cache = settings.modelCheckCache[provider];

    for (const model of allModels) {
      const row = dom.modelCheckResults.querySelector(`[data-model="${CSS.escape(model.value)}"]`);
      const ok = await probeModel(provider, apiKey, model.value);
      cache[model.value] = { ok, checkedAt: Date.now() };
      const spinnerEl = row?.querySelector(".check-spinner");
      if (spinnerEl) {
        spinnerEl.outerHTML = ok
          ? `<svg class="check-icon ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
          : `<svg class="check-icon fail" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      }
    }
    await saveSettings();
    renderModelCheckResults(provider);
    dom.btnCheckModels.disabled = false;
  }

  async function probeModel(provider, apiKey, modelId) {
    try {
      const baseUrls = settings.baseUrls || {};
      if (provider === "perplexity") {
        const base = (baseUrls.perplexity || "https://api.perplexity.ai").replace(/\/$/, "");
        const r = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: "Hi" }], max_tokens: 1 }),
        });
        return r.ok;
      } else if (provider === "openai") {
        const base = (baseUrls.openai || "https://api.openai.com").replace(/\/$/, "");
        const r = await fetch(`${base}/v1/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: "Hi" }], max_tokens: 1 }),
        });
        return r.ok;
      } else if (provider === "anthropic") {
        const base = (baseUrls.anthropic || "https://api.anthropic.com").replace(/\/$/, "");
        const r = await fetch(`${base}/v1/messages`, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-allow-browser": "true",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: modelId, max_tokens: 1, messages: [{ role: "user", content: "Hi" }] }),
        });
        return r.ok;
      } else if (provider === "gemini") {
        const base = (baseUrls.gemini || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
        const r = await fetch(
          `${base}/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Hi" }] }], generationConfig: { maxOutputTokens: 1 } }),
          },
        );
        return r.ok;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ---- Start ----
  init();
})();
