import { motion } from 'framer-motion';
import StatusDot from '../atoms/StatusDot';
import VentureBadge from '../atoms/VentureBadge';
import ProgressBar from '../atoms/ProgressBar';
import { taskEnter } from '../../motion/variants';

export default function TaskFeedItem({ task, onClick }) {
  if (!task?.agentId) return null;

  return (
    <motion.div
      variants={taskEnter}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      onClick={() => onClick?.(task.agentId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(task.agentId); } }}
      aria-label={`Task: ${task.description || 'No description'} by ${task.agentName || 'Unknown agent'}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <StatusDot status={task.status} size={5} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display text-[10px] font-bold tracking-wide truncate" style={{ color: 'var(--text-primary)' }}>
            {task.agentName}
          </span>
          <VentureBadge ventureId={task.venture} />
        </div>
        <p className="font-system text-[9px] truncate" style={{ color: 'var(--text-tertiary)' }}>
          {task.description}
        </p>
      </div>
      <div className="w-16 flex-shrink-0">
        <ProgressBar value={task.progress} showLabel={true} />
      </div>
    </motion.div>
  );
}
