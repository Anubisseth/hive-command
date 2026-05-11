import { TOOL_COLORS } from '../../data/constants';

export default function ToolBadge({ tool }) {
  const color = TOOL_COLORS[tool] || '#9CA3AF';
  const initials = tool.slice(0, 2).toUpperCase();

  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded font-system text-[7px] font-bold tracking-wider"
      style={{
        background: `${color}30`,
        border: `1px solid ${color}50`,
        color: '#F9FAFB',
        boxShadow: `0 0 4px ${color}20`,
      }}
      title={tool}
    >
      {initials}
    </span>
  );
}
