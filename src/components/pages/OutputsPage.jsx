import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, X, RotateCcw, Eye, Download, Mail } from 'lucide-react';
import { VENTURES } from '../../data/constants';
import useAgentStore from '../../store/agentStore';
import GlowButton from '../atoms/GlowButton';
import VentureBadge from '../atoms/VentureBadge';
import { logActivity, updateOutputStatus, isAirtableConfigured } from '../../lib/airtable';
import { exportToPDF, exportToDOCX, exportViaEmail } from '../../lib/exportOutput';

// Empty fallback — once Airtable is configured the Outputs table populates this
// via useAirtableSync. Without Airtable, the page renders an empty state.
const sampleOutputs = [];

const OUTPUT_STATUS = {
  pending_review:  { color: '#FFB800', label: 'PENDING REVIEW', icon: Eye },
  approved:        { color: '#00FF88', label: 'APPROVED', icon: Check },
  rejected:        { color: '#FF3344', label: 'REJECTED', icon: X },
  revision_needed: { color: '#00D4FF', label: 'REVISION', icon: RotateCcw },
  revision:        { color: '#00D4FF', label: 'REVISION', icon: RotateCcw }, // backward compat
};

const TYPE_COLORS = {
  report:    '#00FF88',
  document:  '#00D4FF',
  checklist: '#FFB800',
  data:      '#8B5CF6',
};

