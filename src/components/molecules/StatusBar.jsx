import { motion } from 'framer-motion';
import { STATUSES } from '../../data/constants';
import { useStatusCounts } from '../../store/agentStore';

export default function StatusBar() {
  const counts = useStatusCounts();

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
      <span className="font-system text-[9px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        SWARM STATUS
      </span>
      <div className="flex items-center gap-3">
        {Object.entries(STATUSES).map(([key, s]) => (
          <motion.div
            key={key}
            className="flex items-center gap-1.5"
            whileHover={{ scale: 1.05 }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: s.color, boxShadow: `0 0 6px ${s.color}60` }}
            />
            <span className="font-system text-[10px] font-semibold" style={{ color: s.color }}>
              {counts[key] || 0}
            </span>
            <span className="font-system text-[8px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="ml-auto font-system text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
        <span style={{ color: 'var(--text-primary)' }}>{counts.total}</span> AGENTS
      </div>
    </div>
  );
}
