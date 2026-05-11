import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import AgentCardCompact from '../molecules/AgentCardCompact';
import AgentFormModal from './AgentFormModal';
import useAgentStore, { useFilteredAgents } from '../../store/agentStore';
import { STATUSES } from '../../data/constants';
import { createAgent as airtableCreateAgent, logActivity, isAirtableConfigured } from '../../lib/airtable';

// Using CSS animate-in class instead of Framer Motion entrance animations
// to avoid stalling on React Router route transitions

export default function AgentGrid() {
  const filteredAgents = useFilteredAgents();
  const allAgents = useAgentStore(s => s.agents);
  const selectAgent = useAgentStore(s => s.selectAgent);
  const addAgent = useAgentStore(s => s.addAgent);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const commander = filteredAgents.find(a => a.tier === 0);
  const others = filteredAgents.filter(a => a.tier !== 0);

  const handleCreateSave = (agentData) => {
    // Optimistic local update
    addAgent(agentData);

    // Sync to Airtable
    if (isAirtableConfigured()) {
      airtableCreateAgent(agentData)
        .then(result => {
          // Update local agent with Airtable record ID
          if (result?._recordId) {
            useAgentStore.getState().updateAgentFields(agentData.id, { _recordId: result._recordId });
          }
        })
        .catch(err => console.error('[AgentGrid] Failed to create agent in Airtable:', err));

      logActivity({
        event: `New agent created: ${agentData.name}`,
        agentId: agentData.id,
        eventType: 'system',
        venture: agentData.venture || '',
        details: `Tier: ${agentData.tier}, Status: ${agentData.status}`,
      }).catch(() => {});
    }

    setShowCreateModal(false);
  };

  return (
    <div>
      {commander && (
        <div className="mb-4 animate-in">
          <CommanderCardInline agent={commander} onClick={selectAgent} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {others.map((agent) => (
          <div key={agent.id} className="animate-in">
            <AgentCardCompact agent={agent} onClick={selectAgent} />
          </div>
        ))}

        {/* New Agent Card */}
        <div className="animate-in">
          <motion.div
            className="rounded-lg cursor-pointer p-4 flex flex-col items-center justify-center gap-2"
            style={{
              minHeight: '120px',
              background: 'rgba(30, 25, 18, 0.4)',
              border: '2px dashed rgba(255, 184, 0, 0.25)',
            }}
            whileHover={{
              borderColor: 'rgba(255, 184, 0, 0.5)',
              background: 'rgba(40, 34, 22, 0.6)',
              boxShadow: '0 0 20px rgba(255, 184, 0, 0.08)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255, 184, 0, 0.1)', border: '1px solid rgba(255, 184, 0, 0.2)' }}
            >
              <Plus size={20} style={{ color: '#FFB800' }} />
            </div>
            <span className="font-system text-[10px] font-semibold tracking-wider" style={{ color: '#FFB800' }}>
              NEW AGENT
            </span>
          </motion.div>
        </div>
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <p className="font-system text-[12px]" style={{ color: 'var(--text-muted)' }}>
            No agents match current filters
          </p>
        </div>
      )}

      {showCreateModal && (
        <AgentFormModal
          mode="create"
          agent={null}
          agents={allAgents}
          onSave={handleCreateSave}
          onDelete={() => {}}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

function CommanderCardInline({ agent, onClick }) {
  return (
    <motion.div
      whileHover={{ boxShadow: '0 0 30px rgba(255,184,0,0.15)', borderColor: 'rgba(255,184,0,0.5)' }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick?.(agent.id)}
      className="rounded-lg cursor-pointer p-5 flex items-center gap-4"
      style={{
        background: 'linear-gradient(160deg, rgba(50, 40, 20, 0.9) 0%, rgba(35, 28, 12, 0.88) 100%)',
        backdropFilter: 'blur(6px)',
        border: '1.5px solid rgba(255,184,0,0.4)',
        boxShadow: '0 0 3px rgba(255,184,0,0.25), inset 0 1px 0 rgba(255,184,0,0.1), 0 8px 32px rgba(0,0,0,0.7)',
      }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)' }}
      >
        <span className="text-2xl">&#x1F451;</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-system text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded"
            style={{ color: '#FFB800', background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)' }}>
            COMMANDER
          </span>
          <span className="font-system text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded"
            style={{
              color: STATUSES[agent.status]?.color || '#00FF88',
              background: `${STATUSES[agent.status]?.color || '#00FF88'}18`,
              border: `1px solid ${STATUSES[agent.status]?.color || '#00FF88'}40`,
            }}>
            {STATUSES[agent.status]?.label || 'ACTIVE'}
          </span>
        </div>
        <h2 className="font-display text-[18px] font-bold tracking-wide" style={{ color: '#FFB800' }}>
          {agent.name}
        </h2>
        <p className="font-body text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {agent.mandate}
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="font-system text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {agent.tools.length} TOOLS
        </div>
        <div className="font-system text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {agent.steps.length} STEPS
        </div>
      </div>
    </motion.div>
  );
}
