import { useState } from 'react';
import { LayoutGrid, Move3D, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBar from '../molecules/StatusBar';
import FilterBar from '../molecules/FilterBar';
import AgentGrid from '../organisms/AgentGrid';
import AgentCanvas from '../organisms/AgentCanvas';
import AgentDetail from '../organisms/AgentDetail';
import TaskFeed from '../organisms/TaskFeed';
import GlowButton from '../atoms/GlowButton';
import { TEAM_TEMPLATES } from '../../data/teamTemplates';
import useAgentStore from '../../store/agentStore';

const TEMPLATE_KEY = 'hive-active-template';

function TemplateModal({ onClose }) {
  const setAgents = useAgentStore(s => s.setAgents);
  const setDataSource = useAgentStore(s => s.setDataSource);

  const handleLoad = (template) => {
    if (!confirm(`Replace your current swarm with the "${template.label}" template? This clears all existing agents in this browser session.`)) return;
    setAgents(template.agents.map(a => ({ ...a }))); // shallow-clone
    setDataSource('template'); // signal to useAirtableSync to stop overwriting
    try { localStorage.setItem(TEMPLATE_KEY, template.id); } catch {}
    onClose();
  };

  const handleClear = () => {
    if (!confirm('Clear the active template and resume live data (Airtable or local seed)?')) return;
    try { localStorage.removeItem(TEMPLATE_KEY); } catch {}
    setDataSource('local');
    // Re-import the seed so the user sees something
    import('../../data/agents').then(({ agents }) => setAgents(agents));
    onClose();
  };

  const activeId = (() => { try { return localStorage.getItem(TEMPLATE_KEY); } catch { return null; } })();

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full rounded-xl overflow-hidden"
        style={{ maxWidth: '760px', maxHeight: '85vh', background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#FFB800' }} />
            <h2 className="font-display text-[14px] font-bold tracking-wider" style={{ color: '#FFB800' }}>LOAD TEAM TEMPLATE</h2>
            {activeId && (
              <span className="font-system text-[9px] tracking-wider px-2 py-0.5 rounded ml-2" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}>
                ACTIVE: {TEAM_TEMPLATES.find(t => t.id === activeId)?.label?.toUpperCase() || activeId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeId && (
              <button onClick={handleClear} className="font-system text-[9px] tracking-wider px-2 py-1 rounded cursor-pointer" style={{ background: 'rgba(255,51,68,0.08)', color: '#FF3344', border: '1px solid rgba(255,51,68,0.25)' }}>
                CLEAR TEMPLATE
              </button>
            )}
            <button onClick={onClose} className="cursor-pointer p-1" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(85vh - 70px)' }}>
          <p className="font-system text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
            Pick a pre-wired swarm for your vertical. Loading replaces the agent list in your browser only — it does not modify Airtable.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEAM_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleLoad(t)}
                className="text-left p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${activeId === t.id ? '#00FF88' : 'var(--border-subtle)'}`,
                  boxShadow: activeId === t.id ? '0 0 0 1px rgba(0,255,136,0.15)' : 'none',
                }}
              >
                <div className="font-display text-[13px] font-bold tracking-wider mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t.label.toUpperCase()}
                </div>
                <p className="font-body text-[11px] leading-snug mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t.description}
                </p>
                <div className="flex items-center gap-3 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{t.agents.length} agents</span>
                  <span>·</span>
                  <span>{t.agents.filter(a => a.tier === 1).length} directors</span>
                  <span>·</span>
                  <span>{t.agents.filter(a => a.tier === 2).length} managers</span>
                  <span>·</span>
                  <span>{t.agents.filter(a => a.tier === 3).length} workers</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SwarmPage() {
  const [view, setView] = useState('grid'); // 'grid' | 'canvas'
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className={view === 'canvas' ? '' : 'max-w-7xl mx-auto'}>
      {/* Status bar + view toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <StatusBar />
        </div>
        {/* Templates button */}
        <GlowButton variant="amber" size="sm" onClick={() => setShowTemplates(true)}>
          <span className="flex items-center gap-1">
            <Sparkles size={11} />
            TEMPLATES
          </span>
        </GlowButton>
        {/* View toggle */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(255, 150, 30, 0.25)', background: 'rgba(30, 25, 18, 0.6)' }}
        >
          <button
            onClick={() => setView('grid')}
            className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors"
            style={{
              background: view === 'grid' ? 'rgba(255, 150, 30, 0.2)' : 'transparent',
              border: 'none',
              borderRight: '1px solid rgba(255, 150, 30, 0.15)',
              color: view === 'grid' ? '#FFB800' : 'rgba(156,163,175,0.7)',
            }}
          >
            <LayoutGrid size={12} />
            <span className="font-system text-[8px] font-bold tracking-widest">GRID</span>
          </button>
          <button
            onClick={() => setView('canvas')}
            className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors"
            style={{
              background: view === 'canvas' ? 'rgba(255, 150, 30, 0.2)' : 'transparent',
              border: 'none',
              color: view === 'canvas' ? '#FFB800' : 'rgba(156,163,175,0.7)',
            }}
          >
            <Move3D size={12} />
            <span className="font-system text-[8px] font-bold tracking-widest">CANVAS</span>
          </button>
        </div>
      </div>

      {/* Filters — only show in grid mode */}
      {view === 'grid' && (
        <div className="mb-4">
          <FilterBar />
        </div>
      )}

      {/* Main content */}
      {view === 'grid' ? (
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <AgentGrid />
          </div>
          <div className="hidden lg:block w-72 flex-shrink-0">
            <TaskFeed />
          </div>
        </div>
      ) : (
        <AgentCanvas />
      )}

      {/* Agent detail slide-in panel */}
      <AgentDetail />

      {/* Template loader modal */}
      <AnimatePresence>
        {showTemplates && <TemplateModal onClose={() => setShowTemplates(false)} />}
      </AnimatePresence>
    </div>
  );
}
