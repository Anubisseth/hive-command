// === HIVE COMMAND — Unified LLM Client ===
// Routes through /api/ai proxy with fallback chain: Claude → OpenAI → Ollama

import { calculateCost, MODEL_CATALOG } from './aiPricing';

const PROVIDERS = ['anthropic', 'openai', 'ollama'];
const DEFAULT_TIMEOUT = 60000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000;

// Lazy-load the store so this module stays usable in non-React contexts.
function recordUsageToStore(payload) {
  try {
    const store = window.__hiveStore;
    if (store && typeof store.getState === 'function') {
      store.getState().recordAiCall?.(payload);
    }
  } catch {
    /* swallow — usage logging is non-critical */
  }
}

/**
 * Call the LLM through the server-side proxy.
 * Tries each provider in order until one succeeds.
 *
 * @param {Object} params
 * @param {string} params.system - System prompt
 * @param {Array<{role: string, content: string}>} [params.messages] - Chat messages
 * @param {string} [params.prompt] - Single prompt (alternative to messages)
 * @param {Object} [params.options] - LLM options (temperature, maxTokens, model)
 * @param {AbortSignal} [params.signal] - AbortController signal for cancellation
 * @returns {Promise<{content: string, provider: string}>}
 */
export async function callLLM({ system, messages, prompt, options = {}, signal, agentId, agentName }) {
  const errors = [];

  // If caller specified a model, route to its provider first
  const preferredProvider = options.model && MODEL_CATALOG[options.model]?.provider;
  const ordered = preferredProvider
    ? [preferredProvider, ...PROVIDERS.filter(p => p !== preferredProvider)]
    : PROVIDERS;

  for (const provider of ordered) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    try {
      const result = await callWithRetry({ system, messages, prompt, options, signal, provider });

      // Record usage to store (best-effort, non-blocking)
      if (result.usage) {
        const cost = calculateCost(result.model, result.usage.inputTokens, result.usage.outputTokens);
        recordUsageToStore({
          agentId: agentId || null,
          agentName: agentName || null,
          provider: result.provider,
          model: result.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cost,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      errors.push({ provider, error: err.message });
      console.warn(`[LLM] ${provider} failed:`, err.message);
    }
  }

  throw new Error(`All LLM providers failed: ${errors.map(e => `${e.provider}: ${e.error}`).join('; ')}`);
}

/**
 * Call a specific provider with retry logic.
 */
async function callWithRetry({ system, messages, prompt, options, signal, provider }) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    try {
      return await callProvider({ system, messages, prompt, options, signal, provider });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;

      // Don't retry on 4xx errors (except 429)
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw err; // 404 = not configured, 401/403 = bad key — skip to next provider
      }

      // Rate limited — use Retry-After or exponential backoff
      const delay = err.status === 429
        ? (err.retryAfter || RETRY_BASE_DELAY) * 1000
        : RETRY_BASE_DELAY * Math.pow(2, attempt);

      if (attempt < MAX_RETRIES - 1) {
        await sleep(delay, signal);
      }
    }
  }

  throw lastError;
}

/**
 * Make a single call to the /api/ai proxy.
 */
async function callProvider({ system, messages, prompt, options, signal, provider }) {
  const timeoutMs = options.timeout || DEFAULT_TIMEOUT;
  const controller = new AbortController();

  // Combine with external signal
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hive-Token': import.meta.env.VITE_HIVE_ACCESS_TOKEN || '',
      },
      body: JSON.stringify({
        provider,
        action: messages ? 'chat' : 'generate',
        messages,
        prompt,
        options: {
          system,
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? 4096,
          model: options.model,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`${provider} ${res.status}: ${body}`);
      err.status = res.status;
      if (res.headers.get('retry-after')) {
        err.retryAfter = parseInt(res.headers.get('retry-after'), 10);
      }
      throw err;
    }

    const data = await res.json();
    return {
      content: data.content || '',
      provider: data.provider || provider,
      model: data.model,
      usage: data.usage,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generate an image from a text prompt.
 * Routes to Gemini (Nano Banana) if configured server-side, else OpenAI DALL-E 3.
 * Returns { provider, content (image URL or data:URI), model }
 */
export async function generateImage({ prompt, options = {}, signal, agentId, agentName }) {
  if (!prompt) throw new Error('prompt is required');

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hive-Token': import.meta.env.VITE_HIVE_ACCESS_TOKEN || '' },
    body: JSON.stringify({
      action: 'generateImage',
      prompt,
      options: { size: options.size || '1024x1024', quality: options.quality, model: options.model },
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Image generation failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (data.usage) {
    recordUsageToStore({
      agentId: agentId || null,
      agentName: agentName || null,
      provider: data.provider,
      model: data.model,
      inputTokens: data.usage.inputTokens,
      outputTokens: data.usage.outputTokens,
      cost: 0, // Image cost varies; not pricing per-call here. User sees the bill on their provider dashboard.
      timestamp: Date.now(),
    });
  }
  return { content: data.content, provider: data.provider, model: data.model };
}

/**
 * Extract JSON from an LLM response that may contain markdown code blocks.
 */
export function extractJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // fall through
      }
    }

    // Try finding JSON array or object in the text
    const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // fall through
      }
    }

    throw new Error('Could not extract JSON from LLM response');
  }
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}
