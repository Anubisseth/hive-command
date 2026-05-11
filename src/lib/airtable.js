// =============================================
// HIVE COMMAND — Airtable API Client
// Connects dashboard to live Airtable backend
// =============================================

const BASE_URL = 'https://api.airtable.com/v0';
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || '';

// Table IDs — loaded from env vars so they stay out of the client bundle
export const TABLES = {
  agents:      import.meta.env.VITE_AT_TBL_AGENTS      || '',
  directives:  import.meta.env.VITE_AT_TBL_DIRECTIVES  || '',
  tasks:       import.meta.env.VITE_AT_TBL_TASKS       || '',
  outputs:     import.meta.env.VITE_AT_TBL_OUTPUTS     || '',
  activityLog: import.meta.env.VITE_AT_TBL_ACTIVITY    || '',
};

// Field ID → friendly name mappings for Agents table
// These are Airtable internal field IDs — unique to each base
// Team members: update these to match YOUR Airtable base field IDs
const AGENT_FIELDS = {
  fldmV2a0OBZxx7Ju4: 'id',
  fldnD3vPsJ9TlDXEV: 'name',
  fldaN8b2iHe7JgYMI: 'tier',
  fldAXljHZWGxJjTwo: 'venture',
  fldwheuqLVVAN7qM2: 'status',
  fldCr8Y3j5IwjvgNf: 'mandate',
  fldMgXmseBqZC7Ao6: 'trigger',
  fldUXmnPLPTXNnt2V: 'steps',
  fld0scb52GLZt5UHA: 'deliverables',
  fldQYJ0f8U6k14bXf: 'tools',
  fld7WsUXERbm03cEs: 'parent',
  fldw2PyzJsWApWpU9: 'currentTask',
  fldagLSJWYOC5BHAx: 'taskProgress',
};

// Reverse mapping: friendly name → field ID
const AGENT_FIELD_IDS = Object.fromEntries(
  Object.entries(AGENT_FIELDS).map(([k, v]) => [v, k])
);

// Tier label → number mapping
const TIER_MAP = { Commander: 0, Director: 1, Manager: 2, Agent: 3 };
const TIER_REVERSE = { 0: 'Commander', 1: 'Director', 2: 'Manager', 3: 'Agent' };

// ─── Generic Airtable fetch with timeout ─────────────────────
const FETCH_TIMEOUT = 10_000; // 10 seconds

