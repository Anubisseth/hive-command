// =============================================
// HIVE COMMAND — AI API Proxy
// Server-side proxy for LLM calls (Ollama/Claude/OpenAI/Gemini)
// Keeps API keys hidden from browser.
//
// Security posture:
//  - HIVE_ACCESS_TOKEN: when set, every request must carry matching X-Hive-Token.
//    When unset (dev only), requests are accepted; logs a warning each call.
//  - ALLOWED_ORIGIN: when set, used verbatim. When unset, '*' is allowed for
//    local dev — DO NOT leave this unset in production.
//  - Rate limit: 30 chat/generate per minute per IP, 5 image/min per IP (image
//    gen is the wallet-risk vector — tight limit).
//  - Provider errors are surfaced as a sanitized status + provider name only;
//    raw error bodies are logged server-side, never returned to the caller
//    (they can contain partial keys and request bodies).
// =============================================

// Server-side only env vars (no VITE_ prefix)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Rate limit windows: chat/generate vs image (separate buckets)
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX_CHAT = 30;
const RATE_LIMIT_MAX_IMAGE = 5;
const chatLimitMap = new Map();
const imageLimitMap = new Map();

function rateLimitCheck(ip, action) {
  const map = action === 'generateImage' ? imageLimitMap : chatLimitMap;
  const max = action === 'generateImage' ? RATE_LIMIT_MAX_IMAGE : RATE_LIMIT_MAX_CHAT;
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    map.set(ip, { start: now, count: 1 });
    return { ok: true };
  }
  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.start + RATE_LIMIT_WINDOW - now) / 1000);
    return { ok: false, retryAfter, max };
  }
  entry.count++;
  return { ok: true };
}

function authenticate(req) {
  const token = req.headers['x-hive-token'];
  const validToken = process.env.HIVE_ACCESS_TOKEN;
  if (!validToken) {
    // Dev-only fallback. In production, set HIVE_ACCESS_TOKEN.
    console.warn('[AI Proxy] HIVE_ACCESS_TOKEN not set — request accepted without auth. Set this env var in production.');
    return true;
  }
  return token === validToken;
}

function sanitizeProviderError(provider, status) {
  // Return only provider name + numeric status code. Never the body.
  return `${provider} provider error (status ${status})`;
}

