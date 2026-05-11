import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pause, Play, Terminal, Pencil, MessageSquare } from 'lucide-react';
import StatusDot from '../atoms/StatusDot';
import TierLabel from '../atoms/TierLabel';
import VentureBadge from '../atoms/VentureBadge';
import ProgressBar from '../atoms/ProgressBar';
import ToolBadge from '../atoms/ToolBadge';
import GlowButton from '../atoms/GlowButton';
import AgentFormModal from './AgentFormModal';
import AgentChatTerminal from './AgentChatTerminal';
import { detailPanel, sectionVariants } from '../../motion/variants';
import { TIERS, STATUSES } from '../../data/constants';
import useAgentStore, { useSelectedAgent, useChildAgents } from '../../store/agentStore';
import { createDirective, updateAgentFields as airtableUpdateAgent, deleteAgent as airtableDeleteAgent, logActivity, isAirtableConfigured } from '../../lib/airtable';

function AgentDetailInner({ agent }) {
  const clearSelection = useAgentStore(s => s.clearSelection);
  const selectAgent = useAgentStore(s => s.selectAgent);
  const updateAgentStatus = useAgentStore(s => s.updateAgentStatus);
  const updateAgentFields = useAgentStore(s => s.updateAgentFields);
  const removeAgent = useAgentStore(s => s.removeAgent);
  const agents = useAgentStore(s => s.agents);
  const children = useChildAgents(agent.id);
  const [directiveText, setDirectiveText] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleEditSave = (agentData) => {
    const { id, _recordId, task, ...updates } = agentData;
    updateAgentFields(agent.id, updates);
    // Sync to Airtable in background
    if (isAirtableConfigured() && agent._recordId) {
      airtableUpdateAgent(agent._recordId, updates).catch(err =>
        console.error('[AgentDetail] Failed to sync edit to Airtable:', err)
      );
    }
    if (isAirtableConfigured()) {
      logActivity({
        event: `Agent ${agent.name} updated`,
        agentId: agent.id,
        eventType: 'status_change',
        venture: agentData.venture || '',
        details: `Fields updated: ${Object.keys(updates).join(', ')}`,
      }).catch(() => {});
    }
    setShowEditModal(false);
  };

  const handleEditDelete = (agentId) => {
    if (isAirtableConfigured() && agent._recordId) {
      airtableDeleteAgent(agent._recordId).catch(err =>
        console.error('[AgentDetail] Failed to delete from Airtable:', err)
      );
      logActivity({
        event: `Agent ${agent.name} deleted`,
        agentId: agent.id,
        eventType: 'system',
        venture: agent.venture || '',
        details: 'Agent removed from roster',
      }).catch(() => {});
    }
    removeAgent(agentId);
    setShowEditModal(false);
  };

  const handleDeploy = () => {
    if (!directiveText.trim()) return;
    setDeploying(true);

    // Fire-and-forget Airtable sync
    if (isAirtableConfigured()) {
      createDirective({
        title: `Directive for ${agent.name}`,
        description: directiveText.trim(),
        status: 'active',
        priority: 'normal',
        issuedBy: 'cmd',
        targetAgents: [agent.name],
        venture: agent.venture || '',
      }).catch(err => console.error('[AgentDetail] Failed to create directive in Airtable:', err));
    }

    // Clear UI after brief delay
    setTimeout(() => {
      setDirectiveText('');
      setDeploying(false);
    }, 500);
  };

  const handlePause = () => {
    updateAgentStatus(agent.id, agent.status === 'idle' ? 'active' : 'idle');
  };

  return (
    <motion.div
      key={agent.id}
      variants={detailPanel}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed top-0 right-0 h-full overflow-y-auto z-50"
      style={{
        width: '480px',
        maxWidth: '100vw',
        background: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-default)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
      }}
    >
      <motion.div
        className="fixed inset-0 -z-10 lg:hidden"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={clearSelection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <div className="p-6">
        {/* Back */}
        <motion.button
          variants={sectionVariants}
          className="flex items-center gap-2 mb-6 cursor-pointer"
          style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none' }}
          onClick={clearSelection}
          whileHover={{ color: 'var(--text-primary)' }}
        >
          <ArrowLeft size={16} />
          <span className="font-system text-[11px] tracking-wider">BACK</span>
        </motion.button>

        {/* Header */}
        <motion.div variants={sectionVariants} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <StatusDot status={agent.status} size={8} />
            <TierLabel tier={agent.tier} />
            <VentureBadge ventureId={agent.venture} />
            <span
              className="font-system text-[10px] font-semibold px-2 py-0.5 rounded ml-auto"
              style={{
                color: STATUSES[agent.status]?.color,
                background: STATUSES[agent.status]?.bg,
                border: `1px solid ${STATUSES[agent.status]?.color}30`,
              }}
            >
              {STATUSES[agent.status]?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[20px] font-bold tracking-wide" style={{ color: TIERS[agent.tier]?.color }}>
              {agent.name}
            </h2>
            <motion.button
              className="cursor-pointer p-1.5 rounded"
              style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}
              whileHover={{ background: 'rgba(255,184,0,0.2)', borderColor: 'rgba(255,184,0,0.5)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEditModal(true)}
              title="Edit agent"
            >
              <Pencil size={12} />
            </motion.button>
          </div>
        </motion.div>

        {/* Mandate */}
        <motion.div variants={sectionVariants} className="mb-6">
          <SectionHeader>OPERATIONAL MANDATE</SectionHeader>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <p className="font-body text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {agent.mandate}
            </p>
          </div>
        </motion.div>

        {/* Logic Sequence */}
        <motion.div variants={sectionVariants} className="mb-6">
          <SectionHeader>LOGIC SEQUENCE</SectionHeader>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Terminal size={12} style={{ color: 'var(--accent-primary)' }} />
              <span className="font-system text-[9px] tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                TRIGGER: {agent.trigger}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {agent.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="font-system text-[9px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-surface)', color: 'var(--accent-primary)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-body text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Current Task */}
        {agent.task && (
          <motion.div variants={sectionVariants} className="mb-6">
            <SectionHeader>CURRENT TASK</SectionHeader>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(0,255,136,0.15)' }}>
              <p className="font-system text-[11px] mb-2" style={{ color: 'var(--text-primary)' }}>
                {agent.task.description}
              </p>
              <ProgressBar value={agent.task.progress} />
            </div>
          </motion.div>
        )}

        {/* Deliverables */}
        <motion.div variants={sectionVariants} className="mb-6">
          <SectionHeader>DELIVERABLES</SectionHeader>
          <div className="flex flex-wrap gap-1.5">
            {agent.deliverables.map(d => (
              <span key={d} className="font-system text-[9px] px-2 py-1 rounded"
                style={{ color: 'var(--accent-secondary)', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                {d}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Tools */}
        <motion.div variants={sectionVariants} className="mb-6">
          <SectionHeader>TOOL INTEGRATIONS</SectionHeader>
          <div className="flex flex-wrap gap-1.5">
            {agent.tools.map(tool => (
              <ToolBadge key={tool} tool={tool} />
            ))}
          </div>
        </motion.div>

        {/* Subordinates */}
        {children.length > 0 && (
          <motion.div variants={sectionVariants} className="mb-6">
            <SectionHeader>SUBORDINATE UNITS ({children.length})</SectionHeader>
            <div className="flex flex-col gap-1.5">
              {children.map(child => (
                <motion.div
                  key={child.id}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                  whileHover={{ borderColor: 'var(--border-strong)', background: 'var(--bg-hover)' }}
                  onClick={() => selectAgent(child.id)}
                >
                  <StatusDot status={child.status} size={5} />
                  <span className="font-display text-[10px] font-bold tracking-wide" style={{ color: TIERS[child.tier]?.color }}>
                    {child.name}
                  </span>
                  <span className="ml-auto font-system text-[8px]" style={{ color: STATUSES[child.status]?.color }}>
                    {STATUSES[child.status]?.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Directive */}
        <motion.div variants={sectionVariants} className="mb-6">
          <SectionHeader>DIRECTIVE</SectionHeader>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <textarea
              className="w-full font-system text-[11px] resize-none outline-none mb-3"
              rows={3}
              placeholder="Issue directive to this agent..."
              value={directiveText}
              onChange={e => setDirectiveText(e.target.value)}
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
            />
            <div className="flex gap-2">
              <GlowButton variant="primary" size="sm" onClick={handleDeploy} disabled={!directiveText.trim() || deploying}>
                {deploying ? 'DEPLOYING...' : 'DEPLOY'}
              </GlowButton>
              <GlowButton variant="amber" size="sm" onClick={handlePause}>
                <span className="flex items-center gap-1">
                  {agent.status === 'idle' ? <Play size={10} /> : <Pause size={10} />}
                  {agent.status === 'idle' ? 'ACTIVATE' : 'PAUSE'}
                </span>
              </GlowButton>
            </div>
          </div>
        </motion.div>

        {/* Chat Terminal */}
        <motion.div variants={sectionVariants} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <SectionHeader>TERMINAL</SectionHeader>
            <motion.button
              className="font-system text-[8px] font-bold tracking-wider px-2 py-1 rounded cursor-pointer flex items-center gap-1"
              style={{
                background: showChat ? 'rgba(0,255,136,0.1)' : 'transparent',
                border: `1px solid ${showChat ? 'rgba(0,255,136,0.3)' : 'var(--border-subtle)'}`,
                color: showChat ? '#00FF88' : 'var(--text-muted)',
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare size={8} /> {showChat ? 'CLOSE' : 'OPEN'} CHAT
            </motion.button>
          </div>
          <AgentChatTerminal agent={agent} isOpen={showChat} onClose={() => setShowChat(false)} />
        </motion.div>
      </div>

      {showEditModal && (
        <AgentFormModal
          mode="edit"
          agent={agent}
          agents={agents}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </motion.div>
  );
}

export default function AgentDetail() {
  const agent = useSelectedAgent();

  return (
    <AnimatePresence mode="wait">
      {agent && <AgentDetailInner agent={agent} />}
    </AnimatePresence>
  );
}

function SectionHeader({ children }) {
  return (
    <h4 className="font-system text-[9px] font-semibold tracking-[0.15em] mb-2" style={{ color: 'var(--text-muted)' }}>
      {children}
    </h4>
  );
}
