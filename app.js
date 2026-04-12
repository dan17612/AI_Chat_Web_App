// ============================================
// AI Chat Pro - Web App Main Logic
// Based on popup.js, adapted for PWA:
// - window.Storage instead of chrome.storage.local
// - window.Api.chat() instead of chrome.runtime.sendMessage
// - window.location.href for settings navigation
// ============================================

(function () {
  "use strict";

  // ---- State ----
  let state = {
    conversations: [],
    activeConversationId: null,
    settings: null,
    isLoading: false,
  };

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    app: $("#app"),
    offlineBanner: $("#offline-banner"),
    sidebar: $("#sidebar"),
    sidebarOverlay: $("#sidebar-overlay"),
    conversationList: $("#conversation-list"),
    chatArea: $("#chat-area"),
    welcomeScreen: $("#welcome-screen"),
    messages: $("#messages"),
    typingIndicator: $("#typing-indicator"),
    messageInput: $("#message-input"),
    btnSend: $("#btn-send"),
    btnNewChat: $("#btn-new-chat"),
    btnToggleSidebar: $("#btn-toggle-sidebar"),
    btnSettings: $("#btn-settings"),
    btnExport: $("#btn-export"),
    btnClearChat: $("#btn-clear-chat"),
    btnEditTitle: $("#btn-edit-title"),
    chatTitle: $("#chat-title"),
    modelBadge: $("#model-badge"),
    charCount: $("#char-count"),
    inputHintText: $("#input-hint-text"),
    btnCloseSidebar: $("#btn-close-sidebar"),
    searchChats: $("#search-chats"),
    exportModal: $("#export-modal"),
    deleteModal: $("#delete-modal"),
    renameModal: $("#rename-modal"),
    renameInput: $("#rename-input"),
    confirmRename: $("#confirm-rename"),
    toastContainer: $("#toast-container"),
    announcementContainer: $("#announcement-container"),
  };

  // ---- Initialize ----
  async function init() {
    if (window.i18n) window.i18n.applyTranslations();
    await loadState();
    applySettings();
    renderConversationList();
    renderActiveChat();
    bindEvents();
    // Start with sidebar closed on mobile
    if (window.innerWidth <= 700) {
      dom.sidebar.classList.add("collapsed");
    }
    if (window.announcement && dom.announcementContainer) {
      window.announcement.init(dom.announcementContainer);
    }
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
    // Offline detection
    function updateOfflineBanner() {
      if (dom.offlineBanner) {
        dom.offlineBanner.classList.toggle("visible", !navigator.onLine);
      }
    }
    window.addEventListener("online", updateOfflineBanner);
    window.addEventListener("offline", updateOfflineBanner);
    updateOfflineBanner();
  }

  async function loadState() {
    const data = await window.Storage.get([
      "conversations",
      "activeConversationId",
      "settings",
    ]);
    state.conversations = data.conversations || [];
    state.activeConversationId = data.activeConversationId || null;
    state.settings = normalizeSettings(data.settings);
  }

  function normalizeSettings(rawSettings) {
    const defaults = getDefaultSettings();
    const s = rawSettings || {};
    return {
      ...defaults,
      ...s,
      apiKeys: {
        ...defaults.apiKeys,
        ...(s.apiKeys || {}),
      },
      baseUrls: {
        ...defaults.baseUrls,
        ...(s.baseUrls || {}),
      },
      models: {
        ...defaults.models,
        ...(s.models || {}),
      },
    };
  }

  async function reloadSettingsFromStorage() {
    const data = await window.Storage.get("settings");
    state.settings = normalizeSettings(data.settings);
    applySettings();
  }

  function getDefaultSettings() {
    return {
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
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt:
        "You are a helpful, accurate, and friendly AI assistant. Provide clear and concise answers. Use markdown formatting when appropriate.",
      theme: "dark",
      fontSize: 14,
      sendWithEnter: true,
      streamResponses: true,
      showSources: true,
    };
  }

  async function saveState() {
    await window.Storage.set({
      conversations: state.conversations,
      activeConversationId: state.activeConversationId,
    });
  }

  // ---- Settings ----
  function applySettings() {
    const s = state.settings;
    const resolvedTheme = s.theme === "system" ? getSystemTheme() : s.theme;
    dom.app.className = `theme-${resolvedTheme}`;
    document.body.className = `theme-${resolvedTheme}`;
    localStorage.setItem("ai-chat-theme", resolvedTheme);
    document.documentElement.style.setProperty("--font-size", s.fontSize + "px");
    const provider = s.provider || "perplexity";
    const currentModel = s.models?.[provider] || s.model || provider;
    dom.modelBadge.textContent = currentModel;
    const _t = window.i18n ? window.i18n.t : (k) => k;
    dom.inputHintText.textContent = s.sendWithEnter
      ? _t("input.hint")
      : _t("input.hintCtrl");
  }

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  // ---- Events ----
  function bindEvents() {
    dom.btnNewChat.addEventListener("click", createNewChat);

    dom.btnToggleSidebar.addEventListener("click", () => {
      dom.sidebar.classList.toggle("collapsed");
      if (dom.sidebarOverlay) {
        dom.sidebarOverlay.classList.toggle(
          "visible",
          !dom.sidebar.classList.contains("collapsed")
        );
      }
    });

    if (dom.sidebarOverlay) {
      dom.sidebarOverlay.addEventListener("click", () => {
        closeSidebar();
      });
    }

    if (dom.btnCloseSidebar) {
      dom.btnCloseSidebar.addEventListener("click", () => {
        closeSidebar();
      });
    }

    // Swipe left to close sidebar
    (function initSidebarSwipe() {
      let startX = 0;
      let startY = 0;
      let swiping = false;

      dom.sidebar.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        swiping = true;
      }, { passive: true });

      dom.sidebar.addEventListener("touchend", (e) => {
        if (!swiping) return;
        swiping = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = Math.abs(e.changedTouches[0].clientY - startY);
        // swipe left at least 60px, more horizontal than vertical
        if (dx < -60 && dy < Math.abs(dx)) {
          closeSidebar();
        }
      }, { passive: true });
    })();

    function closeSidebar() {
      dom.sidebar.classList.add("collapsed");
      if (dom.sidebarOverlay) dom.sidebarOverlay.classList.remove("visible");
    }

    // Settings — navigate to settings page
    dom.btnSettings.addEventListener("click", () => {
      window.location.href = "settings.html";
    });

    dom.btnSend.addEventListener("click", sendMessage);
    dom.messageInput.addEventListener("input", handleInputChange);
    dom.messageInput.addEventListener("keydown", handleInputKeydown);

    $$(".suggestion-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const promptKey = chip.dataset.i18nPrompt;
        dom.messageInput.value =
          promptKey && window.i18n ? window.i18n.t(promptKey) : chip.dataset.prompt;
        handleInputChange();
        sendMessage();
      });
    });

    dom.btnExport.addEventListener("click", () => toggleModal(dom.exportModal, true));
    $("#export-md").addEventListener("click", () => exportChat("md"));
    $("#export-json").addEventListener("click", () => exportChat("json"));

    dom.btnClearChat.addEventListener("click", () => toggleModal(dom.deleteModal, true));
    $("#confirm-delete").addEventListener("click", deleteActiveChat);

    dom.confirmRename.addEventListener("click", confirmRename);
    dom.renameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") confirmRename();
      if (e.key === "Escape") toggleModal(dom.renameModal, false);
    });

    dom.btnEditTitle.addEventListener("click", editChatTitle);
    dom.searchChats.addEventListener("input", renderConversationList);

    $$(".modal-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.closest(".modal").classList.add("hidden");
      });
    });

    $$(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", () => {
        backdrop.closest(".modal").classList.add("hidden");
      });
    });

    // Reload settings when page becomes visible (e.g. returning from settings.html)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) reloadSettingsFromStorage();
    });

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (state.settings.theme === "system") applySettings();
      });
  }

  // ---- Input Handling ----
  function handleInputChange() {
    const val = dom.messageInput.value;
    dom.btnSend.disabled = !val.trim();
    dom.messageInput.style.height = "auto";
    dom.messageInput.style.height =
      Math.min(dom.messageInput.scrollHeight, 120) + "px";
    dom.charCount.textContent = val.length > 0 ? val.length : "";
  }

  function handleInputKeydown(e) {
    const s = state.settings;
    if (s.sendWithEnter) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    } else {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendMessage();
      }
    }
  }

  // ---- Conversations ----
  function createNewChat() {
    const _t = window.i18n ? window.i18n.t : (k) => k;
    const conv = {
      id: generateId(),
      title: _t("conv.newChat"),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    state.conversations.unshift(conv);
    state.activeConversationId = conv.id;
    saveState();
    renderConversationList();
    renderActiveChat();
    dom.messageInput.focus();
  }

  function switchToChat(id) {
    state.activeConversationId = id;
    saveState();
    renderConversationList();
    renderActiveChat();
    // On mobile, close sidebar after selecting a chat
    if (window.innerWidth <= 700) {
      dom.sidebar.classList.add("collapsed");
      if (dom.sidebarOverlay) dom.sidebarOverlay.classList.remove("visible");
    }
  }

  function getActiveConversation() {
    return state.conversations.find((c) => c.id === state.activeConversationId);
  }

  function deleteActiveChat() {
    toggleModal(dom.deleteModal, false);
    const idx = state.conversations.findIndex(
      (c) => c.id === state.activeConversationId
    );
    if (idx !== -1) state.conversations.splice(idx, 1);
    state.activeConversationId =
      state.conversations.length > 0 ? state.conversations[0].id : null;
    saveState();
    renderConversationList();
    renderActiveChat();
    showToast(window.i18n ? window.i18n.t("toast.chatDeleted") : "Chat deleted.", "success");
  }

  // ---- Rename ----
  let _renameTargetId = null;

  function openRenameModal(convId) {
    const conv = state.conversations.find((c) => c.id === convId);
    if (!conv) return;
    _renameTargetId = convId;
    dom.renameInput.value = conv.title;
    toggleModal(dom.renameModal, true);
    setTimeout(() => {
      dom.renameInput.focus();
      dom.renameInput.select();
    }, 50);
  }

  function confirmRename() {
    const newTitle = dom.renameInput.value.trim();
    if (!newTitle || !_renameTargetId) return;
    const conv = state.conversations.find((c) => c.id === _renameTargetId);
    if (conv) {
      conv.title = newTitle;
      saveState();
      renderConversationList();
      if (_renameTargetId === state.activeConversationId) {
        dom.chatTitle.textContent = newTitle;
      }
    }
    toggleModal(dom.renameModal, false);
    _renameTargetId = null;
  }

  function editChatTitle() {
    const conv = getActiveConversation();
    if (!conv) return;
    openRenameModal(conv.id);
  }

  // ---- Render ----
  function renderConversationList() {
    const search = dom.searchChats.value.toLowerCase();
    const filtered = state.conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.messages.some((m) => m.content.toLowerCase().includes(search))
    );

    if (filtered.length === 0) {
      const _t = window.i18n ? window.i18n.t : (k) => k;
      dom.conversationList.innerHTML =
        `<div class="conv-empty">${_t("conv.empty")}</div>`;
      return;
    }

    const _tConv = window.i18n ? window.i18n.t : (k) => k;
    dom.conversationList.innerHTML = filtered
      .map(
        (conv) => `
      <div class="conversation-item ${conv.id === state.activeConversationId ? "active" : ""}"
           data-id="${conv.id}">
        <svg class="conv-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="conv-title">${escapeHtml(conv.title)}</span>
        <div class="conv-actions">
          <button class="conv-rename" data-id="${conv.id}" title="${_tConv("conv.rename")}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="conv-delete" data-id="${conv.id}" title="${_tConv("conv.delete")}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    dom.conversationList.querySelectorAll(".conversation-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".conv-delete")) return;
        switchToChat(item.dataset.id);
      });
    });

    dom.conversationList.querySelectorAll(".conv-rename").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openRenameModal(btn.dataset.id);
      });
    });

    dom.conversationList.querySelectorAll(".conv-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const idx = state.conversations.findIndex((c) => c.id === id);
        if (idx !== -1) {
          state.conversations.splice(idx, 1);
          if (state.activeConversationId === id) {
            state.activeConversationId =
              state.conversations.length > 0 ? state.conversations[0].id : null;
          }
          saveState();
          renderConversationList();
          renderActiveChat();
        }
      });
    });
  }

  function renderActiveChat() {
    const conv = getActiveConversation();

    if (!conv) {
      dom.welcomeScreen.style.display = "flex";
      dom.messages.style.display = "none";
      dom.chatTitle.textContent = window.i18n ? window.i18n.t("header.newChat") : "New Chat";
      return;
    }

    dom.welcomeScreen.style.display = "none";
    dom.messages.style.display = "flex";
    dom.chatTitle.textContent = conv.title;

    dom.messages.innerHTML = conv.messages.map((msg) => renderMessage(msg)).join("");

    bindCopyButtons();
    scrollToBottom();
  }

  function renderMessage(msg) {
    const _t = window.i18n ? window.i18n.t : (k) => k;
    const isUser = msg.role === "user";
    const avatar = isUser ? _t("msg.you").substring(0, 2) : "AI";
    const time = formatTime(msg.timestamp);

    const body = isUser
      ? escapeHtml(msg.content).replace(/\n/g, "<br>")
      : renderMarkdown(msg.content);

    let sourcesHtml = "";
    if (
      !isUser &&
      msg.citations &&
      msg.citations.length > 0 &&
      state.settings.showSources
    ) {
      sourcesHtml = `
        <div class="message-sources">
          <div class="sources-title">${_t("msg.sources")}</div>
          <div>${msg.citations
            .map((url, i) => {
              const domain = extractDomain(url);
              return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="source-link">${i + 1}. ${domain}</a>`;
            })
            .join("")}</div>
        </div>
      `;
    }

    return `
      <div class="message ${isUser ? "user" : "assistant"}">
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${isUser ? _t("msg.you") : _t("msg.ai")}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-body">${body}</div>
          ${sourcesHtml}
        </div>
      </div>
    `;
  }

  // ---- Send Message ----
  async function sendMessage() {
    await reloadSettingsFromStorage();

    const text = dom.messageInput.value.trim();
    if (!text || state.isLoading) return;

    const _provider = state.settings.provider || "perplexity";
    const _apiKey = state.settings.apiKeys?.[_provider] || state.settings.apiKey || "";
    if (_provider !== "lmstudio" && !_apiKey) {
      showToast(window.i18n ? window.i18n.t("toast.noApiKey") : "API key not configured.", "error");
      return;
    }

    if (!getActiveConversation()) createNewChat();

    const conv = getActiveConversation();

    const userMsg = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    conv.messages.push(userMsg);

    if (conv.messages.length === 1) {
      conv.title = text.length > 40 ? text.substring(0, 40) + "..." : text;
      dom.chatTitle.textContent = conv.title;
      renderConversationList();
    }

    dom.messageInput.value = "";
    handleInputChange();

    dom.welcomeScreen.style.display = "none";
    dom.messages.style.display = "flex";
    dom.messages.insertAdjacentHTML("beforeend", renderMessage(userMsg));
    scrollToBottom();

    state.isLoading = true;
    dom.typingIndicator.classList.remove("hidden");
    dom.btnSend.disabled = true;
    scrollToBottom();

    const apiMessages = conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await window.Api.chat(state.settings, apiMessages);

      const assistantMsg = {
        role: "assistant",
        content: response.content,
        citations: response.citations || [],
        usage: response.usage,
        timestamp: Date.now(),
      };
      conv.messages.push(assistantMsg);
      conv.updatedAt = Date.now();
      saveState();

      dom.messages.insertAdjacentHTML("beforeend", renderMessage(assistantMsg));
      bindCopyButtons();
    } catch (err) {
      let errMsg = err.message;
      if (err.errorCode && window.i18n) {
        const params = err.errorParams || [];
        errMsg = window.i18n.t("error." + err.errorCode, ...params);
      }
      showToast(errMsg, "error");
      // Remove user message on error if it was the only message
      if (conv.messages.length === 1) {
        conv.messages.pop();
        state.conversations.shift();
        state.activeConversationId = null;
        saveState();
        renderConversationList();
        renderActiveChat();
      }
    } finally {
      state.isLoading = false;
      dom.typingIndicator.classList.add("hidden");
      dom.btnSend.disabled = !dom.messageInput.value.trim();
      scrollToBottom();
    }
  }

  // ---- Markdown Renderer ----
  function renderMarkdown(text) {
    if (!text) return "";

    let html = text;
    const codeBlocks = [];

    // Fenced code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const id = `__CODE_${codeBlocks.length}__`;
      const highlighted = highlightSyntax(code.trim(), lang);
      const _tCopy = window.i18n ? window.i18n.t : (k) => k;
      codeBlocks.push(`<div class="code-block">
        <div class="code-header">
          <span class="code-lang">${lang || "code"}</span>
          <button class="btn-copy-code" data-code="${encodeURIComponent(code.trim())}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            ${_tCopy("code.copy")}
          </button>
        </div>
        <pre><code>${highlighted}</code></pre>
      </div>`);
      return id;
    });

    // Tables (GitHub-Flavored Markdown)
    const tables = [];
    const parseTableRow = (line) => {
      let s = line.trim();
      if (s.startsWith("|")) s = s.slice(1);
      if (s.endsWith("|")) s = s.slice(0, -1);
      return s.split("|").map((c) => c.trim());
    };
    const renderInlineMd = (text) => {
      const codes = [];
      let out = text.replace(/`([^`]+)`/g, (_, c) => {
        const id = `__TBLCODE_${codes.length}__`;
        codes.push(`<code>${escapeHtml(c)}</code>`);
        return id;
      });
      out = out.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
      out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
      out = out.replace(/~~(.+?)~~/g, "<del>$1</del>");
      out = out.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
      );
      codes.forEach((c, i) => { out = out.replace(`__TBLCODE_${i}__`, c); });
      return out;
    };
    const sepRe = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/;
    const tblLines = html.split("\n");
    const cleanedLines = [];
    let tli = 0;
    while (tli < tblLines.length) {
      const line = tblLines[tli];
      const next = tblLines[tli + 1];
      if (next !== undefined && line.includes("|") && sepRe.test(next)) {
        const headerCells = parseTableRow(line);
        const aligns = parseTableRow(next).map((c) => {
          const l = c.startsWith(":");
          const r = c.endsWith(":");
          if (l && r) return "center";
          if (r) return "right";
          if (l) return "left";
          return null;
        });
        const bodyRows = [];
        let bj = tli + 2;
        while (bj < tblLines.length && tblLines[bj].includes("|") && tblLines[bj].trim() !== "") {
          bodyRows.push(parseTableRow(tblLines[bj]));
          bj++;
        }
        let tableHtml = '<table class="md-table"><thead><tr>';
        headerCells.forEach((c, idx) => {
          const a = aligns[idx] ? ` style="text-align:${aligns[idx]}"` : "";
          tableHtml += `<th${a}>${renderInlineMd(c)}</th>`;
        });
        tableHtml += "</tr></thead><tbody>";
        bodyRows.forEach((row) => {
          tableHtml += "<tr>";
          for (let k = 0; k < headerCells.length; k++) {
            const c = row[k] !== undefined ? row[k] : "";
            const a = aligns[k] ? ` style="text-align:${aligns[k]}"` : "";
            tableHtml += `<td${a}>${renderInlineMd(c)}</td>`;
          }
          tableHtml += "</tr>";
        });
        tableHtml += "</tbody></table>";
        const id = `__TABLE_${tables.length}__`;
        tables.push(tableHtml);
        cleanedLines.push(id);
        tli = bj;
      } else {
        cleanedLines.push(line);
        tli++;
      }
    }
    html = cleanedLines.join("\n");

    // Inline code
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, (_, code) => {
      const id = `__INLINE_${inlineCodes.length}__`;
      inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
      return id;
    });

    // Headers
    html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Bold & Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

    // Horizontal Rule
    html = html.replace(/^---$/gm, "<hr>");

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );

    // Unordered lists
    html = html.replace(/^[\s]*[-*] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

    // Ordered lists
    html = html.replace(/^[\s]*\d+\. (.+)$/gm, "<li>$1</li>");

    // Paragraphs
    html = html
      .split("\n\n")
      .map((block) => {
        block = block.trim();
        if (!block) return "";
        if (
          block.startsWith("<h") ||
          block.startsWith("<ul") ||
          block.startsWith("<ol") ||
          block.startsWith("<blockquote") ||
          block.startsWith("<hr") ||
          block.startsWith("__CODE_") ||
          block.startsWith("__TABLE_") ||
          block.startsWith("<div") ||
          block.startsWith("<li")
        ) {
          return block;
        }
        return `<p>${block.replace(/\n/g, "<br>")}</p>`;
      })
      .join("\n");

    // Restore inline code
    inlineCodes.forEach((code, i) => {
      html = html.replace(`__INLINE_${i}__`, code);
    });

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
      html = html.replace(`__CODE_${i}__`, block);
    });

    // Restore tables
    tables.forEach((tbl, i) => {
      html = html.replace(`__TABLE_${i}__`, tbl);
    });

    return html;
  }

  // ---- Syntax Highlighting ----
  function highlightSyntax(code, lang) {
    const escaped = escapeHtml(code);
    if (!lang) return escaped;

    let result = escaped;

    result = result.replace(/(\/\/.*$)/gm, '<span class="token-comment">$1</span>');
    result = result.replace(/(#.*$)/gm, '<span class="token-comment">$1</span>');
    result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');

    result = result.replace(
      /(&quot;(?:[^&]|&(?!quot;))*?&quot;)/g,
      '<span class="token-string">$1</span>'
    );
    result = result.replace(
      /(&#39;(?:[^&]|&(?!#39;))*?&#39;)/g,
      '<span class="token-string">$1</span>'
    );
    result = result.replace(/(`[^`]*`)/g, '<span class="token-string">$1</span>');

    result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');

    const keywords = [
      "function","const","let","var","if","else","for","while","do","return",
      "class","import","export","from","default","new","this","try","catch",
      "throw","async","await","switch","case","break","continue","typeof",
      "instanceof","in","of","yield","extends","def","print","elif","except",
      "finally","with","as","lambda","pass","raise","True","False","None",
      "self","and","or","not","fn","pub","mod","use","impl","trait","struct",
      "enum","match","mut","ref","static","void","int","float","double","char",
      "bool","string","type","interface","abstract","final","override","public",
      "private","protected","package","null","undefined","true","false",
    ];

    const keywordRegex = new RegExp("\\b(" + keywords.join("|") + ")\\b", "g");
    result = result.replace(keywordRegex, (match) => `<span class="token-keyword">${match}</span>`);

    result = result.replace(
      /\b([a-zA-Z_]\w*)\s*\(/g,
      '<span class="token-function">$1</span>('
    );

    return result;
  }

  // ---- Copy Code ----
  function bindCopyButtons() {
    dom.messages.querySelectorAll(".btn-copy-code").forEach((btn) => {
      btn.replaceWith(btn.cloneNode(true));
    });
    dom.messages.querySelectorAll(".btn-copy-code").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const code = decodeURIComponent(btn.dataset.code);
        try {
          await navigator.clipboard.writeText(code);
          btn.classList.add("copied");
          const _t = window.i18n ? window.i18n.t : (k) => k;
          btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${_t("code.copied")}`;
          setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> ${_t("code.copy")}`;
          }, 2000);
        } catch {
          showToast(window.i18n ? window.i18n.t("toast.copyFailed") : "Copy failed.", "error");
        }
      });
    });
  }

  // ---- Export ----
  function exportChat(format) {
    const conv = getActiveConversation();
    if (!conv || conv.messages.length === 0) {
      showToast(window.i18n ? window.i18n.t("toast.noChatToExport") : "No chat to export.", "error");
      toggleModal(dom.exportModal, false);
      return;
    }

    let content, filename, mimeType;

    if (format === "md") {
      content = `# ${conv.title}\n\n`;
      content += conv.messages
        .map((m) => {
          const author = m.role === "user" ? "**Du**" : "**AI Chat Pro**";
          return `### ${author}\n\n${m.content}\n`;
        })
        .join("\n---\n\n");
      filename = `chat-${conv.id}.md`;
      mimeType = "text/markdown";
    } else {
      content = JSON.stringify(
        { title: conv.title, exportedAt: new Date().toISOString(), messages: conv.messages },
        null,
        2
      );
      filename = `chat-${conv.id}.json`;
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toggleModal(dom.exportModal, false);
    showToast(window.i18n ? window.i18n.t("toast.exportedChat") : "Chat exported!", "success");
  }

  // ---- Helpers ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(timestamp) {
    const _t = window.i18n ? window.i18n.t : (k) => k;
    const lang = window.i18n ? window.i18n.i18nGetLang() : "en";
    const locale = lang === "de" ? "de-DE" : lang === "ru" ? "ru-RU" : "en-GB";
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return _t("time.justNow");
    if (diff < 3600000) return _t("time.min", Math.floor(diff / 60000));
    if (diff < 86400000)
      return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  }

  function extractDomain(url) {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      dom.chatArea.scrollTop = dom.chatArea.scrollHeight;
    });
  }

  function toggleModal(modal, show) {
    modal.classList.toggle("hidden", !show);
  }

  function showToast(message, type = "success") {
    const icon =
      type === "success"
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      toast.style.transition = "0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---- Start ----
  init();
})();
