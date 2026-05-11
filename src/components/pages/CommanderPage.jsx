// === HIVE COMMAND — Commander Page ===
// Autonomous swarm loop UI: directive input, phase stepper, execution grid, live log

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Play, Pause, Square, RotateCcw,
  ChevronDown, ChevronRight, CheckCircle, XCircle, AlertCircle,
  Terminal, Crown,
} from 'lucide-react';
import { useCommanderLoop } from '../../hooks/useCommanderLoop';
import { useCommanderLoopStore } from '../../store/commanderLoopStore';
import useAgentStore from '../../store/agentStore';
import { VENTURES, TIERS, STATUSES } from '../../data/constants';
import LoopPhaseIndicator from '../molecules/LoopPhaseIndicator';
import GlowButton from '../atoms/GlowButton';
import StatusDot from '../atoms/StatusDot';
import { containerVariants, itemVariants, modalContent } from '../../motion/variants';

const PRIORITIES = [
  { value: 'critical', label: 'CRITICAL', color: '#FF3344' },
  { value: 'high', label: 'HIGH', color: '#FF6B35' },
  { value: 'medium', label: 'MEDIUM', color: '#FFB800' },
  { value: 'low', label: 'LOW', color: '#6B7280' },
];

export default function CommanderPage() {
  const { start, pause, resume, stop } = useCommanderLoop();
  const {
    loopState, currentDirective, iteration, maxIterations,
    currentPhase, tasks, outputs, review, executingAgentId,
    executionProgress, iterationHistory, log, delayBetweenCalls,
    setMaxIterations, setDelayBetweenCalls,
  } = useCommanderLoopStore();
  const agents = useAgentStore(s => s.agents);

  // Directive form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venture, setVenture] = useState('');
  const [priority, setPriority] = useState('medium');

  const isIdle = loopState === 'IDLE';
  const isRunning = loopState === 'RUNNING';
  const isPaused = loopState === 'PAUSED';

  const handleStart = () => {
    if (!title.trim()) return;
    start({
      title: title.trim(),
      description: description.trim() || title.trim(),
      venture: venture || null,
      priority,
    }, { maxIterations, delayBetweenCalls });
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Crown size={20} style={{ color: '#FFB800' }} />
          <h1 className="font-display text-[18px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
            COMMANDER LOOP
          </h1>
          <LoopStateBadge state={loopState} />
          {!isIdle && (
            <span className="font-system text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Iteration {iteration}/{maxIterations}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isIdle && (
            <GlowButton
              variant="primary"
              size="md"
              onClick={handleStart}
              disabled={!title.trim()}
            >
              <Play size={14} /> DEPLOY
            </GlowButton>
          )}
          {isRunning && (
            <>
              <GlowButton variant="secondary" size="sm" onClick={pause}>
                <Pause size={14} /> PAUSE
              </GlowButton>
              <GlowButton variant="danger" size="sm" onClick={stop}>
                <Square size={14} /> STOP
              </GlowButton>
            </>
          )}
          {isPaused && (
            <>
              <GlowButton variant="primary" size="sm" onClick={resume}>
                <Play size={14} /> RESUME
              </GlowButton>
              <GlowButton variant="danger" size="sm" onClick={stop}>
                <Square size={14} /> STOP
              </GlowButton>
            </>
          )}
        </div>
      </motion.div>

      {/* Phase Indicator */}
      {!isIdle && (
        <motion.div variants={itemVariants}>
          <LoopPhaseIndicator currentPhase={currentPhase} isRunning={isRunning} />
        </motion.div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: isIdle ? '1fr' : '1fr 1fr' }}>
        {/* Left Panel */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          {isIdle ? (
            <DirectiveForm
              title={title} setTitle={setTitle}
              description={description} setDescription={setDescription}
              venture={venture} setVenture={setVenture}
              priority={priority} setPriority={setPriority}
              maxIterations={maxIterations} setMaxIterations={setMaxIterations}
              delayBetweenCalls={delayBetweenCalls} setDelayBetweenCalls={setDelayBetweenCalls}
              onSubmit={handleStart}
            />
          ) : (
            <>
              {/* Active directive */}
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={14} style={{ color: '#FFB800' }} />
                  <span className="font-display text-[12px] font-bold tracking-wider" style={{ color: '#FFB800' }}>
                    ACTIVE DIRECTIVE
                  </span>
                </div>
                <p className="font-system text-[13px]" style={{ color: 'var(--text-primary)' }}>
                  {currentDirective?.title}
                </p>
                {currentDirective?.description !== currentDirective?.title && (
                  <p className="font-system text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {currentDirective?.description}
                  </p>
                )}
              </div>

              {/* Agent Execution Grid */}
              <AgentExecutionGrid
                tasks={tasks}
                outputs={outputs}
                executingAgentId={executingAgentId}
                executionProgress={executionProgress}
                agents={agents}
                review={review}
              />

              {/* Review Panel */}
              {review && <ReviewPanel review={review} />}

              {/* Iteration History */}
              {iterationHistory.length > 0 && (
                <IterationHistory history={iterationHistory} />
              )}
            </>
          )}
        </motion.div>

        {/* Right Panel — Live Log (only when running) */}
        {!isIdle && (
          <motion.div variants={itemVariants}>
            <LiveLog log={log} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Sub-components ────────────────────────────────────

function LoopStateBadge({ state }) {
  const colors = {
    IDLE: { bg: 'rgba(107,114,128,0.15)', color: '#6B7280' },
    RUNNING: { bg: 'rgba(0,255,136,0.12)', color: '#00FF88' },
    PAUSED: { bg: 'rgba(255,184,0,0.12)', color: '#FFB800' },
    STOPPED: { bg: 'rgba(255,51,68,0.12)', color: '#FF3344' },
  };
  const c = colors[state] || colors.IDLE;

  return (
    <motion.span
      className="font-system text-[10px] font-bold px-2 py-0.5 rounded"
      style={{ background: c.bg, color: c.color, letterSpacing: '0.08em' }}
      animate={state === 'RUNNING' ? { opacity: [1, 0.5, 1] } : {}}
      transition={state === 'RUNNING' ? { duration: 2, repeat: Infinity } : {}}
    >
      {state}
    </motion.span>
  );
}

function DirectiveForm({
  title, setTitle, description, setDescription,
  venture, setVenture, priority, setPriority,
  maxIterations, setMaxIterations,
  delayBetweenCalls, setDelayBetweenCalls,
  onSubmit,
}) {
  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Crown size={16} style={{ color: '#FFB800' }} />
        <h2 className="font-display text-[14px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
          ISSUE DIRECTIVE TO HIVE PRIME
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label className="font-system text-[10px] font-bold tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
            DIRECTIVE TITLE
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Improve product positioning across all channels"
            className="w-full rounded-lg px-3 py-2 font-system text-[13px]"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            onKeyDown={e => e.key === 'Enter' && title.trim() && onSubmit()}
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-system text-[10px] font-bold tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
            DETAILS (optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Provide additional context, constraints, or goals for the swarm..."
            rows={3}
            className="w-full rounded-lg px-3 py-2 font-system text-[13px] resize-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Venture + Priority row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-system text-[10px] font-bold tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
              VENTURE
            </label>
            <select
              value={venture}
              onChange={e => setVenture(e.target.value)}
              className="w-full rounded-lg px-3 py-2 font-system text-[12px]"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Cross-Venture</option>
              {Object.entries(VENTURES).filter(([k]) => k !== 'cross').map(([key, v]) => (
                <option key={key} value={key}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-system text-[10px] font-bold tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
              PRIORITY
            </label>
            <div className="flex gap-1">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className="flex-1 rounded-lg py-1.5 font-system text-[10px] font-bold tracking-wider transition-all"
                  style={{
                    background: priority === p.value ? `${p.color}20` : 'transparent',
                    border: `1px solid ${priority === p.value ? p.color : 'var(--border-subtle)'}`,
                    color: priority === p.value ? p.color : 'var(--text-muted)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-system text-[10px] font-bold tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
              MAX ITERATIONS: {maxIterations}
            </label>
            <input
              type="range"
              min={1}
              max={25}
              value={maxIterations}
              onChange={e => setMaxIterations(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: '#00FF88' }}
            />
          </div>
          <div>
            <label className="font-system text-[10px] font-bold tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
              DELAY BETWEEN CALLS: {(delayBetweenCalls / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              min={500}
              max={10000}
              step={500}
              value={delayBetweenCalls}
              onChange={e => setDelayBetweenCalls(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: '#00D4FF' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentExecutionGrid({ tasks, outputs, executingAgentId, executionProgress, agents, review }) {
  if (tasks.length === 0) return null;

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={14} style={{ color: '#00FF88' }} />
        <span className="font-display text-[12px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
          AGENT EXECUTION
        </span>
        <span className="font-system text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {executionProgress.current}/{executionProgress.total || tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task, i) => {
          const agent = agents.find(a => a.id === task.agentId);
          const isExecuting = executingAgentId === task.agentId;
          const output = outputs.find(o => o.agentId === task.agentId);
          const isDone = !!output;
          const reviewItem = review?.reviews?.find(r => r.agentId === task.agentId);

          return (
            <motion.div
              key={`${task.agentId}-${i}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{
                background: isExecuting ? 'rgba(0,255,136,0.06)' : 'var(--bg-elevated)',
                border: `1px solid ${isExecuting ? 'rgba(0,255,136,0.3)' : 'var(--border-subtle)'}`,
              }}
              animate={isExecuting ? {
                borderColor: ['rgba(0,255,136,0.3)', 'rgba(0,255,136,0.6)', 'rgba(0,255,136,0.3)'],
              } : {}}
              transition={isExecuting ? { duration: 1.5, repeat: Infinity } : {}}
            >
              {/* Status indicator */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }}>
                {isDone ? (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: reviewItem?.verdict === 'reject' ? '#FF3344' : reviewItem?.verdict === 'revise' ? '#FFB800' : '#00FF88' }} />
                ) : isExecuting ? (
                  <motion.div
                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF88' }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-disabled)' }} />
                )}
              </div>

              {/* Agent name */}
              <span className="font-system text-[11px] font-bold" style={{
                color: isExecuting ? '#00FF88' : isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                minWidth: 100,
              }}>
                {agent?.name || task.agentId}
              </span>

              {/* Task */}
              <span className="font-system text-[10px] flex-1 truncate" style={{
                color: 'var(--text-muted)',
              }}>
                {task.title}
              </span>

              {/* Score badge */}
              {reviewItem && (
                <span className="font-system text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                  background: reviewItem.verdict === 'approve' ? 'rgba(0,255,136,0.1)' : reviewItem.verdict === 'revise' ? 'rgba(255,184,0,0.1)' : 'rgba(255,51,68,0.1)',
                  color: reviewItem.verdict === 'approve' ? '#00FF88' : reviewItem.verdict === 'revise' ? '#FFB800' : '#FF3344',
                }}>
                  {reviewItem.score}/10
                </span>
              )}

              {/* Status label */}
              <span className="font-system text-[9px] tracking-wider" style={{
                color: isExecuting ? '#00FF88' : isDone ? 'var(--text-muted)' : 'var(--text-disabled)',
              }}>
                {isExecuting ? 'EXECUTING' : isDone ? 'DONE' : 'QUEUED'}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewPanel({ review }) {
  return (
    <motion.div
      className="rounded-xl p-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown size={14} style={{ color: '#FF6B35' }} />
          <span className="font-display text-[12px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
            COMMANDER REVIEW
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-system text-[11px] font-bold" style={{
            color: review.overallScore >= 7 ? '#00FF88' : review.overallScore >= 4 ? '#FFB800' : '#FF3344',
          }}>
            {review.overallScore}/10
          </span>
          {review.directiveComplete ? (
            <span className="font-system text-[9px] px-2 py-0.5 rounded" style={{
              background: 'rgba(0,255,136,0.12)', color: '#00FF88',
            }}>COMPLETE</span>
          ) : (
            <span className="font-system text-[9px] px-2 py-0.5 rounded" style={{
              background: 'rgba(255,184,0,0.12)', color: '#FFB800',
            }}>ITERATING</span>
          )}
        </div>
      </div>
      <p className="font-system text-[12px]" style={{ color: 'var(--text-muted)' }}>
        {review.overallFeedback}
      </p>
      {review.newSubTasks?.length > 0 && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="font-system text-[10px] font-bold" style={{ color: '#FFB800' }}>
            NEW SUB-TASKS FOR NEXT ITERATION:
          </span>
          {review.newSubTasks.map((t, i) => (
            <p key={i} className="font-system text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {t.agentId && <span style={{ color: 'var(--text-primary)' }}>{t.agentId}: </span>}
              {t.title}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function IterationHistory({ history }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <span className="font-display text-[12px] font-bold tracking-wider block mb-3" style={{ color: 'var(--text-primary)' }}>
        ITERATION HISTORY
      </span>
      <div className="flex flex-col gap-1">
        {history.map((entry, i) => (
          <div key={i}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg transition-colors"
              style={{ background: expanded === i ? 'var(--bg-elevated)' : 'transparent' }}
            >
              {expanded === i ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span className="font-system text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                Iteration {entry.iteration}
              </span>
              <span className="font-system text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {entry.tasks?.length || 0} tasks, {entry.outputs?.length || 0} outputs
              </span>
              <span className="ml-auto font-system text-[10px] font-bold" style={{
                color: (entry.review?.overallScore || 0) >= 7 ? '#00FF88' : '#FFB800',
              }}>
                {entry.review?.overallScore}/10
              </span>
            </button>
            <AnimatePresence>
              {expanded === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-2">
                    <p className="font-system text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {entry.review?.overallFeedback || 'No review feedback'}
                    </p>
                    {entry.review?.reviews?.map((r, j) => (
                      <div key={j} className="flex items-center gap-2 mt-1">
                        {r.verdict === 'approve' ? <CheckCircle size={10} color="#00FF88" /> :
                         r.verdict === 'revise' ? <AlertCircle size={10} color="#FFB800" /> :
                         <XCircle size={10} color="#FF3344" />}
                        <span className="font-system text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {r.agentId}: {r.feedback}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveLog({ log }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  const typeColors = {
    system: '#6B7280',
    info: '#00D4FF',
    success: '#00FF88',
    error: '#FF3344',
  };

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        height: 'calc(100vh - 200px)',
        minHeight: 400,
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <Terminal size={14} style={{ color: '#00FF88' }} />
        <span className="font-display text-[12px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
          LIVE LOG
        </span>
        <span className="font-system text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {log.length} entries
        </span>
      </div>
      <div
        className="flex-1 overflow-y-auto px-4 py-2"
        style={{ fontFamily: 'var(--font-system)', fontSize: 11 }}
      >
        {log.map((entry) => (
          <div key={entry.id} className="flex gap-2 py-0.5" style={{ lineHeight: 1.5 }}>
            <span style={{ color: 'var(--text-disabled)', flexShrink: 0, fontSize: 9, width: 50 }}>
              {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span style={{ color: typeColors[entry.type] || '#6B7280' }}>
              {entry.message}
            </span>
          </div>
        ))}
        {log.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <span className="font-system text-[11px]" style={{ color: 'var(--text-disabled)' }}>
              Waiting for Commander to issue directive...
            </span>
          </div>
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
