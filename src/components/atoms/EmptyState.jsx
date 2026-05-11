import { Inbox } from 'lucide-react';
import GlowButton from './GlowButton';

/**
 * EmptyState — Shown when a list/feed has no content
 * Provides a CTA to create the first item
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'NO DATA',
  message = 'Nothing here yet.',
  actionLabel,
  onAction,
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 rounded-lg"
      style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-subtle)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.15)' }}
      >
        <Icon size={20} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="font-display text-[12px] font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      <p className="font-system text-[10px] max-w-xs text-center" style={{ color: 'var(--text-disabled)' }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <GlowButton variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </GlowButton>
      )}
    </div>
  );
}
