import { Loader2 } from 'lucide-react';

/**
 * LoadingState — Tactical-styled loading indicator
 * Used while fetching data from Airtable or running agent operations
 */
export default function LoadingState({ message = 'LOADING...', size = 'md' }) {
  const sizes = {
    sm: { icon: 14, text: '9px', pad: 'py-4' },
    md: { icon: 20, text: '10px', pad: 'py-12' },
    lg: { icon: 28, text: '12px', pad: 'py-20' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${s.pad}`}>
      <Loader2
        size={s.icon}
        className="animate-spin"
        style={{ color: 'var(--accent-warning)' }}
      />
      <span
        className="font-system font-semibold tracking-[0.15em]"
        style={{ color: 'var(--text-muted)', fontSize: s.text }}
      >
        {message}
      </span>
    </div>
  );
}
