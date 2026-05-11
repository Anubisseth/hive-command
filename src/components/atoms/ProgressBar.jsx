import { motion } from 'framer-motion';

export default function ProgressBar({ value = 0, max = 100, showLabel = true }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      <div
        className="w-full overflow-hidden rounded-full"
        style={{ height: 4, background: 'var(--bg-surface)' }}
      >
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: 'linear-gradient(90deg, #00FF88, #00D4FF)',
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96], delay: 0.2 }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
          />
        </motion.div>
      </div>
      {showLabel && (
        <span className="font-system text-[9px] mt-1 block" style={{ color: 'var(--text-tertiary)' }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
