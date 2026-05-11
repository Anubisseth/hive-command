// =============================================
// HIVE COMMAND — Agent Store (Zustand)
// Centralized state: agents, directives, tasks,
// outputs, UI, notifications
// Optimistic mutations with Airtable background sync
// =============================================

import { create } from 'zustand';
import { useMemo } from 'react';
import { agents as agentData } from '../data/agents';

const SEED_NOTIFICATIONS = [];

const useAgentStore = create((set, get) => ({
  // Agent data — starts with local, can be replaced by Airtable
  agents: agentData,
  dataSource: 'local', // 'local' | 'airtable'
  loading: true,
  lastSync: null,

  // Directives, Tasks, Outputs — live Airtable data
  directives: [],
  tasks: [],
  outputs: [],
  activityLog: [],

  // UI state
  selectedAgentId: null,
  filter: { tier: 'all', venture: 'all', status: 'all' },
  searchQuery: '',

  // Notifications
  notifications: SEED_NOTIFICATIONS,

  // ─── AI Usage Tracking ────────────────────────
  // Aggregate counters + last 50 call history. Persists to localStorage.
  aiUsage: (() => {
    try {
      const raw = localStorage.getItem('hive-ai-usage');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCalls: 0, perAgent: {}, perModel: {}, history: [] };
  })(),

  recordAiCall: (call) => set(state => {
    const u = state.aiUsage;
    const agentKey = call.agentId || '_unattributed';
    const modelKey = call.model || 'unknown';
    const next = {
      totalCost: u.totalCost + (call.cost || 0),
      totalInputTokens: u.totalInputTokens + (call.inputTokens || 0),
      totalOutputTokens: u.totalOutputTokens + (call.outputTokens || 0),
      totalCalls: u.totalCalls + 1,
      perAgent: {
        ...u.perAgent,
        [agentKey]: {
          cost: (u.perAgent[agentKey]?.cost || 0) + (call.cost || 0),
          tokens: (u.perAgent[agentKey]?.tokens || 0) + (call.inputTokens || 0) + (call.outputTokens || 0),
          calls: (u.perAgent[agentKey]?.calls || 0) + 1,
          lastCallAt: call.timestamp,
        },
      },
      perModel: {
        ...u.perModel,
        [modelKey]: {
          cost: (u.perModel[modelKey]?.cost || 0) + (call.cost || 0),
          tokens: (u.perModel[modelKey]?.tokens || 0) + (call.inputTokens || 0) + (call.outputTokens || 0),
          calls: (u.perModel[modelKey]?.calls || 0) + 1,
        },
      },
      history: [call, ...u.history].slice(0, 50),
    };
    try { localStorage.setItem('hive-ai-usage', JSON.stringify(next)); } catch {}
    return { aiUsage: next };
  }),

  resetAiUsage: () => set(() => {
    const fresh = { totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCalls: 0, perAgent: {}, perModel: {}, history: [] };
    try { localStorage.setItem('hive-ai-usage', JSON.stringify(fresh)); } catch {}
    return { aiUsage: fresh };
  }),

  // ─── Data Actions ────────────────────────────
  setAgents: (agents) => set({ agents }),
  setDirectives: (directives) => set({ directives }),
  setTasks: (tasks) => set({ tasks }),
  setOutputs: (outputs) => set({ outputs }),
  setActivityLog: (activityLog) => set({ activityLog }),
  setDataSource: (source) => set({ dataSource: source }),
  setLoading: (loading) => set({ loading }),
  setLastSync: (time) => set({ lastSync: time }),

  // ─── UI Actions ──────────────────────────────
  selectAgent: (id) => set({ selectedAgentId: id }),
  clearSelection: () => set({ selectedAgentId: null }),
  setFilter: (key, value) => set(state => ({
    filter: { ...state.filter, [key]: value },
  })),
  setSearch: (query) => set({ searchQuery: query }),

  // ─── Notification Actions ────────────────────
  addNotification: (notification) => set(state => ({
    notifications: [notification, ...state.notifications],
  })),
  markAllRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
  })),
  clearNotification: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),

  // ─── Agent Mutations (optimistic + Airtable sync) ───
  updateAgentStatus: (agentId, status) => {
    set(state => ({
      agents: state.agents.map(a => a.id === agentId ? { ...a, status } : a),
    }));
    const agent = get().agents.find(a => a.id === agentId);
    if (agent?._recordId) {
      import('../lib/airtable').then(({ updateAgentStatus }) => {
        updateAgentStatus(agent._recordId, status).catch(err =>
          console.error('[Store] Failed to sync status to Airtable:', err)
        );
      });
    }
  },

  updateAgentTask: (agentId, task) => {
    // Stamp the task with receivedAt so views can show "JUST RECEIVED" pulses.
    // If the same description is being kept (e.g. a progress update), preserve the original receivedAt.
    set(state => ({
      agents: state.agents.map(a => {
        if (a.id !== agentId) return a;
        if (!task) return { ...a, task: null };
        const prevTask = a.task;
        const sameDescription = prevTask && prevTask.description === task.description;
        const receivedAt = sameDescription ? prevTask.receivedAt : Date.now();
        return { ...a, task: { ...task, receivedAt } };
      }),
    }));
    const agent = get().agents.find(a => a.id === agentId);
    if (agent?._recordId) {
      import('../lib/airtable').then(({ updateAgentTask }) => {
        updateAgentTask(agent._recordId, task?.description || '', task?.progress || 0).catch(err =>
          console.error('[Store] Failed to sync task to Airtable:', err)
        );
      });
    }
  },

  // ─── Agent CRUD ──────────────────────────────
  addAgent: (agent) => set(state => ({
    agents: [...state.agents, agent],
  })),

  removeAgent: (agentId) => set(state => ({
    agents: state.agents.filter(a => a.id !== agentId),
    selectedAgentId: state.selectedAgentId === agentId ? null : state.selectedAgentId,
  })),

  updateAgentFields: (agentId, updates) => {
    set(state => ({
      agents: state.agents.map(a => a.id === agentId ? { ...a, ...updates } : a),
    }));
    // Sync to Airtable in background
    const agent = get().agents.find(a => a.id === agentId);
    if (agent?._recordId) {
      import('../lib/airtable').then(({ updateAgentFields }) => {
        updateAgentFields(agent._recordId, updates).catch(err =>
          console.error('[Store] Failed to sync agent update to Airtable:', err)
        );
      });
    }
  },

  // ─── Directive Mutations ─────────────────────
  addDirective: (directive) => set(state => ({
    directives: [directive, ...state.directives],
  })),

  updateDirective: (id, updates) => set(state => ({
    directives: state.directives.map(d => d.id === id ? { ...d, ...updates } : d),
  })),

  // ─── Task Mutations ─────────────────────────
  addTask: (task) => set(state => ({
    tasks: [task, ...state.tasks],
  })),

  updateTaskInStore: (id, updates) => set(state => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
  })),

  // ─── Output Mutations ───────────────────────
  addOutput: (output) => set(state => ({
    outputs: [output, ...state.outputs],
  })),

  updateOutputInStore: (id, updates) => set(state => ({
    outputs: state.outputs.map(o => o.id === id ? { ...o, ...updates } : o),
  })),
}));

