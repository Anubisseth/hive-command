// =============================================
// HIVE COMMAND — Agent Store (Zustand)
// Centralized state: agents, directives, tasks,
// outputs, UI, notifications
// Optimistic mutations with Airtable background sync
// =============================================

import { create } from 'zustand';
import { useMemo } from 'react';
import { agents as agentData } from '../data/agents';

const SEED_NOTIFICATIONS = [
  { id: 'n1', type: 'task_complete', message: 'Cold Email Agent completed batch 3/5', agentId: 'a_cem', time: '2026-03-29T10:30:00Z', read: false },
  { id: 'n2', type: 'output_ready', message: 'Blog post draft ready for review', agentId: 'a_seo', time: '2026-03-29T09:15:00Z', read: false },
  { id: 'n3', type: 'agent_status_change', message: 'Diamond Pricing Agent went idle', agentId: 'a_dia', time: '2026-03-29T08:00:00Z', read: false },
  { id: 'n4', type: 'directive_issued', message: 'New directive deployed to Client Onboard', agentId: 'a_onb', time: '2026-03-28T14:00:00Z', read: true },
  { id: 'n5', type: 'system', message: 'Airtable sync completed — 22 agents loaded', agentId: null, time: '2026-03-28T12:00:00Z', read: true },
];

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
    set(state => ({
      agents: state.agents.map(a => a.id === agentId ? { ...a, task } : a),
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

export default useAgentStore;
