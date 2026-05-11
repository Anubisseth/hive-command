// === HIVE COMMAND — Loop Phase Indicator ===
// Horizontal stepper showing the 5 phases of the Commander Loop

import { motion } from 'framer-motion';
import { Brain, Send, Cpu, Package, Eye } from 'lucide-react';

const PHASES = [
  { id: 'decompose',  label: 'DECOMPOSE',  icon: Brain,   color: '#FFB800' },
  { id: 'distribute', label: 'DISTRIBUTE', icon: Send,    color: '#00D4FF' },
  { id: 'execute',    label: 'EXECUTE',    icon: Cpu,     color: '#00FF88' },
  { id: 'collect',    label: 'COLLECT',    icon: Package, color: '#8B5CF6' },
  { id: 'review',     label: 'REVIEW',     icon: Eye,     color: '#FF6B35' },
];

export default function LoopPhaseIndicator({ currentPhase, isRunning }) {
  const activeIndex = PHASES.findIndex(p => p.id === currentPhase);

  return (
    <div className="flex items-center gap-1 w-full" style={{ padding: '12px 0' }}>
      {PHASES.map((phase, i) => {
        const Icon = phase.icon;
        const isActive = phase.id === currentPhase;
        const isDone = activeIndex > i;
        const color = isActive ? phase.color : isDone ? phase.color : 'var(--text-disabled)';
        const opacity = isActive ? 1 : isDone ? 0.6 : 0.25;

        return (
          <div key={phase.id} className="flex items-center" style={{ flex: 1 }}>
            <motion.div
              className="flex flex-col items-center gap-1 relative"
              style={{ flex: 1 }}
              animate={{
                opacity,
                scale: isActive ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 36,
                  height: 36,
                  background: isActive ? `${phase.color}15` : isDone ? `${phase.color}08` : 'transparent',
                  border: `1px solid ${isActive ? phase.color : isDone ? `${phase.color}40` : 'var(--border-subtle)'}`,
                }}
                animate={isActive && isRunning ? {
                  boxShadow: [
                    `0 0 4px ${phase.color}30`,
                    `0 0 16px ${phase.color}50`,
                    `0 0 4px ${phase.color}30`,
                  ],
                } : {}}
                transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
              >
                <Icon size={16} style={{ color }} />
              </motion.div>
              <span
                className="font-system text-center"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.05em',
                  color,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {phase.label}
              </span>
            </motion.div>

            {/* Connector line */}
            {i < PHASES.length - 1 && (
              <div
                style={{
                  flex: '0 0 auto',
                  width: 20,
                  height: 1,
                  background: isDone ? `${phase.color}60` : 'var(--border-subtle)',
                  marginTop: -14,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
