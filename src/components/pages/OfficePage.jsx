// === HIVE COMMAND — Office Page ===
// 3D Retro Office visualization of the agent swarm
// Agent management controls: status, edit, task assignment, create

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, Eye, EyeOff, Camera, Users,
  Maximize2, ChevronDown, X, Activity,
  Monitor, Cpu, Zap, Pencil, Plus, Send
} from 'lucide-react';
import RetroOffice3D from '../organisms/RetroOffice3D';
import AgentFormModal from '../organisms/AgentFormModal';
import GlowButton from '../atoms/GlowButton';
import useAgentStore, { useStatusCounts, useSelectedAgent } from '../../store/agentStore';
import { createAgent, logActivity } from '../../lib/airtable';
import { TIERS, STATUSES, VENTURES } from '../../data/constants';

const CAMERA_PRESETS = [
  { id: 'overview',  label: 'OVERVIEW',  icon: Eye },
  { id: 'topDown',   label: 'TOP DOWN',  icon: Maximize2 },
  { id: 'commander', label: 'COMMAND',   icon: Zap },
  { id: 'frontRow',  label: 'FRONT ROW', icon: Monitor },
  { id: 'cinematic', label: 'CINEMATIC', icon: Camera },
];

/**
 * Status quick-action buttons row
 */
const STATUS_ACTIONS = ['active', 'idle', 'blocked', 'offline'];