async function airtableFetch(endpoint, options = {}) {
  if (!API_KEY) {
    console.warn('[Airtable] No API key configured — using local data');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const url = `${BASE_URL}/${BASE_ID}/${endpoint}`;
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = res.status === 401 ? 'Invalid API key'
        : res.status === 403 ? 'Insufficient permissions'
        : res.status === 429 ? 'Rate limited — try again later'
        : err.error?.message || 'Unknown error';
      console.error(`[Airtable] ${res.status}: ${msg}`);
      throw new Error(`Airtable ${res.status}: ${msg}`);
    }

    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Airtable request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Fetch all records from a table (handles pagination) ───
async function fetchAllRecords(tableId, options = {}) {
  const records = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    if (offset) params.set('offset', offset);
    if (options.sort) {
      options.sort.forEach((s, i) => {
        params.set(`sort[${i}][field]`, s.field);
        params.set(`sort[${i}][direction]`, s.direction || 'asc');
      });
    }
    if (options.filterByFormula) {
      params.set('filterByFormula', options.filterByFormula);
    }

    const qs = params.toString();
    const data = await airtableFetch(`${tableId}${qs ? '?' + qs : ''}`);
    if (!data) return null;

    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

// Airtable field name → app key mapping (REST API returns field names, not IDs)
const FIELD_NAME_MAP = {
  'Agent ID': 'id',
  'Name': 'name',
  'Tier': 'tier',
  'Venture': 'venture',
  'Status': 'status',
  'Mandate': 'mandate',
  'Trigger': 'trigger',
  'Steps': 'steps',
  'Deliverables': 'deliverables',
  'Tools': 'tools',
  'Parent ID': 'parent',
  'Current Task': 'currentTask',
  'Task Progress': 'taskProgress',
};

// ─── Transform Airtable agent record → app format ──────────
function transformAgentRecord(record) {
  const f = record.fields || {};
  const cv = record.cellValuesByFieldId || {};

  // Build unified map from all sources: field IDs, field names, cellValuesByFieldId
  const mapped = {};

  // 1. Map by field ID (from cellValuesByFieldId)
  for (const [fieldId, value] of Object.entries(cv)) {
    const key = AGENT_FIELDS[fieldId];
    if (key) mapped[key] = value;
  }

  // 2. Map by field name (from REST API fields)
  for (const [fieldName, value] of Object.entries(f)) {
    const key = FIELD_NAME_MAP[fieldName];
    if (key && mapped[key] === undefined) mapped[key] = value;
    // Also try field ID mapping
    const keyById = AGENT_FIELDS[fieldName];
    if (keyById && mapped[keyById] === undefined) mapped[keyById] = value;
  }

  // Helper: extract string from select field (could be object {id, name} or plain string)
  const get = (key) => mapped[key];
  const getStr = (key) => {
    const v = get(key);
    if (v && typeof v === 'object' && v.name) return v.name;
    return v;
  };

  const tierRaw = getStr('tier');
  const tier = typeof tierRaw === 'string' ? (TIER_MAP[tierRaw] ?? 3) : (tierRaw ?? 3);

  const stepsRaw = get('steps');
  const steps = typeof stepsRaw === 'string' ? stepsRaw.split('\n').filter(Boolean) : (stepsRaw || []);

  const deliverablesRaw = get('deliverables');
  const deliverables = typeof deliverablesRaw === 'string'
    ? deliverablesRaw.split(',').map(s => s.trim()).filter(Boolean)
    : (deliverablesRaw || []);

  const toolsRaw = get('tools');
  const tools = Array.isArray(toolsRaw)
    ? toolsRaw.map(t => (t && typeof t === 'object' && t.name) ? t.name : t)
    : (typeof toolsRaw === 'string' ? toolsRaw.split(',').map(s => s.trim()) : []);

  const currentTask = get('currentTask');
  const taskProgress = get('taskProgress');

  const ventureRaw = getStr('venture');

  return {
    _recordId: record.id,
    id: get('id') || record.id,
    name: get('name') || 'Unknown',
    tier,
    venture: ventureRaw || null,
    status: (getStr('status') || 'offline').toLowerCase(),
    mandate: get('mandate') || '',
    trigger: get('trigger') || '',
    steps,
    deliverables,
    tools,
    parent: get('parent') || null,
    task: currentTask ? { description: currentTask, progress: taskProgress || 0 } : null,
  };
}

// ─── Public API ─────────────────────────────────

/** Fetch all agents from Airtable */
export async function fetchAgents() {
  const records = await fetchAllRecords(TABLES.agents);
  if (!records) return null;
  return records.map(transformAgentRecord);
}

/** Update an agent's status in Airtable */
export async function updateAgentStatus(recordId, status) {
  return airtableFetch(TABLES.agents, {
    method: 'PATCH',
    body: JSON.stringify({
      records: [{
        id: recordId,
        fields: { 'Status': status },
      }],
    }),
  });
}

/** Update an agent's current task */
export async function updateAgentTask(recordId, taskDescription, progress) {
  return airtableFetch(TABLES.agents, {
    method: 'PATCH',
    body: JSON.stringify({
      records: [{
        id: recordId,
        fields: {
          'Current Task': taskDescription || '',
          'Task Progress': progress || 0,
        },
      }],
    }),
  });
}

// Map app priority values → Airtable select options
// App uses: urgent, normal, low | Airtable expects: critical, high, medium, low
const PRIORITY_MAP = { urgent: 'critical', normal: 'medium', low: 'low', high: 'high', medium: 'medium', critical: 'critical' };

// Valid Airtable select options for each table's select fields.
// VALID_VENTURES is derived from the local VENTURES map (+ 'all') so a developer
// can change their ventures by editing src/data/constants.js — no need to touch
// this file. The actual select-option list in Airtable must match these keys.
import { VENTURES as VENTURE_MAP } from '../data/constants';
const VALID_VENTURES = [...Object.keys(VENTURE_MAP), 'all'];
const VALID_EVENT_TYPES = ['status_change', 'task_started', 'task_completed', 'task_failed', 'directive_issued', 'output_created', 'output_reviewed', 'error', 'system'];

/** Create a new directive */
export async function createDirective(directive) {
  const fields = {
    'Title': directive.title,
    'Description': directive.description,
    'Status': directive.status || 'active',
    'Priority': PRIORITY_MAP[directive.priority] || 'medium',
    'Issued By': directive.issuedBy || 'cmd',
    'Target Agents': directive.targetAgents?.join(', ') || '',
  };

  // Only set Venture if it's a valid select option (skip empty/null)
  const venture = directive.venture;
  if (venture && VALID_VENTURES.includes(venture)) {
    fields['Venture'] = venture;
  }

  return airtableFetch(TABLES.directives, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields }] }),
  });
}

