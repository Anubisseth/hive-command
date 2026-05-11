import { motion } from 'framer-motion';
import { STATUSES } from '../../data/constants';

export default function StatusDot({ status, size = 8 }) {
  const s = STATUSES[status] || STATUSES.offline;
  const isActive = status === 'active';
  const isBlocked = status === 'blocked';

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size * 2.5, height: size * 2.5 }}>
      {/* Outer glow ring for active */}
      {isActive && (
        <motion.span
          className="absolute rounded-full"
          style={{ width: size * 2, height: size * 2, background: s.color, opacity: 0.2 }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
        />
      )}
      {/* Core dot */}
      <motion.span
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: s.color,
          boxShadow: `0 0 ${size}px ${s.color}80`,
        }}
        animate={
          isActive
            ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
            : isBlocked
            ? { opacity: [1, 0.3, 1] }
            : {}
        }
        transition={
          isActive
            ? { duration: 2, ease: "easeInOut", repeat: Infinity }
            : isBlocked
            ? { duration: 0.8, ease: "linear", repeat: Infinity }
            : {}
        }
      />
    </span>
  );
}
