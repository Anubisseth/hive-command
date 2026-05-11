// =============================================
// HIVE COMMAND — AI API Proxy
// Server-side proxy for LLM calls (Ollama/Claude/OpenAI)
// Keeps API keys hidden from browser
// =============================================

// Server-side only env vars (no VITE_ prefix)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

function authenticate(req) {
  const token = req.headers['x-hive-token'];
  const validToken = process.env.HIVE_ACCESS_TOKEN;
  if (!validToken) return true;
  return token === validToken;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hive-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!authenticate(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
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
          }
          // Otherwise fall through to OpenAI
        } catch (err) {
          if (err.name === 'AbortError') return res.status(504).json({ error: 'Gemini image timeout' });
          // Fall through
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
          const err = await openaiRes.text().catch(() => '');
          return res.status(openaiRes.status).json({ error: `OpenAI image ${openaiRes.status}: ${err}` });
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
        return res.status(ollamaRes.status).json({ error: `Ollama ${ollamaRes.status}` });
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
        const err = await claudeRes.text().catch(() => '');
        return res.status(claudeRes.status).json({ error: `Claude ${claudeRes.status}: ${err}` });
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
        const err = await openaiRes.text().catch(() => '');
        return res.status(openaiRes.status).json({ error: `OpenAI ${openaiRes.status}: ${err}` });
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