/** Fetch all directives */
export async function fetchDirectives() {
  const records = await fetchAllRecords(TABLES.directives);
  if (!records) return null;
  return records.map(r => {
    const f = r.fields || {};
    return {
      _recordId: r.id,
      id: r.id,
      title: f['Title'] || '',
      description: f['Description'] || '',
      status: f['Status'] || 'draft',
      priority: f['Priority'] || 'medium',
      issuedBy: f['Issued By'] || 'cmd',
      targetAgents: (f['Target Agents'] || '').split(',').map(s => s.trim()).filter(Boolean),
      venture: f['Venture'] || '',
      deadline: f['Deadline'] || null,
      createdAt: f['Created At'] || null,
    };
  });
}

/** Fetch activity log */
export async function fetchActivityLog(limit = 50) {
  const records = await fetchAllRecords(TABLES.activityLog, {
    sort: [{ field: 'Timestamp', direction: 'desc' }],
  });
  if (!records) return null;
  return records.slice(0, limit).map(r => {
    const f = r.fields || {};
    return {
      _recordId: r.id,
      id: r.id,
      event: f['Event'] || '',
      agentId: f['Agent ID'] || '',
      eventType: f['Event Type'] || '',
      venture: f['Venture'] || '',
      details: f['Details'] || '',
      timestamp: f['Timestamp'] || '',
    };
  });
}

// Map app event types → valid Airtable select options
const EVENT_TYPE_MAP = {
  output_approved: 'output_reviewed',
  output_rejected: 'output_reviewed',
  output_revision: 'output_reviewed',
  status_change: 'status_change',
  task_started: 'task_started',
  task_completed: 'task_completed',
  task_failed: 'task_failed',
  directive_issued: 'directive_issued',
  output_created: 'output_created',
  output_reviewed: 'output_reviewed',
  error: 'error',
  system: 'system',
};

/** Log an activity event */
export async function logActivity(event) {
  const fields = {
    'Event': event.event,
    'Agent ID': event.agentId || '',
    'Event Type': EVENT_TYPE_MAP[event.eventType] || 'system',
    'Details': event.details || '',
    'Timestamp': new Date().toISOString(),
  };

  // Only set Venture if valid
  const venture = event.venture;
  if (venture && VALID_VENTURES.includes(venture)) {
    fields['Venture'] = venture;
  }

  return airtableFetch(TABLES.activityLog, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields }] }),
  });
}

// ─── Tasks CRUD ──────────────────────────────

/** Fetch all tasks from Airtable */
export async function fetchTasks(options = {}) {
  const records = await fetchAllRecords(TABLES.tasks, {
    sort: [{ field: 'Started At', direction: 'desc' }],
    ...options,
  });
  if (!records) return null;
  return records.map(r => {
    const f = r.fields || {};
    return {
      _recordId: r.id,
      id: r.id,
      title: f['Title'] || '',
      description: f['Description'] || '',
      agentId: f['Agent ID'] || '',
      directiveId: f['Directive ID'] || '',
      status: f['Status'] || 'queued',
      progress: f['Progress'] || 0,
      venture: f['Venture'] || '',
      startedAt: f['Started At'] || null,
      completedAt: f['Completed At'] || null,
      output: f['Output'] || '',
    };
  });
}

/** Create a new task */
export async function createTask(task) {
  const fields = {
    'Title': task.title,
    'Description': task.description || '',
    'Agent ID': task.agentId || '',
    'Status': task.status || 'queued',
    'Progress': task.progress || 0,
  };
  if (task.directiveId) fields['Directive ID'] = task.directiveId;
  const venture = task.venture;
  if (venture && VALID_VENTURES.includes(venture)) {
    fields['Venture'] = venture;
  }
  return airtableFetch(TABLES.tasks, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields }] }),
  });
}

/** Update a task's status and progress */
export async function updateTask(recordId, updates) {
  const fields = {};
  if (updates.status !== undefined) fields['Status'] = updates.status;
  if (updates.progress !== undefined) fields['Progress'] = updates.progress;
  if (updates.output !== undefined) fields['Output'] = updates.output;
  if (updates.completedAt !== undefined) fields['Completed At'] = updates.completedAt;
  return airtableFetch(TABLES.tasks, {
    method: 'PATCH',
    body: JSON.stringify({
      records: [{ id: recordId, fields }],
    }),
  });
}

// ─── Outputs CRUD ─────────────────────────────

/** Fetch all outputs from Airtable */
export async function fetchOutputs(options = {}) {
  const records = await fetchAllRecords(TABLES.outputs, {
    sort: [{ field: 'Created At', direction: 'desc' }],
    ...options,
  });
  if (!records) return null;
  return records.map(r => {
    const f = r.fields || {};
    return {
      _recordId: r.id,
      id: r.id,
      title: f['Title'] || '',
      type: f['Type'] || 'document',
      agentId: f['Agent ID'] || '',
      taskId: f['Task ID'] || '',
      venture: f['Venture'] || '',
      status: f['Status'] || 'pending_review',
      content: f['Content'] || '',
      url: f['URL'] || '',
      createdAt: f['Created At'] || null,
      reviewedAt: f['Reviewed At'] || null,
    };
  });
}

