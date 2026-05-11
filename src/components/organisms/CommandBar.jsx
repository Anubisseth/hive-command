// === HIVE COMMAND — Command Bar (⌘K Palette) ===

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Command,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  X,
  Grid3x3,
  Building2,
  Zap,
  FileText,
  BarChart3,
  Settings,
  Building,
  Bot,
  RefreshCw,
  PlusCircle,
  Eye,
} from 'lucide-react';
import useAgentStore from '../../store/agentStore';
import { NAV_ITEMS, TIERS, VENTURES } from '../../data/constants';
import StatusDot from '../atoms/StatusDot';
import VentureBadge from '../atoms/VentureBadge';
import TierLabel from '../atoms/TierLabel';

// Icon map for nav items
const ICON_MAP = { Grid3x3, Building2, Zap, FileText, BarChart3, Settings, Building };

// Action definitions
const ACTIONS = [
  { id: 'action-create-directive', label: 'Create Directive', description: 'Open new directive form', icon: PlusCircle, path: '/directives' },
  { id: 'action-refresh', label: 'Refresh Data', description: 'Re-sync from Airtable', icon: RefreshCw, action: 'refresh' },
  { id: 'action-3d-office', label: 'Toggle 3D Office', description: 'Open the 3D office visualization', icon: Building, path: '/office' },
  { id: 'action-analytics', label: 'View Analytics', description: 'Charts, KPIs & 90-day tracker', icon: BarChart3, path: '/analytics' },
];

// Backdrop animation
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Modal animation
const modalVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 28, stiffness: 350 } },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.15 } },
};