function StatusButtons({ currentStatus, onStatusChange }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {STATUS_ACTIONS.map(status => {
        const info = STATUSES[status];
        const isActive = currentStatus === status;
        return (
          <motion.button
            key={status}
            className="flex items-center gap-1 px-2 py-1 rounded-full cursor-pointer"
            style={{
              background: isActive ? info.bg : 'transparent',
              border: `1px solid ${isActive ? info.color : info.color + '40'}`,
            }}
            whileHover={{ borderColor: info.color, background: info.bg }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onStatusChange(status)}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: info.color, opacity: isActive ? 1 : 0.6 }}
            />
            <span
              className="font-system text-[7px] tracking-wider"
              style={{ color: isActive ? info.color : info.color + '99' }}
            >
              {info.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Compact task assignment mini-form
 */
function AssignTaskForm({ agentId }) {
  const updateAgentTask = useAgentStore(s => s.updateAgentTask);
  const [taskDesc, setTaskDesc] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);

  const handleAssign = () => {
    if (!taskDesc.trim()) return;
    updateAgentTask(agentId, { description: taskDesc.trim(), progress: taskProgress });
    setTaskDesc('');
    setTaskProgress(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAssign();
    }
  };

  return (
    <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <span className="font-system text-[8px] tracking-widest block mb-2" style={{ color: 'var(--text-disabled)' }}>
        ASSIGN TASK
      </span>
      <input
        type="text"
        placeholder="Task description..."
        value={taskDesc}
        onChange={(e) => setTaskDesc(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-2.5 py-1.5 rounded-lg font-system text-[10px] mb-2 outline-none"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="font-system text-[7px] tracking-wider shrink-0" style={{ color: 'var(--text-muted)' }}>
          PROGRESS
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={taskProgress}
          onChange={(e) => setTaskProgress(Number(e.target.value))}
          className="flex-1 h-1 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00FF88 0%, #00FF88 ${taskProgress}%, var(--bg-void) ${taskProgress}%, var(--bg-void) 100%)`,
            accentColor: '#00FF88',
          }}
        />
        <span className="font-system text-[8px] w-7 text-right" style={{ color: '#00FF88' }}>
          {taskProgress}%
        </span>
      </div>
      <motion.button
        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer font-system text-[9px] tracking-wider font-semibold"
        style={{
          background: taskDesc.trim() ? 'rgba(0,255,136,0.1)' : 'var(--bg-surface)',
          border: `1px solid ${taskDesc.trim() ? '#00FF8840' : 'var(--border-subtle)'}`,
          color: taskDesc.trim() ? '#00FF88' : 'var(--text-disabled)',
        }}
        whileHover={taskDesc.trim() ? { borderColor: '#00FF88', boxShadow: '0 0 12px rgba(0,255,136,0.2)' } : {}}
        whileTap={taskDesc.trim() ? { scale: 0.96 } : {}}
        onClick={handleAssign}
        disabled={!taskDesc.trim()}
      >
        <Send size={10} />
        ASSIGN
      </motion.button>
    </div>
  );
}

/**
 * Agent detail sidebar for the 3D view
 */
function OfficeAgentPanel({ agent, onClose, onEditAgent }) {
  const panelRef = useRef(null);
  const updateAgentStatus = useAgentStore(s => s.updateAgentStatus);

  if (!agent) return null;
  const tierInfo = TIERS[agent.tier] || TIERS[3];
  const statusInfo = STATUSES[agent.status] || STATUSES.offline;
  const ventureInfo = VENTURES[agent.venture] || {};

  const handleStatusChange = (newStatus) => {
    if (newStatus === agent.status) return;
    updateAgentStatus(agent.id, newStatus);
  };

  return (
    <motion.div
      ref={panelRef}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 right-0 h-full w-72 z-20 overflow-y-auto"
      style={{
        background: 'rgba(14, 14, 18, 0.95)',
        borderLeft: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: statusInfo.color }} />
            <span className="font-display text-[11px] font-bold tracking-wider" style={{ color: tierInfo.color }}>
              {agent.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button
              className="p-1.5 rounded-lg cursor-pointer flex items-center gap-1"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}
              whileHover={{ borderColor: '#00D4FF', boxShadow: '0 0 12px rgba(0,212,255,0.2)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEditAgent(agent)}
            >
              <Pencil size={10} style={{ color: '#00D4FF' }} />
            </motion.button>
            <motion.button
              className="p-1.5 rounded-lg cursor-pointer"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              whileHover={{ borderColor: 'var(--border-strong)' }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              <X size={12} style={{ color: 'var(--text-muted)' }} />
            </motion.button>
          </div>
        </div>

        {/* Status quick-action buttons */}
        <StatusButtons currentStatus={agent.status} onStatusChange={handleStatusChange} />

        {/* Status badge */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
          style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.color}30` }}
        >
          <Activity size={12} style={{ color: statusInfo.color }} />
          <span className="font-system text-[9px] tracking-widest" style={{ color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Info grid */}
        <div className="space-y-2 mb-4">
          {[
            { label: 'TIER', value: tierInfo.label, color: tierInfo.color },
            { label: 'VENTURE', value: ventureInfo.name || 'Cross-Venture', color: ventureInfo.color || '#8B5CF6' },
            { label: 'ID', value: agent.id, color: 'var(--text-muted)' },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="font-system text-[8px] tracking-widest" style={{ color: 'var(--text-disabled)' }}>
                {item.label}
              </span>
              <span className="font-system text-[9px]" style={{ color: item.color }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Mandate */}
        {agent.mandate && (
          <div className="mb-4">
            <span className="font-system text-[8px] tracking-widest block mb-1" style={{ color: 'var(--text-disabled)' }}>
              MANDATE
            </span>
            <p className="font-body text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {agent.mandate}
            </p>
          </div>
        )}

        {/* Current task */}
        {agent.task && (
          <div className="mb-4">
            <span className="font-system text-[8px] tracking-widest block mb-1" style={{ color: 'var(--text-disabled)' }}>
              CURRENT TASK
            </span>
            <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <p className="font-body text-[10px]" style={{ color: 'var(--text-primary)' }}>
                {agent.task.description}
              </p>
              {agent.task.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="font-system text-[7px]" style={{ color: 'var(--text-muted)' }}>PROGRESS</span>
                    <span className="font-system text-[7px]" style={{ color: '#00FF88' }}>{agent.task.progress}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: 'var(--bg-void)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${agent.task.progress}%`, background: '#00FF88' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tools */}
        {agent.tools?.length > 0 && (
          <div>
            <span className="font-system text-[8px] tracking-widest block mb-1.5" style={{ color: 'var(--text-disabled)' }}>
              TOOLS ({agent.tools.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {agent.tools.map((tool, i) => (
                <span
                  key={i}
                  className="font-system text-[7px] px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assign Task mini-form */}
        <AssignTaskForm agentId={agent.id} />
      </div>
    </motion.div>
  );
}

/**
 * HUD overlay for the 3D office view
 */
function OfficeHUD({ cameraPreset, onPresetChange, agentCount, statusCounts, onNewAgent }) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <>
      {/* Top-left: Status indicators */}
      <div className="absolute top-3 left-3 z-10">
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(10, 14, 20, 0.85)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <Users size={11} style={{ color: 'var(--accent-primary)' }} />
            <span className="font-system text-[9px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {agentCount}
            </span>
          </div>
          {Object.entries(statusCounts).filter(([k]) => k !== 'total').map(([key, count]) => (
            count > 0 && (
              <div key={key} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUSES[key]?.color }} />
                <span className="font-system text-[8px]" style={{ color: STATUSES[key]?.color }}>
                  {count}
                </span>
              </div>
            )
          ))}
        </div>

        {/* Agent count status line */}
        <div
          className="mt-1.5 px-3 py-1 rounded-lg"
          style={{
            background: 'rgba(10, 14, 20, 0.75)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="font-system text-[7px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
            AGENTS: {agentCount}
            {statusCounts.active > 0 && <> &bull; <span style={{ color: STATUSES.active.color }}>ACTIVE: {statusCounts.active}</span></>}
            {statusCounts.idle > 0 && <> &bull; <span style={{ color: STATUSES.idle.color }}>IDLE: {statusCounts.idle}</span></>}
            {statusCounts.blocked > 0 && <> &bull; <span style={{ color: STATUSES.blocked.color }}>BLOCKED: {statusCounts.blocked}</span></>}
            {statusCounts.offline > 0 && <> &bull; <span style={{ color: STATUSES.offline.color }}>OFFLINE: {statusCounts.offline}</span></>}
          </span>
        </div>
      </div>

      {/* Top-right: Camera presets + New Agent button */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <GlowButton variant="primary" size="sm" onClick={onNewAgent}>
          <span className="flex items-center gap-1">
            <Plus size={10} />
            NEW AGENT
          </span>
        </GlowButton>

        <div className="relative">
          <motion.button
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
            style={{
              background: 'rgba(10, 14, 20, 0.85)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(8px)',
            }}
            whileHover={{ borderColor: 'var(--border-strong)' }}
            onClick={() => setShowPresets(v => !v)}
          >
            <Camera size={11} style={{ color: 'var(--accent-warning)' }} />
            <span className="font-system text-[8px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {CAMERA_PRESETS.find(p => p.id === cameraPreset)?.label || 'CAMERA'}
            </span>
            <ChevronDown size={10} style={{ color: 'var(--text-muted)', transform: showPresets ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </motion.button>

          <AnimatePresence>
            {showPresets && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute top-full right-0 mt-1 rounded-lg overflow-hidden"
                style={{
                  background: 'rgba(10, 14, 20, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  backdropFilter: 'blur(12px)',
                  minWidth: '140px',
                }}
              >
                {CAMERA_PRESETS.map(preset => {
                  const Icon = preset.icon;
                  const isActive = preset.id === cameraPreset;
                  return (
                    <motion.button
                      key={preset.id}
                      className="w-full flex items-center gap-2 px-3 py-2 cursor-pointer"
                      style={{
                        background: isActive ? 'rgba(255,184,0,0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}
                      whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                      onClick={() => {
                        onPresetChange(preset.id);
                        setShowPresets(false);
                      }}
                    >
                      <Icon size={10} style={{ color: isActive ? '#FFB800' : 'var(--text-muted)' }} />
                      <span className="font-system text-[8px] tracking-widest" style={{ color: isActive ? '#FFB800' : 'var(--text-muted)' }}>
                        {preset.label}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom-center: Controls hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
        <div
          className="flex items-center gap-4 px-4 py-1.5 rounded-full"
          style={{
            background: 'rgba(10, 14, 20, 0.7)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span className="font-system text-[7px] tracking-wider" style={{ color: 'var(--text-disabled)' }}>
            DRAG: ROTATE &bull; SCROLL: ZOOM &bull; SHIFT+DRAG: PAN &bull; CLICK: SELECT AGENT
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Office Page — full 3D office view with agent management
 */
export default function OfficePage() {
  const [cameraPreset, setCameraPreset] = useState('overview');
  const [modalState, setModalState] = useState({ open: false, mode: 'create', agent: null });
  const selectedAgentId = useAgentStore(s => s.selectedAgentId);
  const selectAgent = useAgentStore(s => s.selectAgent);
  const clearSelection = useAgentStore(s => s.clearSelection);
  const addAgent = useAgentStore(s => s.addAgent);
  const removeAgent = useAgentStore(s => s.removeAgent);
  const updateAgentFields = useAgentStore(s => s.updateAgentFields);
  const agents = useAgentStore(s => s.agents);
  const selectedAgent = useSelectedAgent();
  const statusCounts = useStatusCounts();
  const containerRef = useRef(null);

  const handleAgentClick = useCallback((agentId) => {
    if (selectedAgentId === agentId) {
      clearSelection();
    } else {
      selectAgent(agentId);
    }
  }, [selectedAgentId, selectAgent, clearSelection]);

  // Click-outside-to-close: close panel when clicking outside it on the page container
  const handleContainerClick = useCallback((e) => {
    if (e.target === containerRef.current) {
      clearSelection();
    }
  }, [clearSelection]);

  // Open modal for creating a new agent
  const handleNewAgent = useCallback(() => {
    setModalState({ open: true, mode: 'create', agent: null });
  }, []);

  // Open modal for editing an existing agent
  const handleEditAgent = useCallback((agent) => {
    setModalState({ open: true, mode: 'edit', agent });
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setModalState({ open: false, mode: 'create', agent: null });
  }, []);

  // Save agent (create or edit)
  const handleSaveAgent = useCallback((agentData) => {
    if (modalState.mode === 'create') {
      // Add to local store immediately (optimistic)
      addAgent(agentData);
      // Sync to Airtable (fire-and-forget)
      createAgent(agentData).catch(err =>
        console.error('[OfficePage] Failed to create agent in Airtable:', err)
      );
      // Log activity (fire-and-forget)
      logActivity({
        event: `Agent "${agentData.name}" created from 3D Office`,
        agentId: agentData.id,
        eventType: 'system',
        details: `New ${TIERS[agentData.tier]?.label || 'Agent'} added to ${VENTURES[agentData.venture]?.name || 'Cross-Venture'}`,
        venture: agentData.venture || '',
      }).catch(err =>
        console.error('[OfficePage] Failed to log activity:', err)
      );
    } else {
      // Edit mode — update existing agent fields
      updateAgentFields(agentData.id, agentData);
    }
    handleCloseModal();
  }, [modalState.mode, addAgent, updateAgentFields, handleCloseModal]);

  // Delete agent (from edit modal)
  const handleDeleteAgent = useCallback((agentId) => {
    removeAgent(agentId);
    clearSelection();
    // Airtable delete is handled by the store or can be triggered here
    const agent = agents.find(a => a.id === agentId);
    if (agent?._recordId) {
      import('../../lib/airtable').then(({ deleteAgent }) => {
        deleteAgent(agent._recordId).catch(err =>
          console.error('[OfficePage] Failed to delete agent from Airtable:', err)
        );
      });
    }
    logActivity({
      event: `Agent "${agent?.name || agentId}" deleted from 3D Office`,
      agentId,
      eventType: 'system',
      details: 'Agent removed via Office management controls',
    }).catch(err =>
      console.error('[OfficePage] Failed to log delete activity:', err)
    );
    handleCloseModal();
  }, [removeAgent, clearSelection, agents, handleCloseModal]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: 'calc(100vh - 130px)', margin: '-20px', marginTop: '-20px' }}
      onClick={handleContainerClick}
    >
      {/* Page header bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-5 py-3"
        style={{
          background: 'linear-gradient(180deg, rgba(10,14,20,0.9) 0%, transparent 100%)',
        }}
      >
        <Building size={16} style={{ color: 'var(--accent-secondary)' }} />
        <h1 className="font-display text-[14px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
          3D OFFICE
        </h1>
        <span className="font-system text-[8px] tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
          LIVE
        </span>
      </div>

      {/* 3D Scene */}
      <RetroOffice3D
        onAgentClick={handleAgentClick}
        selectedAgentId={selectedAgentId}
        cameraPreset={cameraPreset}
        style={{ width: '100%', height: '100%' }}
      />

      {/* HUD Overlay */}
      <OfficeHUD
        cameraPreset={cameraPreset}
        onPresetChange={setCameraPreset}
        agentCount={agents.length}
        statusCounts={statusCounts}
        onNewAgent={handleNewAgent}
      />

      {/* Agent Detail Sidebar */}
      <AnimatePresence mode="wait">
        {selectedAgent && (
          <OfficeAgentPanel
            key={selectedAgent.id}
            agent={selectedAgent}
            onClose={clearSelection}
            onEditAgent={handleEditAgent}
          />
        )}
      </AnimatePresence>

      {/* Agent Form Modal (create/edit) */}
      <AnimatePresence>
        {modalState.open && (
          <AgentFormModal
            mode={modalState.mode}
            agent={modalState.agent}
            agents={agents}
            onSave={handleSaveAgent}
            onDelete={handleDeleteAgent}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
