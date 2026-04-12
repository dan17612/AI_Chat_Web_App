// ============================================
// AI Chat Pro Client - Remote Announcement Banner
// Fetches a JSON message from a remote endpoint and renders it
// as a dismissable banner above the chat area.
// ============================================

(function () {
  "use strict";

  const ENDPOINT = "https://schiller.pw/AIChatProClientMessage/main.json";
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  const STORAGE_KEY = "announcementCache";
  const DISMISSED_KEY = "dismissedAnnouncementId";
  const HISTORY_KEY = "announcementHistory";
  const HISTORY_MAX = 30;

  /**
   * Compare two semver-ish version strings ("1.2.3").
   * Returns negative if a<b, 0 if equal, positive if a>b.
   * Non-numeric / missing parts are treated as 0.
   */
  function compareVersions(a, b) {
    const pa = String(a || "0").split(".").map((n) => parseInt(n, 10) || 0);
    const pb = String(b || "0").split(".").map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const da = pa[i] || 0;
      const db = pb[i] || 0;
      if (da !== db) return da - db;
    }
    return 0;
  }

  /**
   * Pick a localized field from either a plain string or an object
   * keyed by language code. Falls back to English, then to the first
   * available value.
   */
  function pickLocalized(field, lang) {
    if (field == null) return "";
    if (typeof field === "string") return field;
    if (typeof field !== "object") return String(field);
    if (field[lang]) return field[lang];
    if (field.en) return field.en;
    const keys = Object.keys(field);
    return keys.length ? field[keys[0]] : "";
  }

  /**
   * Decide whether the announcement should be shown for the given
   * installed extension version and dismissed-id state.
   */
  function shouldShow(announcement, installedVersion, dismissedId) {
    if (!announcement || typeof announcement !== "object") return false;
    if (!announcement.id) return false;

    // Expiry
    if (announcement.expiresAt) {
      const exp = Date.parse(announcement.expiresAt);
      if (!isNaN(exp) && Date.now() > exp) return false;
    }

    // minVersion: installed must be >= minVersion
    if (
      announcement.minVersion &&
      compareVersions(installedVersion, announcement.minVersion) < 0
    ) {
      return false;
    }

    // targetVersion: only show if installed < targetVersion (user is outdated)
    if (
      announcement.targetVersion &&
      compareVersions(installedVersion, announcement.targetVersion) >= 0
    ) {
      return false;
    }

    // Dismissed: hide only if dismissable AND id matches the dismissed one
    if (announcement.dismissable !== false && dismissedId === announcement.id) {
      return false;
    }

    return true;
  }

  // Use window.Storage (shared/storage.js) which auto-detects
  // chrome.storage.local (extension) vs localStorage (web app).
  function getStore() {
    return window.Storage || null;
  }

  /**
   * Fetch the announcement JSON, using a TTL-based cache.
   * Returns null on failure (network, JSON parse, etc).
   */
  async function fetchAnnouncement(force) {
    const store = getStore();
    if (!store) return null;
    try {
      const stored = await store.get(STORAGE_KEY);
      const cached = stored[STORAGE_KEY];
      if (
        !force &&
        cached &&
        cached.fetchedAt &&
        Date.now() - cached.fetchedAt < CACHE_TTL_MS
      ) {
        return cached.data;
      }

      const resp = await fetch(ENDPOINT, { cache: "no-store" });
      if (!resp.ok) {
        return cached ? cached.data : null;
      }
      const data = await resp.json();
      await store.set({ [STORAGE_KEY]: { data, fetchedAt: Date.now() } });
      if (data && data.id) {
        await appendHistory(data);
      }
      return data;
    } catch (err) {
      try {
        const store2 = getStore();
        if (!store2) return null;
        const stored = await store2.get(STORAGE_KEY);
        return stored[STORAGE_KEY] ? stored[STORAGE_KEY].data : null;
      } catch (_) {
        return null;
      }
    }
  }

  async function getDismissedId() {
    const store = getStore();
    if (!store) return null;
    const stored = await store.get(DISMISSED_KEY);
    return stored[DISMISSED_KEY] || null;
  }

  async function markDismissed(id) {
    const store = getStore();
    if (!id || !store) return;
    await store.set({ [DISMISSED_KEY]: id });
  }

  async function getHistory() {
    const store = getStore();
    if (!store) return [];
    const stored = await store.get(HISTORY_KEY);
    const list = stored[HISTORY_KEY];
    return Array.isArray(list) ? list : [];
  }

  async function appendHistory(announcement) {
    const store = getStore();
    if (!announcement || !announcement.id || !store) return;
    try {
      const history = await getHistory();
      const filtered = history.filter((entry) => entry.id !== announcement.id);
      filtered.unshift({
        id: announcement.id,
        type: announcement.type || "info",
        title: announcement.title || null,
        body: announcement.body || null,
        link: announcement.link || null,
        linkLabel: announcement.linkLabel || null,
        receivedAt: Date.now(),
      });
      await store.set({ [HISTORY_KEY]: filtered.slice(0, HISTORY_MAX) });
    } catch (_) {
      // History is best-effort; never break the fetch path.
    }
  }

  async function clearHistory() {
    const store = getStore();
    if (store) await store.remove(HISTORY_KEY);
  }

  /**
   * Build the banner DOM and inject it into `container`. Returns the element
   * or null if nothing should be shown.
   */
  function renderBanner(container, announcement, lang, onDismiss) {
    if (!container) return null;
    container.innerHTML = "";
    container.classList.add("hidden");

    if (!announcement) return null;

    const type = ["info", "update", "warning"].includes(announcement.type)
      ? announcement.type
      : "info";

    const title = pickLocalized(announcement.title, lang);
    const body = pickLocalized(announcement.body, lang);
    const linkLabel = pickLocalized(announcement.linkLabel, lang);

    const banner = document.createElement("div");
    banner.className = `announcement-banner-inner announcement-${type}`;

    const iconSpan = document.createElement("span");
    iconSpan.className = "announcement-icon";
    iconSpan.textContent =
      type === "warning" ? "⚠️" : type === "update" ? "⬆️" : "ℹ️";
    banner.appendChild(iconSpan);

    const textWrap = document.createElement("div");
    textWrap.className = "announcement-text";

    if (title) {
      const t = document.createElement("div");
      t.className = "announcement-title";
      t.textContent = title;
      textWrap.appendChild(t);
    }
    if (body) {
      const b = document.createElement("div");
      b.className = "announcement-body";
      b.textContent = body;
      textWrap.appendChild(b);
    }
    if (announcement.link) {
      const a = document.createElement("a");
      a.className = "announcement-link";
      a.href = announcement.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = linkLabel || announcement.link;
      textWrap.appendChild(a);
    }
    banner.appendChild(textWrap);

    if (announcement.dismissable !== false) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "announcement-close";
      closeBtn.type = "button";
      const dismissLabel =
        window.i18n && window.i18n.t
          ? window.i18n.t("announcement.dismiss")
          : "Dismiss";
      closeBtn.setAttribute("aria-label", dismissLabel);
      closeBtn.title = dismissLabel;
      closeBtn.textContent = "×";
      closeBtn.addEventListener("click", async () => {
        await markDismissed(announcement.id);
        container.classList.add("hidden");
        container.innerHTML = "";
        if (typeof onDismiss === "function") onDismiss();
      });
      banner.appendChild(closeBtn);
    }

    container.appendChild(banner);
    container.classList.remove("hidden");
    return banner;
  }

  /**
   * One-shot init: fetch (or use cache), filter against current version + dismissed,
   * and render into the given container element.
   */
  async function initAnnouncement(container) {
    if (!container) return;
    try {
      const manifest = chrome.runtime.getManifest();
      const installedVersion = manifest.version;
      const lang =
        (window.i18n && window.i18n.i18nGetLang && window.i18n.i18nGetLang()) ||
        "en";

      const [announcement, dismissedId] = await Promise.all([
        fetchAnnouncement(false),
        getDismissedId(),
      ]);

      if (shouldShow(announcement, installedVersion, dismissedId)) {
        renderBanner(container, announcement, lang);
      }
    } catch (err) {
      // Silent fail — the banner is purely informational and must never block the chat
      console.debug("[announcement] init failed:", err);
    }
  }

  window.announcement = {
    init: initAnnouncement,
    fetch: fetchAnnouncement,
    shouldShow,
    pickLocalized,
    compareVersions,
    getHistory,
    clearHistory,
    ENDPOINT,
  };
})();
