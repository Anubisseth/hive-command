import { TIERS } from '../../data/constants';

export default function TierLabel({ tier }) {
  const t = TIERS[tier] || TIERS[3];
  return (
    <span
      className="font-system inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase"
      style={{
        color: t.color,
        background: `${t.color}15`,
        border: `1px solid ${t.color}30`,
      }}
    >
      {t.label}
    </span>
  );
}
