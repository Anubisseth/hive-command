// =============================================
// HIVE COMMAND — Ollama LLM Client
// Local LLM support via Ollama REST API
// Provides AI capabilities for agent orchestration
// =============================================

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';
const FETCH_TIMEOUT = 30_000; // 30s for LLM responses

/**
 * Check if Ollama is running and accessible
 */
export async function isOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * List available Ollama models
 */
export async function listModels() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map(m => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Generate a completion from Ollama
 * @param {string} prompt - The prompt text
 * @param {Object} options - { model, system, temperature, stream }
 * @returns {Promise<string>} Generated text
 */
export async function generate(prompt, options = {}) {
  const model = options.model || OLLAMA_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || FETCH_TIMEOUT);

  try {
    const body = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens || 1024,
      },
    };

    if (options.system) {
      body.system = options.system;
    }

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`Ollama ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.response || '';
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Ollama request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Chat completion with message history
 * @param {Array} messages - [{ role: 'user'|'assistant'|'system', content: '...' }]
 * @param {Object} options - { model, temperature }
 * @returns {Promise<string>} Assistant response
 */
export async function chat(messages, options = {}) {
  const model = options.model || OLLAMA_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || FETCH_TIMEOUT);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens || 2048,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`Ollama chat ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.message?.content || '';
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Ollama chat request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── HIVE COMMAND AI Operations ─────────────────

const SYSTEM_PROMPT = `You are HIVE COMMAND AI, the intelligence layer for an AI agent swarm operations dashboard. Think of yourself as the hive mind. You help a solo operator (the Beekeeper) manage an AI agent swarm organized in a hive hierarchy: Queen/Commander > Directors > Managers > Worker Agents. The operator's ventures, agents, and current swarm state are provided as context in each prompt — adapt your guidance to whatever swarm you're called on.

Your responses should be:
- Sharp and concise (hive ops style)
- Data-driven when possible
- Actionable with clear next steps
- Formatted in markdown for dashboard display`;

/**
 * Analyze agent performance and suggest optimizations
 */
export async function analyzeAgentPerformance(agents) {
  const summary = agents.map(a =>
    `${a.name} [${a.status}] Tier:${a.tier} Venture:${a.venture} ${a.task ? `Task: ${a.task.description} (${a.task.progress}%)` : 'No active task'}`
  ).join('\n');

  return generate(
    `Analyze these agent statuses and provide tactical recommendations:\n\n${summary}\n\nProvide: 1) Status assessment 2) Bottleneck agents 3) Optimization actions`,
    { system: SYSTEM_PROMPT, temperature: 0.5 }
  );
}

/**
 * Generate a directive suggestion based on current swarm state
 */
export async function suggestDirective(agents, venture) {
  const ventureAgents = agents.filter(a => a.venture === venture || venture === 'all');
  const summary = ventureAgents.map(a =>
    `${a.name} [${a.status}] — ${a.mandate}`
  ).join('\n');

  return generate(
    `Based on these agents in the "${venture}" venture:\n\n${summary}\n\nSuggest a new directive: Title, Description, Priority, Target Agents. Format as JSON.`,
    { system: SYSTEM_PROMPT, temperature: 0.6 }
  );
}

/**
 * Summarize activity log events
 */
export async function summarizeActivity(events) {
  const log = events.slice(0, 20).map(e =>
    `[${e.timestamp}] ${e.eventType}: ${e.event} (Agent: ${e.agentId}, Venture: ${e.venture})`
  ).join('\n');

  return generate(
    `Summarize this activity log into a tactical brief:\n\n${log}\n\nProvide: 1) Key events 2) Patterns 3) Concerns 4) Recommendations`,
    { system: SYSTEM_PROMPT, temperature: 0.4 }
  );
}

/**
 * Generate task breakdown from a directive
 */
export async function breakdownDirective(directive, availableAgents) {
  const agentList = availableAgents.map(a => `${a.name} (${a.id}) — ${a.mandate}`).join('\n');

  return generate(
    `Break down this directive into actionable tasks:\n\nTitle: ${directive.title}\nDescription: ${directive.description}\nPriority: ${directive.priority}\n\nAvailable agents:\n${agentList}\n\nGenerate task assignments as JSON array: [{title, description, agentId, estimatedHours}]`,
    { system: SYSTEM_PROMPT, temperature: 0.5 }
  );
}

export { OLLAMA_URL, OLLAMA_MODEL };
