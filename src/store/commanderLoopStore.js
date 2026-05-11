// === HIVE COMMAND — Commander Loop Store ===
// Zustand state for the autonomous swarm loop

import { create } from 'zustand';

export const useCommanderLoopStore = create((set, get) => ({
  // Loop state
  loopState: 'IDLE', // IDLE | RUNNING | PAUSED | STOPPED
  currentDirective: null,
  iteration: 0,
  maxIterations: 10,
  currentPhase: null, // decompose | distribute | execute | collect | review

  // Current iteration data
  tasks: [],
  outputs: [],
  review: null,
  executingAgentId: null,
  executionProgress: { current: 0, total: 0 },

  // History
  iterationHistory: [],

  // Log
  log: [],

  // Settings
  delayBetweenCalls: 2000,

  // ─── Actions ─────────────────────────────────────

  setLoopState: (loopState) => set({ loopState }),
  setCurrentDirective: (currentDirective) => set({ currentDirective }),
  setIteration: (iteration) => set({ iteration }),
  setMaxIterations: (maxIterations) => set({ maxIterations }),
  setCurrentPhase: (currentPhase) => set({ currentPhase }),
  setDelayBetweenCalls: (delayBetweenCalls) => set({ delayBetweenCalls }),

  setTasks: (tasks) => set({ tasks }),
  setOutputs: (outputs) => set({ outputs }),
  setReview: (review) => set({ review }),

  setExecutingAgent: (agentId, current, total) => set({
    executingAgentId: agentId,
    executionProgress: { current, total },
  }),

  clearExecutingAgent: () => set({
    executingAgentId: null,
    executionProgress: { current: 0, total: 0 },
  }),

  addOutput: (output) => set(state => ({
    outputs: [...state.outputs, output],
  })),

  pushIterationHistory: (entry) => set(state => ({
    iterationHistory: [...state.iterationHistory, entry],
  })),

  addLog: (entry) => set(state => ({
    log: [...state.log, {
      ...entry,
      timestamp: new Date().toISOString(),
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    }],
  })),

  // Reset for new loop
  resetLoop: () => set({
    loopState: 'IDLE',
    currentDirective: null,
    iteration: 0,
    currentPhase: null,
    tasks: [],
    outputs: [],
    review: null,
    executingAgentId: null,
    executionProgress: { current: 0, total: 0 },
    iterationHistory: [],
    log: [],
  }),

  // Reset only current iteration data (between iterations)
  resetIteration: () => set({
    tasks: [],
    outputs: [],
    review: null,
    executingAgentId: null,
    executionProgress: { current: 0, total: 0 },
  }),
}));
