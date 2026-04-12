// ============================================
// AI Chat Pro Client - Unified Storage Layer
// Auto-detects chrome.storage.local (extension) or falls back to
// localStorage (web app / PWA). Exposes a promise-based API that
// matches the chrome.storage.local surface so both environments share
// the same calling code.
// ============================================

(function () {
  "use strict";

  const PREFIX = "aichat_";

  const isExtension =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.local;

  const Storage = {
    /**
     * Get one or more keys.
     * @param {string|string[]} keys
     * @returns {Promise<Object>}
     */
    get(keys) {
      if (isExtension) return chrome.storage.local.get(keys);

      const keyArr =
        typeof keys === "string"
          ? [keys]
          : Array.isArray(keys)
          ? keys
          : Object.keys(keys);
      const result = {};
      keyArr.forEach((k) => {
        const raw = localStorage.getItem(PREFIX + k);
        if (raw !== null) {
          try {
            result[k] = JSON.parse(raw);
          } catch (_) {
            result[k] = raw;
          }
        }
      });
      return Promise.resolve(result);
    },

    /**
     * Set one or more keys.
     * @param {Object} obj
     * @returns {Promise<void>}
     */
    set(obj) {
      if (isExtension) return chrome.storage.local.set(obj);

      Object.entries(obj).forEach(([k, v]) => {
        localStorage.setItem(PREFIX + k, JSON.stringify(v));
      });
      return Promise.resolve();
    },

    /**
     * Remove one or more keys.
     * @param {string|string[]} keys
     * @returns {Promise<void>}
     */
    remove(keys) {
      if (isExtension) return chrome.storage.local.remove(keys);

      const keyArr = Array.isArray(keys) ? keys : [keys];
      keyArr.forEach((k) => localStorage.removeItem(PREFIX + k));
      return Promise.resolve();
    },

    /**
     * Clear all keys set by this app (only relevant for PWA / localStorage mode).
     * In extension mode, clears the entire extension storage.
     * @returns {Promise<void>}
     */
    clear() {
      if (isExtension) return chrome.storage.local.clear();

      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
      return Promise.resolve();
    },
  };

  window.Storage = Storage;
})();
