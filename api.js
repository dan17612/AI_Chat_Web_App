// ============================================
// AI Chat Pro Client – Web App API Layer
// Supports both non-streaming and streaming responses.
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

  // ============================================
  // Non-streaming calls (fallback)
  // ============================================

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
    const generationConfig = {
      temperature: s.temperature,
      maxOutputTokens: s.maxTokens,
    };
    if (geminiSupportsThinking(model)) {
      // -1 = dynamic thinking: the model decides how much to think.
      // This also tends to produce longer, more incremental thought summaries.
      generationConfig.thinkingConfig = {
        includeThoughts: true,
        thinkingBudget: -1,
      };
    }
    const body = { contents, generationConfig };
    if (s.systemPrompt) body.systemInstruction = { parts: [{ text: s.systemPrompt }] };
    const base = (s.baseUrls?.gemini || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
    const resp = await fetch(`${base}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) await handleHttpError(resp, "gemini");
    const data = await resp.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    let content = "";
    let reasoning = "";
    for (const p of parts) {
      if (!p.text) continue;
      if (p.thought === true) reasoning += p.text;
      else content += p.text;
    }
    return { content, reasoning };
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

  // ============================================
  // Streaming calls
  // ============================================

  /**
   * Parse SSE lines from a text chunk.
   * Handles buffering of incomplete lines across chunks.
   */
  function createSSEParser() {
    let buffer = "";
    return function parse(chunk) {
      buffer += chunk;
      const events = [];
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            events.push(JSON.parse(trimmed.slice(6)));
          } catch (e) { /* skip malformed */ }
        }
      }
      return events;
    };
  }

  /**
   * Stream from OpenAI-compatible endpoint (OpenAI, Perplexity, LM Studio).
   * Calls onContent(text), onReasoning(text) for each chunk.
   * Returns { content, reasoning, citations, usage }.
   */
  async function streamOpenAICompatible(url, headers, body, callbacks) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw apiError("api", [resp.status, err.error?.message || resp.statusText],
        `API error (${resp.status}): ${err.error?.message || resp.statusText}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    const parse = createSSEParser();
    let content = "";
    let reasoning = "";
    let citations = [];
    let usage = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const events = parse(decoder.decode(value, { stream: true }));
      for (const data of events) {
        const delta = data.choices?.[0]?.delta;
        if (!delta) continue;

        // Reasoning tokens (OpenAI reasoning models, some providers)
        const reasoningChunk = delta.reasoning_content || delta.reasoning || null;
        if (reasoningChunk) {
          reasoning += reasoningChunk;
          if (callbacks.onReasoning) callbacks.onReasoning(reasoningChunk);
        }

        // Content tokens
        if (delta.content) {
          content += delta.content;
          if (callbacks.onContent) callbacks.onContent(delta.content);
        }

        // Citations (Perplexity)
        if (data.citations) citations = data.citations;
        if (data.usage) usage = data.usage;
      }
    }

    return { content, reasoning, citations, usage };
  }

  /**
   * Stream from Anthropic API.
   * Anthropic uses a different SSE format with event types.
   */
  async function streamAnthropic(s, apiKey, model, messages, callbacks) {
    const body = {
      model,
      max_tokens: s.maxTokens,
      stream: true,
      messages: messages.filter((m) => m.role !== "system"),
    };
    if (s.systemPrompt) body.system = s.systemPrompt;

    // Extended thinking for Claude models that support it
    if (model && (model.includes("claude-3-7") || model.includes("claude-4") || model.includes("opus") || model.includes("sonnet-4"))) {
      body.thinking = { type: "enabled", budget_tokens: Math.min(s.maxTokens, 8000) };
    }

    const base = (s.baseUrls?.anthropic || "https://api.anthropic.com").replace(/\/$/, "");
    const resp = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-allow-browser": "true",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) await handleHttpError(resp, "anthropic");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    const parse = createSSEParser();
    let content = "";
    let reasoning = "";
    let usage = null;
    let currentBlockType = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const events = parse(decoder.decode(value, { stream: true }));
      for (const data of events) {
        // Anthropic event types
        if (data.type === "content_block_start") {
          currentBlockType = data.content_block?.type || null;
        } else if (data.type === "content_block_delta") {
          if (data.delta?.type === "thinking_delta") {
            reasoning += data.delta.thinking;
            if (callbacks.onReasoning) callbacks.onReasoning(data.delta.thinking);
          } else if (data.delta?.type === "text_delta") {
            content += data.delta.text;
            if (callbacks.onContent) callbacks.onContent(data.delta.text);
          }
        } else if (data.type === "message_delta") {
          if (data.usage) usage = data.usage;
        }
      }
    }

    return { content, reasoning, usage };
  }

  /**
   * Detect whether a Gemini model supports the "thinking" feature.
   * Supported by 2.5+, 3.x and explicit "thinking" / "flash-lite-preview" models.
   */
  function geminiSupportsThinking(model) {
    if (!model) return false;
    const m = model.toLowerCase();
    return (
      m.includes("2.5") ||
      m.includes("3.0") ||
      m.includes("3.1") ||
      m.includes("3-") ||
      m.includes("thinking") ||
      m.includes("flash-lite")
    );
  }

  /**
   * Stream from Google Gemini API.
   * Uses :streamGenerateContent?alt=sse which returns OpenAI-like SSE chunks.
   * For thinking-capable models, asks for thought summaries via
   * generationConfig.thinkingConfig.includeThoughts and routes parts with
   * thought:true to onReasoning.
   */
  async function streamGemini(s, apiKey, model, messages, callbacks) {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const generationConfig = {
      temperature: s.temperature,
      maxOutputTokens: s.maxTokens,
    };
    if (geminiSupportsThinking(model)) {
      // -1 = dynamic thinking: the model decides how much to think.
      // This also tends to produce longer, more incremental thought summaries.
      generationConfig.thinkingConfig = {
        includeThoughts: true,
        thinkingBudget: -1,
      };
    }
    const body = { contents, generationConfig };
    if (s.systemPrompt) body.systemInstruction = { parts: [{ text: s.systemPrompt }] };
    const base = (s.baseUrls?.gemini || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
    const resp = await fetch(
      `${base}/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) await handleHttpError(resp, "gemini");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    const parse = createSSEParser();
    let content = "";
    let reasoning = "";
    let usage = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const events = parse(decoder.decode(value, { stream: true }));
      for (const data of events) {
        const parts = data.candidates?.[0]?.content?.parts;
        if (parts && Array.isArray(parts)) {
          for (const p of parts) {
            if (!p.text) continue;
            if (p.thought === true) {
              reasoning += p.text;
              if (callbacks.onReasoning) callbacks.onReasoning(p.text);
            } else {
              content += p.text;
              if (callbacks.onContent) callbacks.onContent(p.text);
            }
          }
        }
        if (data.usageMetadata) usage = data.usageMetadata;
      }
    }

    return { content, reasoning, usage };
  }

  /**
   * Main streaming entry point.
   * @param {Object} settings
   * @param {Array} messages
   * @param {Object} callbacks - { onContent(chunk), onReasoning(chunk) }
   * @returns {Promise<{content, reasoning, citations?, usage?}>}
   */
  async function chatStream(settings, messages, callbacks) {
    const s = settings || {};
    const provider = s.provider || "perplexity";
    const apiKey = s.apiKeys?.[provider] || "";
    const model = s.models?.[provider] || "";
    const built = buildMessages(s, messages);
    const cb = callbacks || {};

    if (provider !== "lmstudio" && !apiKey) {
      throw apiError("apiKeyMissing", [], "API key not configured.");
    }

    try {
      switch (provider) {
        case "anthropic":
          return await streamAnthropic(s, apiKey, model, built, cb);

        case "openai": {
          const base = (s.baseUrls?.openai || "https://api.openai.com").replace(/\/$/, "");
          return await streamOpenAICompatible(
            `${base}/v1/chat/completions`,
            { Authorization: `Bearer ${apiKey}` },
            { model, messages: built, temperature: s.temperature, max_tokens: s.maxTokens },
            cb
          );
        }

        case "lmstudio": {
          const base = (s.baseUrls?.lmstudio || "http://localhost:1234").replace(/\/$/, "");
          const lmBody = { messages: built, temperature: s.temperature, max_tokens: s.maxTokens };
          if (model) lmBody.model = model;
          return await streamOpenAICompatible(
            `${base}/v1/chat/completions`,
            apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
            lmBody,
            cb
          );
        }

        case "perplexity":
        default: {
          const base = (s.baseUrls?.perplexity || "https://api.perplexity.ai").replace(/\/$/, "");
          return await streamOpenAICompatible(
            `${base}/chat/completions`,
            { Authorization: `Bearer ${apiKey}` },
            { model, messages: built, temperature: s.temperature, max_tokens: s.maxTokens },
            cb
          );
        }

        case "gemini":
          try {
            return await streamGemini(s, apiKey, model, built, cb);
          } catch (e) {
            // Fallback to non-streaming if the streaming endpoint fails
            if (e.errorCode) throw e;
            return await callGemini(s, apiKey, model, built);
          }
      }
    } catch (err) {
      if (err.errorCode) throw err;
      throw apiError("connection", [err.message], `Connection error: ${err.message}`);
    }
  }

  /**
   * Non-streaming main entry point (legacy).
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

  window.Api = { chat, chatStream };
})();
