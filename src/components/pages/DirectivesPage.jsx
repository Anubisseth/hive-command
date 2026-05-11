import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Clock, CheckCircle, Send, X, Ban } from 'lucide-react';
import useAgentStore from '../../store/agentStore';
import { TIERS } from '../../data/constants';
import GlowButton from '../atoms/GlowButton';
import StatusDot from '../atoms/StatusDot';
import VentureBadge from '../atoms/VentureBadge';
import { createDirective, updateDirectiveStatus, isAirtableConfigured } from '../../lib/airtable';

// Empty fallback — once Airtable is configured the Directives table populates this
// via useAirtableSync. Without Airtable, the page renders an empty state.
const sampleDirectives = [];

const PRIORITY = {
  urgent: { color: '#FF3344', label: 'URGENT', bg: 'rgba(255,51,68,0.1)' },
  normal: { color: '#FFB800', label: 'NORMAL', bg: 'rgba(255,184,0,0.1)' },
  low:    { color: '#6B7280', label: 'LOW',    bg: 'rgba(107,114,128,0.1)' },
};

const DIR_STATUS = {
  pending:     { color: '#FFB800', label: 'PENDING' },
  in_progress: { color: '#00FF88', label: 'IN PROGRESS' },
  completed:   { color: '#00D4FF', label: 'COMPLETED' },
  cancelled:   { color: '#6B7280', label: 'CANCELLED' },
};