export default async function handler(req, res) {
  // CORS — restrict to ALLOWED_ORIGIN in production
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hive-Token');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!authenticate(req)) {
    return res.status(401).json({ error: 'Unauthorized. Provide valid X-Hive-Token header.' });
  }

  // Rate limit per IP per action
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const action = req.body?.action || 'chat';
  const rl = rateLimitCheck(ip, action);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: `Rate limit exceeded. Max ${rl.max} ${action} requests per minute. Retry in ${rl.retryAfter}s.` });
  }

  try {
    const { provider, action, messages, prompt, options = {} } = req.body;

    // ─── Image Generation ───────────────────────────
    // Tries Gemini Nano-Banana first (if configured), falls back to OpenAI DALL-E 3.
    // Returns { provider, content: <url>, model, usage }
    if (action === 'generateImage') {
      if (!prompt) return res.status(400).json({ error: 'prompt required for generateImage' });

      // Gemini 2.5 Flash Image (Nano Banana)
      if ((provider === 'gemini' || !provider) && GEMINI_KEY) {
        try {
          const model = options.model || 'gemini-2.5-flash-image';
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseModalities: ['IMAGE'] },
              }),
              signal: AbortSignal.timeout(60000),
            }
          );
          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const img = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
            if (img?.data) {
              return res.status(200).json({
                provider: 'gemini',
                model,
                content: `data:${img.mimeType || 'image/png'};base64,${img.data}`,
                usage: { inputTokens: data.usageMetadata?.promptTokenCount || 0, outputTokens: data.usageMetadata?.candidatesTokenCount || 0 },
              });
            }
            console.warn('[AI Proxy] Gemini returned no image data — falling through to OpenAI');
          } else {
            const body = await geminiRes.text().catch(() => '');
            console.warn(`[AI Proxy] Gemini image failed (${geminiRes.status}): ${body.slice(0, 200)}`);
          }
        } catch (err) {
          if (err.name === 'AbortError') return res.status(504).json({ error: 'Gemini image timeout' });
          console.warn('[AI Proxy] Gemini image exception:', err.message);
        }
      }

      // OpenAI DALL-E 3 fallback
      if (OPENAI_KEY) {
        const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: options.size || '1024x1024',
            quality: options.quality || 'standard',
          }),
          signal: AbortSignal.timeout(60000),
        });
        if (!openaiRes.ok) {
          const body = await openaiRes.text().catch(() => '');
          console.error(`[AI Proxy] OpenAI image error (${openaiRes.status}): ${body.slice(0, 200)}`);
          return res.status(openaiRes.status).json({ error: sanitizeProviderError('openai-image', openaiRes.status) });
        }
        const data = await openaiRes.json();
        return res.status(200).json({
          provider: 'openai',
          model: 'dall-e-3',
          content: data.data?.[0]?.url || '',
          // DALL-E 3 doesn't return token usage — we estimate based on size tier
          usage: { inputTokens: 0, outputTokens: 0 },
        });
      }

      return res.status(400).json({ error: 'No image provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY on the server.' });
    }

    // ─── Ollama ───────────────────────────
    if (provider === 'ollama' || (!provider && !ANTHROPIC_KEY && !OPENAI_KEY)) {
      const endpoint = action === 'chat' ? '/api/chat' : '/api/generate';
      const body = action === 'chat'
        ? { model: options.model || 'llama3.2', messages, stream: false, options: { temperature: options.temperature ?? 0.7 } }
        : { model: options.model || 'llama3.2', prompt, stream: false, system: options.system, options: { temperature: options.temperature ?? 0.7 } };

      const ollamaRes = await fetch(`${OLLAMA_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      if (!ollamaRes.ok) {
        const body = await ollamaRes.text().catch(() => '');
        console.error(`[AI Proxy] Ollama error (${ollamaRes.status}): ${body.slice(0, 200)}`);
        return res.status(ollamaRes.status).json({ error: sanitizeProviderError('ollama', ollamaRes.status) });
      }

      const data = await ollamaRes.json();
      return res.status(200).json({
        provider: 'ollama',
        content: action === 'chat' ? data.message?.content : data.response,
        model: options.model || 'llama3.2',
        usage: {
          inputTokens: data.prompt_eval_count || 0,
          outputTokens: data.eval_count || 0,
        },
      });
    }

    // ─── Anthropic Claude ─────────────────
    if (provider === 'anthropic' || (!provider && ANTHROPIC_KEY)) {
      if (!ANTHROPIC_KEY) return res.status(400).json({ error: 'Anthropic not configured' });

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options.model || 'claude-sonnet-4-20250514',
          max_tokens: options.maxTokens || 2048,
          system: options.system,
          messages: messages || [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!claudeRes.ok) {
        const body = await claudeRes.text().catch(() => '');
        console.error(`[AI Proxy] Anthropic error (${claudeRes.status}): ${body.slice(0, 200)}`);
        return res.status(claudeRes.status).json({ error: sanitizeProviderError('anthropic', claudeRes.status) });
      }

      const data = await claudeRes.json();
      return res.status(200).json({
        provider: 'anthropic',
        content: data.content?.[0]?.text || '',
        model: data.model || options.model || 'claude-sonnet-4-20250514',
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
        },
      });
    }

    // ─── OpenAI ───────────────────────────
    if (provider === 'openai' || (!provider && OPENAI_KEY)) {
      if (!OPENAI_KEY) return res.status(400).json({ error: 'OpenAI not configured' });

      const openaiMessages = messages || [{ role: 'user', content: prompt }];
      if (options.system) {
        openaiMessages.unshift({ role: 'system', content: options.system });
      }

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens || 2048,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!openaiRes.ok) {
        const body = await openaiRes.text().catch(() => '');
        console.error(`[AI Proxy] OpenAI error (${openaiRes.status}): ${body.slice(0, 200)}`);
        return res.status(openaiRes.status).json({ error: sanitizeProviderError('openai', openaiRes.status) });
      }

      const data = await openaiRes.json();
      return res.status(200).json({
        provider: 'openai',
        content: data.choices?.[0]?.message?.content || '',
        model: data.model || options.model || 'gpt-4o-mini',
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
        },
      });
    }

    return res.status(400).json({ error: 'No AI provider configured. Set OLLAMA_URL, ANTHROPIC_API_KEY, or OPENAI_API_KEY on the server.' });
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return res.status(504).json({ error: 'AI request timed out' });
    }
    console.error('[API Proxy] AI error:', err.message);
    return res.status(500).json({ error: 'Internal AI proxy error' });
  }
}