// ─── Derived-data hooks ────────────────────────

export function useFilteredAgents() {
  const agents = useAgentStore(s => s.agents);
  const filter = useAgentStore(s => s.filter);
  const searchQuery = useAgentStore(s => s.searchQuery);

  return useMemo(() => {
    return agents.filter(a => {
      if (filter.tier !== 'all' && a.tier !== parseInt(filter.tier)) return false;
      if (filter.venture !== 'all' && a.venture !== filter.venture) return false;
      if (filter.status !== 'all' && a.status !== filter.status) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.mandate.toLowerCase().includes(q);
      }
      return true;
    });
  }, [agents, filter, searchQuery]);
}

export function useStatusCounts() {
  const agents = useAgentStore(s => s.agents);
  return useMemo(() => ({
    active:    agents.filter(a => a.status === 'active').length,
    idle:      agents.filter(a => a.status === 'idle').length,
    blocked:   agents.filter(a => a.status === 'blocked').length,
    reviewing: agents.filter(a => a.status === 'reviewing').length,
    offline:   agents.filter(a => a.status === 'offline').length,
    total:     agents.length,
  }), [agents]);
}

export function useSelectedAgent() {
  const agents = useAgentStore(s => s.agents);
  const selectedAgentId = useAgentStore(s => s.selectedAgentId);
  return useMemo(() => agents.find(a => a.id === selectedAgentId) || null, [agents, selectedAgentId]);
}

export function useChildAgents(parentId) {
  const agents = useAgentStore(s => s.agents);
  return useMemo(() => agents.filter(a => a.parent === parentId), [agents, parentId]);
}

export function useActiveTasks() {
  const agents = useAgentStore(s => s.agents);
  return useMemo(() =>
    agents
      .filter(a => a.task)
      .map(a => ({ agentId: a.id, agentName: a.name, venture: a.venture, status: a.status, ...a.task })),
    [agents]
  );
}

export function useDataSource() {
  return {
    source: useAgentStore(s => s.dataSource),
    loading: useAgentStore(s => s.loading),
    lastSync: useAgentStore(s => s.lastSync),
  };
}

export function useNotifications() {
  const notifications = useAgentStore(s => s.notifications);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  return { notifications, unreadCount };
}

// Expose store globally for non-React consumers (llmClient usage recording)
if (typeof window !== 'undefined') {
  window.__hiveStore = useAgentStore;
}

export function useAiUsage() {
  return useAgentStore(s => s.aiUsage);
}

export default useAgentStore;
