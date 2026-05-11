// === HIVE COMMAND — Ventures Page ===
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, CheckCircle, TrendingUp, Pencil, Plus } from 'lucide-react';
import { VENTURES, STATUSES, TIERS } from '../../data/constants';
import useAgentStore from '../../store/agentStore';
import StatusDot from '../atoms/StatusDot';
import TierLabel from '../atoms/TierLabel';
import ProgressBar from '../atoms/ProgressBar';
import ToolBadge from '../atoms/ToolBadge';
import GlowButton from '../atoms/GlowButton';
import EditVentureModal from '../organisms/EditVentureModal';

const STORAGE_KEY = 'hive-ventures';

// Empty defaults — the operator fills in KPIs per venture via the EditVentureModal,
// and the saved values persist to localStorage under STORAGE_KEY.
const DEFAULT_KPIS = Object.fromEntries(
  Object.keys(VENTURES).filter(k => k !== 'cross').map(k => [k, {}])
);

function loadSavedVentures() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[VenturesPage] Failed to load saved ventures:', e);
  }
  return null;
}

function saveVentures(ventures, kpis) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ventures, kpis }));
  } catch (e) {
    console.warn('[VenturesPage] Failed to save ventures:', e);
  }
}

export default function VenturesPage() {
  const [selectedVenture, setSelectedVenture] = useState(null);
  const [editingVenture, setEditingVenture] = useState(null);
  const [isNewVenture, setIsNewVenture] = useState(false);
  const agents = useAgentStore(s => s.agents);
  const selectAgent = useAgentStore(s => s.selectAgent);

  // Merge defaults with localStorage overrides
  const [ventures, setVentures] = useState(() => {
    const saved = loadSavedVentures();
    if (saved?.ventures) {
      // Merge: saved overrides defaults, plus any new saved ventures
      return { ...VENTURES, ...saved.ventures };
    }
    return { ...VENTURES };
  });

  const [ventureKPIs, setVentureKPIs] = useState(() => {
    const saved = loadSavedVentures();
    if (saved?.kpis) {
      return { ...DEFAULT_KPIS, ...saved.kpis };
    }
    return { ...DEFAULT_KPIS };
  });

  // Persist on change
  useEffect(() => {
    saveVentures(ventures, ventureKPIs);
  }, [ventures, ventureKPIs]);

  const ventureStats = useMemo(() => {
    const stats = {};
    Object.keys(ventures).forEach(vId => {
      const vAgents = agents.filter(a => a.venture === vId);
      stats[vId] = {
        total: vAgents.length,
        active: vAgents.filter(a => a.status === 'active').length,
        tasks: vAgents.filter(a => a.task).length,
      };
    });
    return stats;
  }, [agents, ventures]);

  const selectedAgents = useMemo(() => {
    if (!selectedVenture) return [];
    return agents.filter(a => a.venture === selectedVenture);
  }, [agents, selectedVenture]);

  const handleEditClick = useCallback((e, key) => {
    e.stopPropagation();
    setEditingVenture(key);
    setIsNewVenture(false);
  }, []);

  const handleAddVenture = useCallback(() => {
    setEditingVenture('__new__');
    setIsNewVenture(true);
  }, []);

  const handleSave = useCallback((ventureId, updates) => {
    setVentures(prev => ({
      ...prev,
      [ventureId]: {
        name: updates.name,
        short: updates.short,
        color: updates.color,
      },
    }));
    if (updates.kpis && Object.keys(updates.kpis).length > 0) {
      setVentureKPIs(prev => ({
        ...prev,
        [ventureId]: updates.kpis,
      }));
    }
    setEditingVenture(null);
    setIsNewVenture(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingVenture(null);
    setIsNewVenture(false);
  }, []);

  // Separate cross-venture from others
  const mainVentures = Object.entries(ventures).filter(([k]) => k !== 'cross');
  const crossVenture = ventures.cross;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Building2 size={20} style={{ color: 'var(--accent-secondary)' }} />
        <h1 className="font-display text-[18px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
          VENTURES
        </h1>
      </div>

      {/* Venture cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {mainVentures.map(([key, v], i) => {
          const stats = ventureStats[key] || { total: 0, active: 0, tasks: 0 };
          const kpis = ventureKPIs[key] || {};
          const isSelected = selectedVenture === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
              onClick={() => setSelectedVenture(isSelected ? null : key)}
              className="rounded-lg cursor-pointer p-4 relative overflow-hidden"
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, var(--bg-elevated) 0%, ${v.color}15 100%)`
                  : 'var(--bg-elevated)',
                border: `1px solid ${isSelected ? `${v.color}60` : 'var(--border-subtle)'}`,
              }}
              whileHover={{
                borderColor: `${v.color}50`,
                boxShadow: `0 0 20px ${v.color}15`,
              }}
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${v.color}, transparent)` }}
              />

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: `${v.color}15`, border: `1px solid ${v.color}25` }}
                  >
                    <span className="font-system text-[10px] font-bold" style={{ color: v.color }}>
                      {v.short}
                    </span>
                  </div>
                  <h3 className="font-display text-[13px] font-bold tracking-wide" style={{ color: v.color }}>
                    {v.name.toUpperCase()}
                  </h3>
                </div>
                <motion.button
                  className="p-1.5 rounded cursor-pointer"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'rgba(255,184,0,0.08)',
                    border: '1px solid rgba(255,184,0,0.15)',
                  }}
                  whileHover={{
                    color: 'var(--accent-warning)',
                    boxShadow: '0 0 10px rgba(255,184,0,0.15)',
                    borderColor: 'rgba(255,184,0,0.4)',
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleEditClick(e, key)}
                >
                  <Pencil size={12} />
                </motion.button>
              </div>

              {/* Agent stats */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <Users size={10} style={{ color: 'var(--text-muted)' }} />
                  <span className="font-system text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {stats.total} agents
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={10} style={{ color: 'var(--status-active)' }} />
                  <span className="font-system text-[10px]" style={{ color: 'var(--status-active)' }}>
                    {stats.active} active
                  </span>
                </div>
                {stats.tasks > 0 && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={10} style={{ color: 'var(--accent-secondary)' }} />
                    <span className="font-system text-[10px]" style={{ color: 'var(--accent-secondary)' }}>
                      {stats.tasks} tasks
                    </span>
                  </div>
                )}
              </div>

              {/* KPI snapshot */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(kpis).slice(0, 4).map(([label, value]) => (
                  <div key={label} className="p-2 rounded" style={{ background: 'var(--bg-surface)' }}>
                    <div className="font-system text-[8px] tracking-wider uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </div>
                    <div className="font-system text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Add Venture card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          onClick={handleAddVenture}
          className="rounded-lg cursor-pointer p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[180px]"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px dashed var(--border-subtle)',
          }}
          whileHover={{
            borderColor: 'rgba(255,184,0,0.5)',
            boxShadow: '0 0 20px rgba(255,184,0,0.1)',
          }}
        >
          <motion.div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}
            whileHover={{ scale: 1.05 }}
          >
            <Plus size={20} style={{ color: 'var(--accent-warning)' }} />
          </motion.div>
          <span className="font-display text-[11px] font-bold tracking-wider" style={{ color: 'var(--accent-warning)' }}>
            ADD VENTURE
          </span>
          <span className="font-system text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Create a new venture
          </span>
        </motion.div>
      </div>

      {/* Cross-venture card */}
      {crossVenture && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          onClick={() => setSelectedVenture(selectedVenture === 'cross' ? null : 'cross')}
          className="rounded-lg cursor-pointer p-4 mb-6"
          style={{
            background: selectedVenture === 'cross'
              ? `linear-gradient(135deg, var(--bg-elevated) 0%, ${crossVenture.color}15 100%)`
              : 'var(--bg-elevated)',
            border: `1px solid ${selectedVenture === 'cross' ? `${crossVenture.color}60` : 'var(--border-subtle)'}`,
          }}
          whileHover={{ borderColor: `${crossVenture.color}50` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ background: `${crossVenture.color}15`, border: `1px solid ${crossVenture.color}25` }}>
                <span className="font-system text-[10px] font-bold" style={{ color: crossVenture.color }}>X</span>
              </div>
              <div>
                <h3 className="font-display text-[13px] font-bold tracking-wide" style={{ color: crossVenture.color }}>
                  CROSS-VENTURE
                </h3>
                <span className="font-system text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  {ventureStats.cross?.total || 0} agents spanning all ventures
                </span>
              </div>
            </div>
            <motion.button
              className="p-1.5 rounded cursor-pointer"
              style={{
                color: 'var(--text-muted)',
                background: 'rgba(255,184,0,0.08)',
                border: '1px solid rgba(255,184,0,0.15)',
              }}
              whileHover={{
                color: 'var(--accent-warning)',
                boxShadow: '0 0 10px rgba(255,184,0,0.15)',
                borderColor: 'rgba(255,184,0,0.4)',
              }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleEditClick(e, 'cross')}
            >
              <Pencil size={12} />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Selected venture detail */}
      <AnimatePresence mode="wait">
        {selectedVenture && (
          <motion.div
            key={selectedVenture}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 rounded-full" style={{ background: ventures[selectedVenture]?.color }} />
              <h2 className="font-display text-[14px] font-bold tracking-wider" style={{ color: ventures[selectedVenture]?.color }}>
                {ventures[selectedVenture]?.name.toUpperCase()} — AGENT ROSTER
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedAgents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => selectAgent(agent.id)}
                  className="p-3 rounded-lg cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <StatusDot status={agent.status} size={6} />
                    <TierLabel tier={agent.tier} />
                    <span className="ml-auto font-system text-[8px]" style={{ color: STATUSES[agent.status]?.color }}>
                      {STATUSES[agent.status]?.label}
                    </span>
                  </div>
                  <h4 className="font-display text-[11px] font-bold tracking-wide mb-1" style={{ color: TIERS[agent.tier]?.color }}>
                    {agent.name}
                  </h4>
                  <p className="font-body text-[10px] mb-2 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                    {agent.mandate}
                  </p>
                  {agent.task && (
                    <div className="mb-2">
                      <p className="font-system text-[8px] mb-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                        {agent.task.description}
                      </p>
                      <ProgressBar value={agent.task.progress} showLabel={false} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {agent.tools.slice(0, 3).map(t => <ToolBadge key={t} tool={t} />)}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Venture Modal */}
      <AnimatePresence>
        {editingVenture && (
          <EditVentureModal
            venture={isNewVenture ? null : { id: editingVenture, ...ventures[editingVenture] }}
            kpis={isNewVenture ? {} : (ventureKPIs[editingVenture] || {})}
            onSave={handleSave}
            onClose={handleCloseModal}
            isNew={isNewVenture}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
