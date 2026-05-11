// =============================================
// HIVE COMMAND — Ollama AI Hook
// React hook for local LLM operations
// Falls back to cloud APIs if Ollama unavailable
// =============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  isOllamaAvailable,
  listModels,
  chat,
  analyzeAgentPerformance,
  suggestDirective,
  summarizeActivity,
  breakdownDirective,
} from '../lib/ollama';

const AI_ENABLED = import.meta.env.VITE_ENABLE_AI_ASSISTANT === 'true';

export default function useOllama() {
  const [available, setAvailable] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const checkedRef = useRef(false);

  // Check availability on mount
  useEffect(() => {
    if (!AI_ENABLED || checkedRef.current) return;
    checkedRef.current = true;

    isOllamaAvailable().then(ok => {
      setAvailable(ok);
      if (ok) {
        listModels().then(m => setModels(m)).catch(() => {});
      }
    });
  }, []);

  // Generic async wrapper with loading/error state
  const run = useCallback(async (fn) => {
    if (!AI_ENABLED) {
      setError('AI assistant is disabled');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Public API ─────────────────────────────

  const sendChat = useCallback((messages, options) =>
    run(() => chat(messages, options)),
  [run]);

  const analyzePerformance = useCallback((agents) =>
    run(() => analyzeAgentPerformance(agents)),
  [run]);

  const getDirectiveSuggestion = useCallback((agents, venture) =>
    run(() => suggestDirective(agents, venture)),
  [run]);

  const getActivitySummary = useCallback((events) =>
    run(() => summarizeActivity(events)),
  [run]);

  const getTaskBreakdown = useCallback((directive, availableAgents) =>
    run(() => breakdownDirective(directive, availableAgents)),
  [run]);

  return {
    // State
    enabled: AI_ENABLED,
    available,
    models,
    loading,
    error,
    // Operations
    sendChat,
    analyzePerformance,
    getDirectiveSuggestion,
    getActivitySummary,
    getTaskBreakdown,
  };
}