export default function DirectivesPage() {
  const [tab, setTab] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const storeDirectives = useAgentStore(s => s.directives);
  const addDirective = useAgentStore(s => s.addDirective);
  const updateDirective = useAgentStore(s => s.updateDirective);
  const agents = useAgentStore(s => s.agents);
  const [localDirectives, setLocalDirectives] = useState(sampleDirectives);

  // Map UI status → Airtable Status select option
  const STATUS_TO_AIRTABLE = { completed: 'completed', cancelled: 'cancelled', in_progress: 'active', pending: 'draft' };

  const handleStatusChange = (directive, nextStatus) => {
    const airtableId = directive.airtableId || directive.id;
    if (airtableDirectives) {
      updateDirective(directive.id, { status: nextStatus });
      if (isAirtableConfigured() && airtableId?.startsWith?.('rec')) {
        updateDirectiveStatus(airtableId, STATUS_TO_AIRTABLE[nextStatus] || nextStatus)
          .catch(err => console.error('[DirectivesPage] Failed to update directive status:', err));
      }
    } else {
      setLocalDirectives(prev => prev.map(d => d.id === directive.id ? { ...d, status: nextStatus } : d));
    }
  };

  // Use Airtable data if available, else samples
  const airtableDirectives = storeDirectives.length > 0
    ? storeDirectives.map(d => ({
        ...d,
        content: d.description || d.title,
        target: d.targetAgents?.[0] || '',
        targetName: (() => {
          const targetId = d.targetAgents?.[0] || '';
          const agent = agents.find(a => a.id === targetId || a.name === targetId);
          return agent?.name || targetId;
        })(),
        created: d.createdAt,
      }))
    : null;
  const directives = airtableDirectives || localDirectives;

  const active = directives.filter(d => d.status !== 'completed' && d.status !== 'cancelled');
  const completed = directives.filter(d => d.status === 'completed');
  const shown = tab === 'active' ? active : completed;

  const handleNewDirective = (newDir) => {
    if (airtableDirectives) {
      addDirective(newDir);
    } else {
      setLocalDirectives(prev => [newDir, ...prev]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap size={20} style={{ color: 'var(--accent-warning)' }} />
          <h1 className="font-display text-[18px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
            DIRECTIVES
          </h1>
        </div>
        <GlowButton variant="primary" size="md" onClick={() => setShowModal(true)}>
          <span className="flex items-center gap-1.5"><Plus size={12} /> NEW DIRECTIVE</span>
        </GlowButton>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {['active', 'completed'].map(t => (
          <motion.button
            key={t}
            className="font-system text-[10px] font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full cursor-pointer"
            style={{
              background: tab === t ? 'var(--bg-surface)' : 'transparent',
              border: `1px solid ${tab === t ? 'var(--accent-primary)40' : 'var(--border-subtle)'}`,
              color: tab === t ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}
            whileHover={{ borderColor: 'var(--border-strong)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setTab(t)}
          >
            {t === 'active' ? `ACTIVE (${active.length})` : `COMPLETED (${completed.length})`}
          </motion.button>
        ))}
      </div>

      {/* Directive list */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {shown.map((d, i) => {
            const pri = PRIORITY[d.priority] || PRIORITY.normal;
            const st = DIR_STATUS[d.status] || DIR_STATUS.pending;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-lg"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Priority indicator */}
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: pri.color }} />

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-system text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: pri.color, background: pri.bg, border: `1px solid ${pri.color}25` }}>
                        {pri.label}
                      </span>
                      <span className="font-system text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: st.color, background: `${st.color}15`, border: `1px solid ${st.color}25` }}>
                        {st.label}
                      </span>
                      {d.venture && <VentureBadge ventureId={d.venture} />}
                      <span className="font-system text-[8px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        → {d.targetName}
                      </span>
                      <span className="ml-auto font-system text-[8px] flex items-center gap-1" style={{ color: 'var(--text-disabled)' }}>
                        <Clock size={8} />
                        {new Date(d.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="font-body text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {d.content}
                    </p>

                    {tab === 'active' && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleStatusChange(d, 'completed')}
                          className="font-system text-[9px] tracking-wider px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                          style={{ background: 'rgba(0,255,136,0.08)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}
                        >
                          <CheckCircle size={10} /> COMPLETE
                        </button>
                        <button
                          onClick={() => handleStatusChange(d, 'cancelled')}
                          className="font-system text-[9px] tracking-wider px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                          style={{ background: 'rgba(255,51,68,0.08)', color: '#FF3344', border: '1px solid rgba(255,51,68,0.25)' }}
                        >
                          <Ban size={10} /> CANCEL
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* New Directive Modal */}
      <AnimatePresence>
        {showModal && (
          <NewDirectiveModal agents={agents} onClose={() => setShowModal(false)} onCreated={handleNewDirective} />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewDirectiveModal({ agents, onClose, onCreated }) {
  const [target, setTarget] = useState('');
  const [priority, setPriority] = useState('normal');
  const [content, setContent] = useState('');
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = async () => {
    if (!target || !content.trim()) return;
    setDeploying(true);

    const targetAgent = agents.find(a => a.id === target);
    const newDirective = {
      id: `d_${Date.now()}`,
      content: content.trim(),
      target,
      targetName: targetAgent?.name || target,
      priority,
      status: 'pending',
      created: new Date().toISOString(),
      deadline: new Date(Date.now() + 86400000).toISOString(),
    };

    // Add to local state immediately
    if (onCreated) onCreated(newDirective);

    // Fire-and-forget Airtable sync
    if (isAirtableConfigured()) {
      createDirective({
        title: `Directive for ${targetAgent?.name || target}`,
        description: content.trim(),
        status: 'active',
        priority,
        issuedBy: 'cmd',
        targetAgents: [targetAgent?.name || target],
        venture: targetAgent?.venture || '',
      }).catch(err => console.error('[DirectivesPage] Failed to create directive in Airtable:', err));
    }

    setTimeout(() => {
      setDeploying(false);
      onClose();
    }, 300);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal content */}
      <motion.div
        className="relative w-full max-w-lg rounded-xl p-6 z-10"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[16px] font-bold tracking-wider" style={{ color: 'var(--accent-warning)' }}>
            NEW DIRECTIVE
          </h2>
          <motion.button
            className="p-1 rounded cursor-pointer"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
            whileHover={{ color: 'var(--text-primary)' }}
            onClick={onClose}
          >
            <X size={16} />
          </motion.button>
        </div>

        {/* Target agent */}
        <div className="mb-4">
          <label className="font-system text-[9px] tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            TARGET AGENT
          </label>
          <select
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="w-full font-system text-[11px] px-3 py-2 rounded-md outline-none cursor-pointer"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <option value="">Select agent...</option>
            {agents.filter(a => a.tier > 0).map(a => (
              <option key={a.id} value={a.id}>{TIERS[a.tier]?.label}: {a.name}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label className="font-system text-[9px] tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            PRIORITY
          </label>
          <div className="flex gap-2">
            {Object.entries(PRIORITY).map(([key, p]) => (
              <motion.button
                key={key}
                className="font-system text-[9px] font-semibold tracking-wider px-3 py-1.5 rounded cursor-pointer"
                style={{
                  background: priority === key ? p.bg : 'transparent',
                  border: `1px solid ${priority === key ? `${p.color}50` : 'var(--border-subtle)'}`,
                  color: priority === key ? p.color : 'var(--text-muted)',
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPriority(key)}
              >
                {p.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Directive content */}
        <div className="mb-5">
          <label className="font-system text-[9px] tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            DIRECTIVE
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full font-system text-[11px] resize-none outline-none"
            rows={4}
            placeholder="Describe the directive in natural language..."
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
          />
        </div>

        {/* Deploy button */}
        <div className="flex justify-end gap-2">
          <GlowButton variant="secondary" size="md" onClick={onClose}>CANCEL</GlowButton>
          <GlowButton
            variant="primary"
            size="md"
            onClick={handleDeploy}
            disabled={!target || !content.trim() || deploying}
          >
            <span className="flex items-center gap-1.5">
              <Send size={11} /> {deploying ? 'DEPLOYING...' : 'DEPLOY DIRECTIVE'}
            </span>
          </GlowButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