export default function CommandBar({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const agents = useAgentStore(s => s.agents);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after animation frame
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Build flat result list with sections
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const items = [];

    // --- Navigation section ---
    const navResults = NAV_ITEMS.filter(item =>
      !q || item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    );
    if (navResults.length > 0) {
      items.push({ type: 'section', label: 'Navigation' });
      navResults.forEach(item => {
        const Icon = ICON_MAP[item.icon] || Grid3x3;
        items.push({
          type: 'nav',
          id: `nav-${item.id}`,
          label: item.label,
          description: item.path,
          icon: Icon,
          path: item.path,
        });
      });
    }

    // --- Agents section ---
    const agentResults = agents.filter(agent => {
      if (!q) return true;
      const ventureName = agent.venture ? (VENTURES[agent.venture]?.name || '') : '';
      const tierName = TIERS[agent.tier]?.label || '';
      return (
        agent.name.toLowerCase().includes(q) ||
        ventureName.toLowerCase().includes(q) ||
        tierName.toLowerCase().includes(q) ||
        agent.status.toLowerCase().includes(q) ||
        agent.id.toLowerCase().includes(q)
      );
    });
    if (agentResults.length > 0) {
      items.push({ type: 'section', label: 'Agents' });
      agentResults.forEach(agent => {
        items.push({
          type: 'agent',
          id: `agent-${agent.id}`,
          agent,
        });
      });
    }

    // --- Actions section ---
    const actionResults = ACTIONS.filter(action =>
      !q || action.label.toLowerCase().includes(q) || action.description.toLowerCase().includes(q)
    );
    if (actionResults.length > 0) {
      items.push({ type: 'section', label: 'Actions' });
      actionResults.forEach(action => {
        items.push({ type: 'action', ...action });
      });
    }

    return items;
  }, [query, agents]);

  // Selectable items (exclude section headers)
  const selectableItems = useMemo(
    () => results.filter(r => r.type !== 'section'),
    [results]
  );

  // Clamp selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Execute the selected item
  const executeItem = useCallback((item) => {
    if (!item) return;

    if (item.type === 'nav') {
      navigate(item.path);
      onClose();
    } else if (item.type === 'agent') {
      // Navigate to swarm and select agent
      useAgentStore.getState().selectAgent(item.agent.id);
      navigate('/swarm');
      onClose();
    } else if (item.type === 'action') {
      if (item.action === 'refresh') {
        // Trigger Airtable re-sync by toggling loading
        useAgentStore.getState().setLoading(true);
        onClose();
      } else if (item.path) {
        navigate(item.path);
        onClose();
      }
    }
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, selectableItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeItem(selectableItems[selectedIndex]);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectableItems, selectedIndex, executeItem]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
          style={{ background: 'rgba(0, 0, 0, 0.60)', backdropFilter: 'blur(4px)' }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full"
            style={{
              maxWidth: 560,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
            }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search commands, agents, pages..."
                className="flex-1 bg-transparent border-none outline-none font-system text-[14px]"
                style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-primary)' }}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded cursor-pointer bg-transparent border-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
              <kbd
                className="font-system text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  color: 'var(--text-muted)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results list */}
            <div
              ref={listRef}
              className="overflow-y-auto"
              style={{ maxHeight: 360, scrollbarWidth: 'thin' }}
            >
              {selectableItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Search size={24} style={{ color: 'var(--text-disabled)' }} />
                  <span className="font-system text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    No results for "{query}"
                  </span>
                </div>
              ) : (
                results.map((item, idx) => {
                  if (item.type === 'section') {
                    return (
                      <div
                        key={`section-${item.label}`}
                        className="px-4 pt-3 pb-1"
                      >
                        <span
                          className="font-system text-[9px] font-semibold tracking-[0.15em] uppercase"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  }

                  // Find selectable index for this item
                  const selectableIdx = selectableItems.indexOf(item);
                  const isSelected = selectableIdx === selectedIndex;

                  if (item.type === 'agent') {
                    return (
                      <AgentResultItem
                        key={item.id}
                        agent={item.agent}
                        isSelected={isSelected}
                        dataIndex={selectableIdx}
                        onSelect={() => executeItem(item)}
                        onHover={() => setSelectedIndex(selectableIdx)}
                      />
                    );
                  }

                  // Nav or Action item
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      data-index={selectableIdx}
                      className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg cursor-pointer"
                      style={{
                        background: isSelected ? 'var(--bg-hover)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      }}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(selectableIdx)}
                    >
                      <Icon
                        size={16}
                        style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-tertiary)', flexShrink: 0 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-body text-[13px] font-medium truncate"
                          style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                        >
                          {item.label}
                        </div>
                        {item.description && (
                          <div
                            className="font-system text-[10px] truncate"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.path && (
                        <span
                          className="font-system text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{
                            color: 'var(--text-disabled)',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {item.path}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with keyboard hints */}
            <div
              className="flex items-center gap-4 px-4 py-2"
              style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
            >
              <div className="flex items-center gap-1.5">
                <kbd
                  className="font-system text-[9px] px-1 py-0.5 rounded inline-flex items-center justify-center"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    minWidth: 18,
                  }}
                >
                  <ArrowUp size={9} />
                </kbd>
                <kbd
                  className="font-system text-[9px] px-1 py-0.5 rounded inline-flex items-center justify-center"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    minWidth: 18,
                  }}
                >
                  <ArrowDown size={9} />
                </kbd>
                <span className="font-system text-[9px]" style={{ color: 'var(--text-disabled)' }}>navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd
                  className="font-system text-[9px] px-1 py-0.5 rounded inline-flex items-center justify-center"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    minWidth: 18,
                  }}
                >
                  <CornerDownLeft size={9} />
                </kbd>
                <span className="font-system text-[9px]" style={{ color: 'var(--text-disabled)' }}>select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd
                  className="font-system text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  esc
                </kbd>
                <span className="font-system text-[9px]" style={{ color: 'var(--text-disabled)' }}>close</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Command size={9} style={{ color: 'var(--text-disabled)' }} />
                <span className="font-system text-[9px]" style={{ color: 'var(--text-disabled)' }}>K</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Agent result row — separated for clarity
function AgentResultItem({ agent, isSelected, dataIndex, onSelect, onHover }) {
  return (
    <div
      data-index={dataIndex}
      className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg cursor-pointer"
      style={{
        background: isSelected ? 'var(--bg-hover)' : 'transparent',
        borderLeft: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
      }}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      <StatusDot status={agent.status} size={6} />
      <div className="flex-1 min-w-0">
        <div
          className="font-body text-[13px] font-medium truncate"
          style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {agent.name}
        </div>
        {agent.task && (
          <div
            className="font-system text-[9px] truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {agent.task.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <VentureBadge ventureId={agent.venture} />
        <TierLabel tier={agent.tier} />
      </div>
    </div>
  );
}