/** Create a new output */
export async function createOutput(output) {
  const fields = {
    'Title': output.title,
    'Type': output.type || 'document',
    'Agent ID': output.agentId || '',
    'Status': output.status || 'pending_review',
    'Content': output.content || '',
  };
  if (output.taskId) fields['Task ID'] = output.taskId;
  if (output.url) fields['URL'] = output.url;
  const venture = output.venture;
  if (venture && VALID_VENTURES.includes(venture)) {
    fields['Venture'] = venture;
  }
  return airtableFetch(TABLES.outputs, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields }] }),
  });
}

/** Update an output's status (approve/reject/revision) */
export async function updateOutputStatus(recordId, status) {
  const fields = {
    'Status': status,
    'Reviewed At': new Date().toISOString(),
  };
  return airtableFetch(TABLES.outputs, {
    method: 'PATCH',
    body: JSON.stringify({
      records: [{ id: recordId, fields }],
    }),
  });
}

/** Update a directive's status */
export async function updateDirectiveStatus(recordId, status) {
  const fields = { 'Status': status };
  if (status === 'completed') {
    fields['Completed At'] = new Date().toISOString();
  }
  return airtableFetch(TABLES.directives, {
    method: 'PATCH',
    body: JSON.stringify({
      records: [{ id: recordId, fields }],
    }),
  });
}

// ─── Agent Full CRUD ──────────────────────────

/** Create a new agent in Airtable */
export async function createAgent(agent) {
  const fields = {
    'Agent ID': agent.id,
    'Name': agent.name,
    'Tier': TIER_REVERSE[agent.tier] || 'Agent',
    'Status': agent.status || 'idle',
    'Mandate': agent.mandate || '',
    'Trigger': agent.trigger || '',
    'Steps': Array.isArray(agent.steps) ? agent.steps.join('\n') : (agent.steps || ''),
    'Deliverables': Array.isArray(agent.deliverables) ? agent.deliverables.join(', ') : (agent.deliverables || ''),
  };
  if (agent.parent) fields['Parent ID'] = agent.parent;
  if (agent.currentTask) fields['Current Task'] = agent.currentTask;
  if (agent.venture && VALID_VENTURES.includes(agent.venture)) {
    fields['Venture'] = agent.venture;
  }
  // Tools is a multi-select — must be array of strings
  if (agent.tools && agent.tools.length > 0) {
    fields['Tools'] = agent.tools;
  }

  const result = await airtableFetch(TABLES.agents, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields }] }),
  });
  if (result && result.records && result.records[0]) {
    return transformAgentRecord(result.records[0]);
  }
  return null;
}

/** Update any agent fields in Airtable */
export async function updateAgentFields(recordId, updates) {
  const fields = {};
  if (updates.name !== undefined) fields['Name'] = updates.name;
  if (updates.tier !== undefined) fields['Tier'] = TIER_REVERSE[updates.tier] || 'Agent';
  if (updates.status !== undefined) fields['Status'] = updates.status;
  if (updates.mandate !== undefined) fields['Mandate'] = updates.mandate;
  if (updates.trigger !== undefined) fields['Trigger'] = updates.trigger;
  if (updates.parent !== undefined) fields['Parent ID'] = updates.parent || '';
  if (updates.currentTask !== undefined) fields['Current Task'] = updates.currentTask || '';
  if (updates.taskProgress !== undefined) fields['Task Progress'] = updates.taskProgress || 0;
  if (updates.steps !== undefined) {
    fields['Steps'] = Array.isArray(updates.steps) ? updates.steps.join('\n') : updates.steps;
  }
  if (updates.deliverables !== undefined) {
    fields['Deliverables'] = Array.isArray(updates.deliverables) ? updates.deliverables.join(', ') : updates.deliverables;
  }
  if (updates.venture !== undefined) {
    if (updates.venture && VALID_VENTURES.includes(updates.venture)) {
      fields['Venture'] = updates.venture;
    }
  }
  if (updates.tools !== undefined) {
    fields['Tools'] = updates.tools || [];
  }

  return airtableFetch(TABLES.agents, {
    method: 'PATCH',
    body: JSON.stringify({
      records: [{ id: recordId, fields }],
    }),
  });
}

/** Delete an agent from Airtable */
export async function deleteAgent(recordId) {
  return airtableFetch(`${TABLES.agents}?records[]=${recordId}`, {
    method: 'DELETE',
  });
}

/** Check if Airtable is configured */
export function isAirtableConfigured() {
  return !!API_KEY;
}

export { AGENT_FIELD_IDS, TIER_MAP, TIER_REVERSE };
