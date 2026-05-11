// === HIVE COMMAND — Agent Create/Edit Modal ===

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertTriangle, Cpu } from 'lucide-react';
import GlowButton from '../atoms/GlowButton';
import { modalOverlay, modalContent } from '../../motion/variants';
import { TIERS, STATUSES, VENTURES, TOOL_COLORS } from '../../data/constants';
import { MODEL_CATALOG, TIER_COLORS as MODEL_TIER_COLORS } from '../../lib/aiPricing';

const TIER_OPTIONS = [
  { value: 0, label: 'Commander', prefix: 'cmd_' },
  { value: 1, label: 'Director', prefix: 'd_' },
  { value: 2, label: 'Manager', prefix: 'm_' },
  { value: 3, label: 'Agent', prefix: 'a_' },
];

const COMMON_TOOLS = [
  'Claude', 'Airtable', 'Gmail', 'GoHighLevel', 'Notion', 'GitHub',
  'Shopify', 'LinkedIn', 'Canva', 'Meta Ads', 'ManyChat', 'n8n',
  'Make', 'Supabase', 'Drive', 'Excel', 'Calendly', 'WordPress',
  'Buffer', 'Figma', 'DataDocked', 'WhatsApp', 'DocuSign', 'Email',
  'QuickBooks', 'Banking', 'Ahrefs', 'SEMrush', 'GSC', 'GA4',
  'Phone', 'Python', 'Web', 'APIs', 'Dashboard', 'Suppliers',
];

function generateId(name, tier) {
  if (!name) return '';
  const prefix = TIER_OPTIONS.find(t => t.value === tier)?.prefix || 'a_';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 12);
  return `${prefix}${slug}`;
}

