// =============================================
// HIVE COMMAND — AI Model Catalog & Pricing
// Prices are $ per 1M tokens (input / output) as of 2026-05.
// Update as model pricing changes.
// =============================================

export const MODEL_CATALOG = {
  // ─── Anthropic ────────────────────────────────
  'claude-opus-4-7':           { provider: 'anthropic', label: 'Claude Opus 4.7',    input: 15.00, output: 75.00, tier: 'reasoning' },
  'claude-sonnet-4-6':         { provider: 'anthropic', label: 'Claude Sonnet 4.6',  input:  3.00, output: 15.00, tier: 'balanced' },
  'claude-haiku-4-5':          { provider: 'anthropic', label: 'Claude Haiku 4.5',   input:  0.25, output:  1.25, tier: 'fast' },
  'claude-sonnet-4-20250514':  { provider: 'anthropic', label: 'Claude Sonnet 4',    input:  3.00, output: 15.00, tier: 'balanced' },

  // ─── OpenAI ───────────────────────────────────
  'gpt-4o':                    { provider: 'openai',    label: 'GPT-4o',             input:  2.50, output: 10.00, tier: 'balanced' },
  'gpt-4o-mini':               { provider: 'openai',    label: 'GPT-4o Mini',        input:  0.15, output:  0.60, tier: 'fast' },
  'gpt-5':                     { provider: 'openai',    label: 'GPT-5',              input:  5.00, output: 15.00, tier: 'reasoning' },

  // ─── Ollama (local — free) ────────────────────
  'llama3.2':                  { provider: 'ollama',    label: 'Llama 3.2 (local)',  input:  0.00, output:  0.00, tier: 'free' },
  'llama3.1':                  { provider: 'ollama',    label: 'Llama 3.1 (local)',  input:  0.00, output:  0.00, tier: 'free' },
  'mistral':                   { provider: 'ollama',    label: 'Mistral (local)',    input:  0.00, output:  0.00, tier: 'free' },
  'phi3':                      { provider: 'ollama',    label: 'Phi-3 (local)',      input:  0.00, output:  0.00, tier: 'free' },
};

export function calculateCost(model, inputTokens = 0, outputTokens = 0) {
  const entry = MODEL_CATALOG[model];
  if (!entry) return 0;
  return (inputTokens * entry.input + outputTokens * entry.output) / 1_000_000;
}

export function modelsForProvider(provider) {
  return Object.entries(MODEL_CATALOG)
    .filter(([, m]) => m.provider === provider)
    .map(([id, m]) => ({ id, ...m }));
}

export const TIER_COLORS = {
  reasoning: '#8B5CF6',
  balanced:  '#00D4FF',
  fast:      '#00FF88',
  free:      '#6B7280',
};
