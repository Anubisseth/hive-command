import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = "Search agents..." }) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-muted)' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-system text-[11px] w-full pl-8 pr-3 py-2 rounded-md outline-none transition-colors"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
}
