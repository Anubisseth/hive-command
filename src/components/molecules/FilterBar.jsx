import { motion } from 'framer-motion';
import { TIERS, VENTURES, STATUSES } from '../../data/constants';
import useAgentStore from '../../store/agentStore';

function FilterPill({ label, active, color, onClick }) {
  return (
    <motion.button
      className="font-system text-[9px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-full cursor-pointer transition-colors"
      style={{
        background: active ? `${color}20` : 'transparent',
        border: `1px solid ${active ? `${color}50` : 'var(--border-subtle)'}`,
        color: active ? color : 'var(--text-muted)',
      }}
      whileHover={{ borderColor: `${color}60` }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {label}
    </motion.button>
  );
}

export default function FilterBar() {
  const filter = useAgentStore(s => s.filter);
  const setFilter = useAgentStore(s => s.setFilter);

  return (
    <div className="flex flex-wrap gap-4">
      {/* Tier filters */}
      <div className="flex items-center gap-1.5">
        <span className="font-system text-[8px] tracking-widest uppercase mr-1" style={{ color: 'var(--text-muted)' }}>
          TIER
        </span>
        <FilterPill
          label="ALL"
          active={filter.tier === 'all'}
          color="#9CA3AF"
          onClick={() => setFilter('tier', 'all')}
        />
        {Object.entries(TIERS).map(([key, t]) => (
          <FilterPill
            key={key}
            label={t.label}
            active={filter.tier === key}
            color={t.color}
            onClick={() => setFilter('tier', key)}
          />
        ))}
      </div>

      {/* Venture filters */}
      <div className="flex items-center gap-1.5">
        <span className="font-system text-[8px] tracking-widest uppercase mr-1" style={{ color: 'var(--text-muted)' }}>
          VENTURE
        </span>
        <FilterPill
          label="ALL"
          active={filter.venture === 'all'}
          color="#9CA3AF"
          onClick={() => setFilter('venture', 'all')}
        />
        {Object.entries(VENTURES).map(([key, v]) => (
          <FilterPill
            key={key}
            label={v.short}
            active={filter.venture === key}
            color={v.color}
            onClick={() => setFilter('venture', key)}
          />
        ))}
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-1.5">
        <span className="font-system text-[8px] tracking-widest uppercase mr-1" style={{ color: 'var(--text-muted)' }}>
          STATUS
        </span>
        <FilterPill
          label="ALL"
          active={filter.status === 'all'}
          color="#9CA3AF"
          onClick={() => setFilter('status', 'all')}
        />
        {Object.entries(STATUSES).map(([key, s]) => (
          <FilterPill
            key={key}
            label={s.label}
            active={filter.status === key}
            color={s.color}
            onClick={() => setFilter('status', key)}
          />
        ))}
      </div>
    </div>
  );
}
