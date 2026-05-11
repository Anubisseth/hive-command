// =============================================
// HIVE COMMAND — Vite Configuration
// Dev server, build, and plugin settings
// =============================================

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev-mode AI proxy plugin — replicates api/ai.js locally
function devAiProxy() {
  let env;
  return {
    name: 'dev-ai-proxy',
    configResolved(config) {
      env = loadEnv(config.mode, config.root, '');
    },
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
        if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'POST only' })); return; }

        let body = '';
        for await (const chunk of req) body += chunk;
        const { provider, action, messages, prompt, options = {} } = JSON.parse(body);

        const ANTHROPIC_KEY = env.VITE_ANTHROPIC_API_KEY;
        const OPENAI_KEY = env.VITE_OPENAI_API_KEY || (ANTHROPIC_KEY?.startsWith('sk-proj') ? ANTHROPIC_KEY : '');
        const OLLAMA_URL = env.VITE_OLLAMA_URL || 'http://localhost:11434';
        const REAL_ANTHROPIC = ANTHROPIC_KEY && !ANTHROPIC_KEY.startsWith('sk-proj') ? ANTHROPIC_KEY : null;

        res.setHeader('Content-Type', 'application/json');

        try {
          // If a specific provider is requested, only try that one
          if (provider === 'anthropic') {
            if (!REAL_ANTHROPIC) { res.writeHead(404); res.end(JSON.stringify({ error: 'Anthropic not configured' })); return; }
            const r = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': REAL_ANTHROPIC, 'anthropic-version': '2023-06-01' },
              body: JSON.stringify({ model: options.model || 'claude-sonnet-4-20250514', max_tokens: options.maxTokens || 4096, system: options.system, messages: messages || [{ role: 'user', content: prompt }] }),
              signal: AbortSignal.timeout(60000),
            });
            if (!r.ok) throw new Error(`Claude ${r.status}`);
            const d = await r.json();
            res.writeHead(200); res.end(JSON.stringify({ provider: 'anthropic', content: d.content?.[0]?.text || '' })); return;
          }

          if (provider === 'openai') {
            if (!OPENAI_KEY) { res.writeHead(404); res.end(JSON.stringify({ error: 'OpenAI not configured' })); return; }
            const msgs = messages || [{ role: 'user', content: prompt }];
            if (options.system) msgs.unshift({ role: 'system', content: options.system });
            const r = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
              body: JSON.stringify({ model: options.model || 'gpt-4o-mini', messages: msgs, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens || 4096 }),
              signal: AbortSignal.timeout(60000),
            });
            if (!r.ok) throw new Error(`OpenAI ${r.status}`);
            const d = await r.json();
            res.writeHead(200); res.end(JSON.stringify({ provider: 'openai', content: d.choices?.[0]?.message?.content || '' })); return;
          }

          // Ollama (explicit or fallback)
          const endpoint = action === 'chat' ? '/api/chat' : '/api/generate';
          const ollamaBody = action === 'chat'
            ? { model: options.model || 'llama3.2', messages, stream: false, options: { temperature: options.temperature ?? 0.7 } }
            : { model: options.model || 'llama3.2', prompt, stream: false, system: options.system, options: { temperature: options.temperature ?? 0.7 } };
          const r = await fetch(`${OLLAMA_URL}${endpoint}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ollamaBody), signal: AbortSignal.timeout(60000),
          });
          if (!r.ok) throw new Error(`Ollama ${r.status}`);
          const d = await r.json();
          res.writeHead(200); res.end(JSON.stringify({ provider: 'ollama', content: action === 'chat' ? d.message?.content : d.response })); return;
        } catch (err) {
          console.error('[Dev AI Proxy]', err.message);
          res.writeHead(502); res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devAiProxy()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    // Allow access from Antigravity and other local tools
    host: true,
    port: 5173,
    strictPort: false,
    // Proxy Ollama API to avoid CORS issues in dev
    proxy: {
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
    },
    // Allow WebSocket connections for HMR
    hmr: {
      overlay: true,
    },
  },
  build: {
    // Increase chunk warning limit for Three.js
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunks for optimal loading
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
          if (id.includes('recharts')) return 'chart-vendor';
          if (id.includes('framer-motion')) return 'motion-vendor';
        },
      },
    },
    // Better source maps for debugging
    sourcemap: false,
    // Target modern browsers
    target: 'esnext',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react'],
    exclude: ['three'],
  },
})
