import { VENTURES } from '../../data/constants';

export default function VentureBadge({ ventureId }) {
  if (!ventureId) return null;
  const v = VENTURES[ventureId];
  if (!v) return null;

  return (
    <span
      className="font-system inline-block px-2 py-0.5 rounded text-[9px] font-medium tracking-wider"
      style={{
        color: v.color,
        background: `${v.color}15`,
        border: `1px solid ${v.color}25`,
      }}
    >
      {v.short}
    </span>
  );
}
