// ============================================
// AI Chat Pro Client – Web App API Layer
// Direct provider fetch calls (no background service worker).
// On error throws an object: { message, errorCode, errorParams }
// ============================================

(function () {
  "use strict";

  function apiError(code, params, fallback) {
    const err = new Error(fallback);
    err.errorCode = code;
    err.errorParams = params || [];
    return err;
  }

  function buildMessages(s, requestMessages) {
    const msgs = [];
    if (s.systemPrompt) msgs.push({ role: "system", content: s.systemPrompt });
    msgs.push(...requestMessages);
    return msgs;
  }

  async function handleHttpError(response, provider) {
    const err = await response.json().catch(() => ({}));
    const detail = err.error?.message || response.statusText;
    const code = provider === "lmstudio" ? "lmstudio" : "api";
    throw apiError(code, [response.status, detail],
      `${provider} error (${response.status}): ${detail}`);
  }

  async function callPerplexity(s, apiKey, model, messages) {
    const base = (s.baseUrls?.perplexity || "https://api.perplexity.ai").replace(/\/$/, "");
    const resp = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: s.temperature, max_tokens: s.maxTokens, stream: false }),
    });
    if (!resp.ok) await handleHttpError(resp, "perplexity");
    const data = await resp.json();
    return { content: data.choices[0].message.content, citations: data.citations || [], usage: data.usage };
  }

  async function callOpenAI(s, apiKey, model, messages) {
    const base = (s.baseUrls?.openai || "https://api.openai.com").replace(/\/$/, "");
    const resp = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: s.temperature, max_tokens: s.maxTokens }),
    });
    if (!resp.ok) await handleHttpError(resp, "openai");
    const data = await resp.json();
    return { content: data.choices[0].message.content, usage: data.usage };
  }

  async function callAnthropic(s, apiKey, model, messages) {
    const body = {
      model,
      max_tokens: s.maxTokens,
      messages: messages.filter((m) => m.role !== "system"),
    };
    if (s.systemPrompt) body.system = s.systemPrompt;
    const base = (s.baseUrls?.anthropic || "https://api.anthropic.com").replace(/\/$/, "");
    const resp = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // Required for direct browser calls to the Anthropic API
        "anthropic-dangerous-allow-browser": "true",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) await handleHttpError(resp, "anthropic");
    const data = await resp.json();
    return { content: data.content[0].text, usage: data.usage };
  }

  async function callGemini(s, apiKey, model, messages) {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const body = {
      contents,
      generationConfig: { temperature: s.temperature, maxOutputTokens: s.maxTokens },
    };
    if (s.systemPrompt) body.systemInstruction = { parts: [{ text: s.systemPrompt }] };
    const base = (s.baseUrls?.gemini || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
    const resp = await fetch(`${base}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) await handleHttpError(resp, "gemini");
    const data = await resp.json();
    return { content: data.candidates[0].content.parts[0].text };
  }

  async function callLMStudio(s, apiKey, model, messages) {
    const base = (s.baseUrls?.lmstudio || "http://localhost:1234").replace(/\/$/, "");
    const body = { messages, temperature: s.temperature, max_tokens: s.maxTokens, stream: false };
    if (model) body.model = model;
    const resp = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) await handleHttpError(resp, "lmstudio");
    const data = await resp.json();
    return { content: data.choices[0].message.content, usage: data.usage };
  }

  /**
   * Main entry point.
   * @param {Object} settings  - full settings object from Storage
   * @param {Array}  messages  - [{role, content}, …]
   * @returns {Promise<{content, citations?, usage?}>}
   * @throws  Error with .errorCode + .errorParams on failure
   */
  async function chat(settings, messages) {
    const s = settings || {};
    const provider = s.provider || "perplexity";
    const apiKey = s.apiKeys?.[provider] || "";
    const model = s.models?.[provider] || "";
    const built = buildMessages(s, messages);

    if (provider !== "lmstudio" && !apiKey) {
      throw apiError("apiKeyMissing", [], "API key not configured.");
    }

    try {
      switch (provider) {
        case "openai":    return await callOpenAI(s, apiKey, model, built);
        case "anthropic": return await callAnthropic(s, apiKey, model, built);
        case "gemini":    return await callGemini(s, apiKey, model, built);
        case "lmstudio":  return await callLMStudio(s, apiKey, model, built);
        default:          return await callPerplexity(s, apiKey, model, built);
      }
    } catch (err) {
      if (err.errorCode) throw err;
      throw apiError("connection", [err.message], `Connection error: ${err.message}`);
    }
  }

  window.Api = { chat };
})();
