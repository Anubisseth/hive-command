import { motion } from 'framer-motion';
import StatusDot from '../atoms/StatusDot';
import TierLabel from '../atoms/TierLabel';
import VentureBadge from '../atoms/VentureBadge';
import ProgressBar from '../atoms/ProgressBar';
import ToolBadge from '../atoms/ToolBadge';
import { TIERS } from '../../data/constants';
import { cardHover } from '../../motion/variants';

export default function AgentCardCompact({ agent, onClick }) {
  if (!agent) return null;

  const tier = TIERS[agent.tier] ?? TIERS[3];
  const tools = agent.tools || [];

  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onClick={() => onClick?.(agent.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(agent.id); } }}
      aria-label={`View details for ${agent.name || 'agent'}`}
      className="relative rounded-sm cursor-pointer overflow-hidden card-tactical card-accent-top p-4"
    >
      {/* Top row: status + tier + venture */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusDot status={agent.status} size={6} />
          <TierLabel tier={agent.tier} />
        </div>
        <VentureBadge ventureId={agent.venture} />
      </div>

      {/* Agent name */}
      <h3
        className="font-display text-[13px] font-bold tracking-wide mb-1.5 truncate"
        style={{ color: tier.color }}
      >
        {agent.name || 'Unnamed Agent'}
      </h3>

      {/* Mandate (truncated) */}
      <p
        className="font-body text-[11px] leading-relaxed mb-3 line-clamp-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {agent.mandate || 'No mandate assigned'}
      </p>

      {/* Active task progress */}
      {agent.task && (
        <div className="mb-3">
          <p className="font-system text-[9px] mb-1 truncate" style={{ color: 'var(--text-secondary)' }}>
            {agent.task.description}
          </p>
          <ProgressBar value={agent.task.progress} showLabel={false} />
        </div>
      )}

      {/* Tools */}
      <div className="flex flex-wrap gap-1">
        {tools.slice(0, 4).map(tool => (
          <ToolBadge key={tool} tool={tool} />
        ))}
        {tools.length > 4 && (
          <span className="font-system text-[8px] px-1 py-0.5" style={{ color: 'var(--text-muted)' }}>
            +{tools.length - 4}
          </span>
        )}
      </div>
    </motion.div>
  );
}