export default function OutputsPage() {
  const [filter, setFilter] = useState('all');
  const [reviewingId, setReviewingId] = useState(null);
  const storeOutputs = useAgentStore(s => s.outputs);
  const agents = useAgentStore(s => s.agents);
  const updateOutputInStore = useAgentStore(s => s.updateOutputInStore);

  // Use Airtable data if available, otherwise sample data
  const airtableOutputs = storeOutputs.length > 0
    ? storeOutputs.map(o => {
        const agent = agents.find(a => a.id === o.agentId);
        return {
          ...o,
          agent: agent?.name || o.agentId,
          created: o.createdAt,
          preview: o.content,
        };
      })
    : null;
  const [localOutputs, setLocalOutputs] = useState(sampleOutputs);
  const outputs = airtableOutputs || localOutputs;
  const setOutputs = airtableOutputs ? (fn) => {
    // For Airtable data, update the store directly
    const updated = typeof fn === 'function' ? fn(outputs) : fn;
    updated.forEach(o => {
      const original = outputs.find(orig => orig.id === o.id);
      if (original && original.status !== o.status) {
        updateOutputInStore(o.id, { status: o.status });
      }
    });
  } : setLocalOutputs;

  const handleOutputAction = (id, newStatus, logEventType, logLabel) => {
    const output = outputs.find(o => o.id === id);
    setOutputs(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setReviewingId(null);
    if (isAirtableConfigured() && output) {
      // Update the output record status in Airtable
      if (output._recordId) {
        updateOutputStatus(output._recordId, newStatus)
          .catch(err => console.error(`[OutputsPage] Failed to update output status:`, err));
      }
      // Log the activity
      logActivity({
        event: `${logLabel}: ${output.title}`,
        agentId: output.agentId || output.agent || '',
        eventType: logEventType,
        venture: output.venture || '',
        details: `${logLabel} "${output.title}" by ${output.agent}`,
      }).catch(err => console.error(`[OutputsPage] Failed to log ${logLabel}:`, err));
    }
  };

  const handleApprove = (id) => handleOutputAction(id, 'approved', 'output_reviewed', 'Output approved');
  const handleReject = (id) => handleOutputAction(id, 'rejected', 'output_reviewed', 'Output rejected');
  const handleRevision = (id) => handleOutputAction(id, 'revision_needed', 'output_reviewed', 'Revision requested');

  const filtered = filter === 'all'
    ? outputs
    : outputs.filter(o => o.status === filter);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileText size={20} style={{ color: 'var(--accent-secondary)' }} />
        <h1 className="font-display text-[18px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
          OUTPUTS
        </h1>
        <span className="font-system text-[10px] tracking-wider ml-2" style={{ color: 'var(--accent-warning)' }}>
          {outputs.filter(o => o.status === 'pending_review').length} PENDING REVIEW
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {[
          { key: 'all', label: 'ALL', color: '#9CA3AF' },
          { key: 'pending_review', label: 'PENDING', color: '#FFB800' },
          { key: 'approved', label: 'APPROVED', color: '#00FF88' },
          { key: 'revision_needed', label: 'REVISION', color: '#00D4FF' },
          { key: 'rejected', label: 'REJECTED', color: '#FF3344' },
        ].map(f => (
          <motion.button
            key={f.key}
            className="font-system text-[9px] font-semibold tracking-wider px-3 py-1.5 rounded-full cursor-pointer"
            style={{
              background: filter === f.key ? `${f.color}15` : 'transparent',
              border: `1px solid ${filter === f.key ? `${f.color}50` : 'var(--border-subtle)'}`,
              color: filter === f.key ? f.color : 'var(--text-muted)',
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Output list */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((o, i) => {
            const st = OUTPUT_STATUS[o.status] || OUTPUT_STATUS.pending_review;
            const StIcon = st.icon;
            const typeColor = TYPE_COLORS[o.type] || '#9CA3AF';
            const isReviewing = reviewingId === o.id;

            return (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg overflow-hidden"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Type indicator */}
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${typeColor}12`, border: `1px solid ${typeColor}25` }}
                    >
                      <FileText size={14} style={{ color: typeColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-system text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
                          style={{ color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}20` }}>
                          {o.type}
                        </span>
                        <span className="font-system text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                          style={{ color: st.color, background: `${st.color}12`, border: `1px solid ${st.color}20` }}>
                          <StIcon size={8} className="inline mr-0.5" style={{ verticalAlign: 'middle' }} />
                          {st.label}
                        </span>
                        <VentureBadge ventureId={o.venture} />
                        <span className="ml-auto font-system text-[8px]" style={{ color: 'var(--text-disabled)' }}>
                          {new Date(o.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="font-display text-[12px] font-bold tracking-wide mb-1" style={{ color: 'var(--text-primary)' }}>
                        {o.title}
                      </h3>
                      <p className="font-system text-[9px] mb-1" style={{ color: 'var(--text-muted)' }}>
                        by {o.agent}
                      </p>
                      <p className="font-body text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                        {o.preview}
                      </p>
                    </div>
                  </div>

                  {/* Export buttons — available on all outputs */}
                  <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="font-system text-[8px] tracking-wider mr-1" style={{ color: 'var(--text-disabled)' }}>EXPORT:</span>
                    <motion.button
                      className="font-system text-[8px] font-bold tracking-wider px-2 py-1 rounded cursor-pointer flex items-center gap-1"
                      style={{ background: 'rgba(255,51,68,0.08)', border: '1px solid rgba(255,51,68,0.2)', color: '#FF6B6B' }}
                      whileHover={{ background: 'rgba(255,51,68,0.15)', borderColor: 'rgba(255,51,68,0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportToPDF(o)}
                      title="Download as PDF"
                    >
                      <Download size={9} /> PDF
                    </motion.button>
                    <motion.button
                      className="font-system text-[8px] font-bold tracking-wider px-2 py-1 rounded cursor-pointer flex items-center gap-1"
                      style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
                      whileHover={{ background: 'rgba(0,212,255,0.15)', borderColor: 'rgba(0,212,255,0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportToDOCX(o)}
                      title="Download as DOCX"
                    >
                      <Download size={9} /> DOCX
                    </motion.button>
                    <motion.button
                      className="font-system text-[8px] font-bold tracking-wider px-2 py-1 rounded cursor-pointer flex items-center gap-1"
                      style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', color: '#FFB800' }}
                      whileHover={{ background: 'rgba(255,184,0,0.15)', borderColor: 'rgba(255,184,0,0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportViaEmail(o)}
                      title="Send via email"
                    >
                      <Mail size={9} /> EMAIL
                    </motion.button>
                  </div>

                  {/* Action bar */}
                  {(o.status === 'pending_review' || o.status === 'revision_needed') && (
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <GlowButton variant="primary" size="sm" onClick={() => setReviewingId(isReviewing ? null : o.id)}>
                        <span className="flex items-center gap-1"><Eye size={10} /> REVIEW</span>
                      </GlowButton>
                      <GlowButton variant="primary" size="sm" onClick={() => handleApprove(o.id)}>
                        <span className="flex items-center gap-1"><Check size={10} /> APPROVE</span>
                      </GlowButton>
                      <GlowButton variant="danger" size="sm" onClick={() => handleReject(o.id)}>
                        <span className="flex items-center gap-1"><X size={10} /> REJECT</span>
                      </GlowButton>
                    </div>
                  )}
                </div>

                {/* Expanded review panel */}
                <AnimatePresence>
                  {isReviewing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <p className="font-body text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                          {o.preview}
                        </p>
                        <textarea
                          className="w-full font-system text-[11px] resize-none outline-none mb-3"
                          rows={2}
                          placeholder="Add review notes..."
                          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                        />
                        <div className="flex gap-2">
                          <GlowButton variant="primary" size="sm" onClick={() => handleApprove(o.id)}>
                            <span className="flex items-center gap-1"><Check size={10} /> APPROVE WITH NOTES</span>
                          </GlowButton>
                          <GlowButton variant="secondary" size="sm" onClick={() => handleRevision(o.id)}>
                            <span className="flex items-center gap-1"><RotateCcw size={10} /> REQUEST REVISION</span>
                          </GlowButton>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
