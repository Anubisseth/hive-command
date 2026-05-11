import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Zap, FileText, AlertTriangle, X, CheckCheck } from 'lucide-react';
import { detailPanel, sectionVariants } from '../../motion/variants';
import useAgentStore, { useNotifications } from '../../store/agentStore';

// ─── Notification type config ──────────────────────
const NOTIFICATION_TYPES = {
  task_complete: {
    icon: Check,
    color: '#00FF88',
    bg: 'rgba(0,255,136,0.08)',
    border: 'rgba(0,255,136,0.2)',
    label: 'TASK COMPLETE',
  },
  directive_issued: {
    icon: Zap,
    color: '#FFB800',
    bg: 'rgba(255,184,0,0.08)',
    border: 'rgba(255,184,0,0.2)',
    label: 'DIRECTIVE',
  },
  agent_status_change: {
    icon: AlertTriangle,
    color: '#FF6B2B',
    bg: 'rgba(255,107,43,0.08)',
    border: 'rgba(255,107,43,0.2)',
    label: 'STATUS CHANGE',
  },
  output_ready: {
    icon: FileText,
    color: '#00D4FF',
    bg: 'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.2)',
    label: 'OUTPUT READY',
  },
  system: {
    icon: Bell,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
    label: 'SYSTEM',
  },
};

// ─── Time formatting ───────────────────────────────
function formatRelativeTime(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'JUST NOW';
  if (diffMin < 60) return `${diffMin}M AGO`;
  if (diffHr < 24) return `${diffHr}H AGO`;
  return `${diffDay}D AGO`;
}

// ─── Single notification item ──────────────────────
function NotificationItem({ notification, onClear }) {
  const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
  const Icon = config.icon;

  return (
    <motion.div
      variants={sectionVariants}
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{
        background: notification.read ? 'transparent' : config.bg,
        border: `1px solid ${notification.read ? 'var(--border-subtle)' : config.border}`,
        opacity: notification.read ? 0.6 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
        }}
      >
        <Icon size={12} style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="font-system text-[8px] font-semibold tracking-[0.12em] px-1.5 py-0.5 rounded"
            style={{ color: config.color, background: config.bg }}
          >
            {config.label}
          </span>
          <span className="font-system text-[8px] tracking-wider ml-auto flex-shrink-0" style={{ color: 'var(--text-disabled)' }}>
            {formatRelativeTime(notification.time)}
          </span>
        </div>
        <p className="font-body text-[11px] leading-relaxed m-0" style={{ color: notification.read ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
          {notification.message}
        </p>
      </div>

      {/* Dismiss */}
      <motion.button
        className="p-1 rounded cursor-pointer flex-shrink-0"
        style={{ background: 'none', border: 'none', color: 'var(--text-disabled)' }}
        whileHover={{ color: 'var(--text-tertiary)' }}
        onClick={() => onClear(notification.id)}
      >
        <X size={12} />
      </motion.button>
    </motion.div>
  );
}

// ─── Panel ─────────────────────────────────────────
function NotificationPanelInner({ onClose }) {
  const { notifications, unreadCount } = useNotifications();
  const markAllRead = useAgentStore(s => s.markAllRead);
  const clearNotification = useAgentStore(s => s.clearNotification);

  return (
    <motion.div
      variants={detailPanel}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed top-0 right-0 h-full overflow-y-auto z-50"
      style={{
        width: '400px',
        maxWidth: '100vw',
        background: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-default)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Backdrop on mobile */}
      <motion.div
        className="fixed inset-0 -z-10 lg:hidden"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <div className="p-6">
        {/* Header */}
        <motion.div variants={sectionVariants} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              <Bell size={14} style={{ color: '#00D4FF' }} />
            </div>
            <div>
              <h2 className="font-display text-[14px] font-bold tracking-[0.1em]" style={{ color: 'var(--text-primary)' }}>
                NOTIFICATIONS
              </h2>
              <span className="font-system text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {unreadCount > 0 ? `${unreadCount} UNREAD` : 'ALL CLEAR'}
              </span>
            </div>
          </div>
          <motion.button
            className="p-2 rounded-lg cursor-pointer"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}
            whileHover={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
          >
            <X size={14} />
          </motion.button>
        </motion.div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <motion.div variants={sectionVariants} className="mb-4">
            <motion.button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg cursor-pointer font-system text-[10px] font-semibold tracking-[0.12em]"
              style={{
                background: 'rgba(0,212,255,0.06)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00D4FF',
              }}
              whileHover={{
                background: 'rgba(0,212,255,0.12)',
                borderColor: 'rgba(0,212,255,0.4)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={markAllRead}
            >
              <CheckCheck size={12} />
              MARK ALL READ
            </motion.button>
          </motion.div>
        )}

        {/* Notification list */}
        <motion.div variants={sectionVariants} className="flex flex-col gap-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={24} style={{ color: 'var(--text-disabled)', margin: '0 auto 8px' }} />
              <p className="font-system text-[10px] tracking-wider" style={{ color: 'var(--text-disabled)' }}>
                NO NOTIFICATIONS
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem key={n.id} notification={n} onClear={clearNotification} />
            ))
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function NotificationPanel({ isOpen, onClose }) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && <NotificationPanelInner onClose={onClose} />}
    </AnimatePresence>
  );
}