export default function AgentFormModal({ mode = 'create', agent = null, agents = [], onSave, onDelete, onClose }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    id: '',
    name: '',
    tier: 3,
    venture: '',
    status: 'idle',
    parent: '',
    mandate: '',
    trigger: '',
    steps: '',
    deliverables: '',
    tools: [],
    model: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEdit && agent) {
      setForm({
        id: agent.id || '',
        name: agent.name || '',
        tier: agent.tier ?? 3,
        venture: agent.venture || '',
        status: agent.status || 'idle',
        parent: agent.parent || '',
        mandate: agent.mandate || '',
        trigger: agent.trigger || '',
        steps: Array.isArray(agent.steps) ? agent.steps.join('\n') : (agent.steps || ''),
        deliverables: Array.isArray(agent.deliverables) ? agent.deliverables.join(', ') : (agent.deliverables || ''),
        tools: agent.tools || [],
        model: agent.model || '',
      });
    }
  }, [isEdit, agent]);

  // Auto-generate ID in create mode
  useEffect(() => {
    if (!isEdit) {
      setForm(prev => ({ ...prev, id: generateId(prev.name, prev.tier) }));
    }
  }, [form.name, form.tier, isEdit]);

  // Eligible parents: agents with tier < selected tier
  const parentOptions = useMemo(() => {
    return agents.filter(a => a.tier < form.tier && a.id !== form.id);
  }, [agents, form.tier, form.id]);

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const toggleTool = (tool) => {
    setForm(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!isEdit) {
      const existingIds = agents.map(a => a.id);
      if (existingIds.includes(form.id)) errs.id = 'Agent ID already exists';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const agentData = {
      id: form.id,
      name: form.name.trim(),
      tier: form.tier,
      venture: form.venture || null,
      status: form.status,
      parent: form.parent || null,
      mandate: form.mandate.trim(),
      trigger: form.trigger.trim(),
      steps: form.steps.split('\n').map(s => s.trim()).filter(Boolean),
      deliverables: form.deliverables.split(',').map(s => s.trim()).filter(Boolean),
      tools: form.tools,
      model: form.model || null,
      task: isEdit ? (agent?.task || null) : null,
    };

    // Preserve Airtable record ID if editing
    if (isEdit && agent?._recordId) {
      agentData._recordId = agent._recordId;
    }

    onSave(agentData);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.(agent.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        variants={modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          variants={modalContent}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full rounded-xl overflow-hidden"
          style={{
            maxWidth: '640px',
            maxHeight: '90vh',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 0 60px rgba(255,184,0,0.08), 0 25px 50px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h2 className="font-display text-[16px] font-bold tracking-wider" style={{ color: '#FFB800' }}>
              {isEdit ? 'EDIT AGENT' : 'NEW AGENT'}
            </h2>
            <motion.button
              className="cursor-pointer p-1 rounded"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
              whileHover={{ color: 'var(--text-primary)' }}
              onClick={onClose}
            >
              <X size={18} />
            </motion.button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="flex flex-col gap-5">
              {/* Agent ID */}
              <FieldGroup label="AGENT ID" error={errors.id}>
                <input
                  type="text"
                  value={form.id}
                  readOnly={isEdit}
                  onChange={e => !isEdit && update('id', e.target.value)}
                  className="form-input"
                  style={{
                    ...inputStyle,
                    opacity: isEdit ? 0.5 : 1,
                    cursor: isEdit ? 'not-allowed' : 'text',
                  }}
                  placeholder="Auto-generated from name"
                />
              </FieldGroup>

              {/* Name */}
              <FieldGroup label="NAME" error={errors.name} required>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className="form-input"
                  style={inputStyle}
                  placeholder="e.g. COLD EMAIL AGENT"
                />
              </FieldGroup>

              {/* Tier + Venture (two-column) */}
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="TIER">
                  <select
                    value={form.tier}
                    onChange={e => update('tier', parseInt(e.target.value))}
                    style={inputStyle}
                  >
                    {TIER_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label.toUpperCase()}</option>
                    ))}
                  </select>
                </FieldGroup>

                <FieldGroup label="VENTURE">
                  <select
                    value={form.venture}
                    onChange={e => update('venture', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    {Object.entries(VENTURES).map(([key, v]) => (
                      <option key={key} value={key}>{v.name}</option>
                    ))}
                  </select>
                </FieldGroup>
              </div>

              {/* Status + Parent (two-column) */}
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="STATUS">
                  <select
                    value={form.status}
                    onChange={e => update('status', e.target.value)}
                    style={inputStyle}
                  >
                    {Object.entries(STATUSES).map(([key, s]) => (
                      <option key={key} value={key}>{s.label}</option>
                    ))}
                  </select>
                </FieldGroup>

                <FieldGroup label="PARENT AGENT">
                  <select
                    value={form.parent}
                    onChange={e => update('parent', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    {parentOptions.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({TIERS[a.tier]?.label})
                      </option>
                    ))}
                  </select>
                </FieldGroup>
              </div>

              {/* Mandate */}
              <FieldGroup label="MANDATE">
                <textarea
                  value={form.mandate}
                  onChange={e => update('mandate', e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Agent's mission / operational purpose..."
                />
              </FieldGroup>

              {/* Trigger */}
              <FieldGroup label="TRIGGER">
                <input
                  type="text"
                  value={form.trigger}
                  onChange={e => update('trigger', e.target.value)}
                  style={inputStyle}
                  placeholder="What activates this agent..."
                />
              </FieldGroup>

              {/* Steps */}
              <FieldGroup label="STEPS" hint="One step per line">
                <textarea
                  value={form.steps}
                  onChange={e => update('steps', e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder={"Scan inputs\nAnalyze data\nGenerate report\nSubmit for review"}
                />
              </FieldGroup>

              {/* Deliverables */}
              <FieldGroup label="DELIVERABLES" hint="Comma-separated">
                <input
                  type="text"
                  value={form.deliverables}
                  onChange={e => update('deliverables', e.target.value)}
                  style={inputStyle}
                  placeholder="Reports, Dashboards, Alerts"
                />
              </FieldGroup>

              {/* AI Model */}
              <FieldGroup label="AI MODEL" hint="Overrides global default for this agent">
                <div className="flex items-center gap-2">
                  <Cpu size={12} style={{ color: form.model ? MODEL_TIER_COLORS[MODEL_CATALOG[form.model]?.tier] || '#9CA3AF' : '#6B7280' }} />
                  <select
                    value={form.model}
                    onChange={e => update('model', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option value="">Use global default</option>
                    <optgroup label="Anthropic (Claude)">
                      {Object.entries(MODEL_CATALOG).filter(([, m]) => m.provider === 'anthropic').map(([id, m]) => (
                        <option key={id} value={id}>{m.label} — ${m.input}/${m.output} per M</option>
                      ))}
                    </optgroup>
                    <optgroup label="OpenAI">
                      {Object.entries(MODEL_CATALOG).filter(([, m]) => m.provider === 'openai').map(([id, m]) => (
                        <option key={id} value={id}>{m.label} — ${m.input}/${m.output} per M</option>
                      ))}
                    </optgroup>
                    <optgroup label="Ollama (Local — Free)">
                      {Object.entries(MODEL_CATALOG).filter(([, m]) => m.provider === 'ollama').map(([id, m]) => (
                        <option key={id} value={id}>{m.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </FieldGroup>

              {/* Tools */}
              <FieldGroup label="TOOLS">
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TOOLS.map(tool => {
                    const isSelected = form.tools.includes(tool);
                    const color = TOOL_COLORS[tool] || '#9CA3AF';
                    return (
                      <motion.button
                        key={tool}
                        type="button"
                        className="font-system text-[9px] font-semibold px-2 py-1 rounded cursor-pointer"
                        style={{
                          background: isSelected ? `${color}25` : 'var(--bg-surface)',
                          border: `1px solid ${isSelected ? `${color}60` : 'var(--border-subtle)'}`,
                          color: isSelected ? color : 'var(--text-muted)',
                        }}
                        whileHover={{
                          borderColor: `${color}80`,
                          color: color,
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleTool(tool)}
                      >
                        {tool}
                      </motion.button>
                    );
                  })}
                </div>
              </FieldGroup>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <div>
              {isEdit && (
                <div className="flex items-center gap-2">
                  {showDeleteConfirm ? (
                    <>
                      <span className="font-system text-[10px] flex items-center gap-1" style={{ color: '#FF3344' }}>
                        <AlertTriangle size={12} />
                        Confirm delete?
                      </span>
                      <GlowButton variant="danger" size="sm" onClick={handleDelete}>
                        YES, DELETE
                      </GlowButton>
                      <GlowButton variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                        CANCEL
                      </GlowButton>
                    </>
                  ) : (
                    <GlowButton variant="danger" size="sm" onClick={handleDelete}>
                      <span className="flex items-center gap-1">
                        <Trash2 size={10} />
                        DELETE
                      </span>
                    </GlowButton>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <GlowButton variant="secondary" size="sm" onClick={onClose}>
                CANCEL
              </GlowButton>
              <GlowButton variant="amber" size="sm" onClick={handleSave}>
                {isEdit ? 'SAVE CHANGES' : 'CREATE AGENT'}
              </GlowButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// --- Sub-components ---

function FieldGroup({ label, hint, error, required, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="font-system text-[9px] font-semibold tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
          {label}
          {required && <span style={{ color: '#FF3344' }}> *</span>}
        </label>
        {hint && (
          <span className="font-system text-[8px]" style={{ color: 'var(--text-disabled)' }}>
            ({hint})
          </span>
        )}
      </div>
      {children}
      {error && (
        <span className="font-system text-[9px] mt-1 block" style={{ color: '#FF3344' }}>
          {error}
        </span>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-system)',
  fontSize: '12px',
  outline: 'none',
};
