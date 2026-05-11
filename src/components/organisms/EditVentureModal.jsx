// === HIVE COMMAND — Edit Venture Modal ===
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hexagon, Palette, Tag, Hash, BarChart3, Plus, Trash2 } from 'lucide-react';
import GlowButton from '../atoms/GlowButton';

const PRESET_COLORS = [
  '#3B82F6', '#C7D2FE', '#1E40AF', '#D97706', '#10B981',
  '#06B6D4', '#8B5CF6', '#FF6B35', '#EA4335', '#FFB800',
  '#FF3344', '#00FF88', '#00D4FF', '#F59E0B', '#EC4899',
];

export default function EditVentureModal({ venture, kpis, onSave, onClose, isNew = false }) {
  const [name, setName] = useState('');
  const [short, setShort] = useState('');
  const [color, setColor] = useState('#FFB800');
  const [editedKpis, setEditedKpis] = useState({});
  const [newKpiKey, setNewKpiKey] = useState('');
  const [newKpiValue, setNewKpiValue] = useState('');

  useEffect(() => {
    if (venture) {
      setName(venture.name || '');
      setShort(venture.short || '');
      setColor(venture.color || '#FFB800');
    }
    if (kpis) {
      setEditedKpis({ ...kpis });
    }
  }, [venture, kpis]);

  const handleKpiChange = (key, value) => {
    setEditedKpis(prev => ({ ...prev, [key]: value }));
  };

  const handleAddKpi = () => {
    if (!newKpiKey.trim()) return;
    setEditedKpis(prev => ({ ...prev, [newKpiKey.trim()]: newKpiValue.trim() || '0' }));
    setNewKpiKey('');
    setNewKpiValue('');
  };

  const handleRemoveKpi = (key) => {
    setEditedKpis(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const ventureId = venture?.id || name.trim().toLowerCase().replace(/\s+/g, '_');
    onSave(ventureId, {
      name: name.trim(),
      short: short.trim().toUpperCase() || name.trim().substring(0, 3).toUpperCase(),
      color,
      kpis: editedKpis,
    });
  };

  const inputStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal content */}
      <motion.div
        className="relative w-full max-w-lg rounded-xl p-6 z-10 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Hexagon size={16} style={{ color: 'var(--accent-warning)' }} />
            <h2 className="font-display text-[16px] font-bold tracking-wider" style={{ color: 'var(--accent-warning)' }}>
              {isNew ? 'ADD VENTURE' : 'EDIT VENTURE'}
            </h2>
          </div>
          <motion.button
            className="p-1 rounded cursor-pointer"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
            whileHover={{ color: 'var(--text-primary)' }}
            onClick={onClose}
          >
            <X size={16} />
          </motion.button>
        </div>

        {/* Venture Name */}
        <div className="mb-4">
          <label className="font-system text-[9px] tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <Tag size={10} className="inline mr-1" style={{ verticalAlign: 'middle' }} />
            VENTURE NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Obsidian Flow"
            className="w-full font-body text-[12px] px-3 py-2 rounded-md outline-none"
            style={inputStyle}
          />
        </div>

        {/* Short Code */}
        <div className="mb-4">
          <label className="font-system text-[9px] tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <Hash size={10} className="inline mr-1" style={{ verticalAlign: 'middle' }} />
            SHORT CODE
          </label>
          <input
            type="text"
            value={short}
            onChange={e => setShort(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="e.g. OF"
            maxLength={4}
            className="w-full font-body text-[12px] px-3 py-2 rounded-md outline-none uppercase"
            style={inputStyle}
          />
        </div>

        {/* Color Picker */}
        <div className="mb-5">
          <label className="font-system text-[9px] tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <Palette size={10} className="inline mr-1" style={{ verticalAlign: 'middle' }} />
            COLOR
          </label>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg border-2"
              style={{ background: color, borderColor: `${color}80` }}
            />
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
              style={{ background: 'none', border: 'none', padding: 0 }}
            />
            <input
              type="text"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="font-system text-[11px] px-2 py-1 rounded-md outline-none w-24"
              style={inputStyle}
            />
          </div>
          {/* Preset swatches */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map(c => (
              <motion.button
                key={c}
                className="w-6 h-6 rounded cursor-pointer"
                style={{
                  background: c,
                  border: color === c ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-5" style={{ background: 'var(--border-subtle)' }} />

        {/* Venture KPIs */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} style={{ color: 'var(--accent-warning)' }} />
            <h3 className="font-display text-[12px] font-bold tracking-wider" style={{ color: 'var(--accent-warning)' }}>
              VENTURE KPIs
            </h3>
          </div>

          {Object.keys(editedKpis).length === 0 && (
            <p className="font-system text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
              No KPIs defined. Add metrics below.
            </p>
          )}

          <div className="space-y-2 mb-3">
            {Object.entries(editedKpis).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="font-system text-[9px] tracking-wider uppercase px-2 py-1.5 rounded-md min-w-[80px]"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                >
                  {key}
                </div>
                <input
                  type="text"
                  value={value}
                  onChange={e => handleKpiChange(key, e.target.value)}
                  className="flex-1 font-body text-[12px] px-2 py-1.5 rounded-md outline-none"
                  style={inputStyle}
                />
                <motion.button
                  className="p-1 rounded cursor-pointer"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
                  whileHover={{ color: 'var(--accent-danger)' }}
                  onClick={() => handleRemoveKpi(key)}
                >
                  <Trash2 size={12} />
                </motion.button>
              </div>
            ))}
          </div>

          {/* Add new KPI */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKpiKey}
              onChange={e => setNewKpiKey(e.target.value)}
              placeholder="Metric name"
              className="font-body text-[11px] px-2 py-1.5 rounded-md outline-none w-28"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleAddKpi()}
            />
            <input
              type="text"
              value={newKpiValue}
              onChange={e => setNewKpiValue(e.target.value)}
              placeholder="Value"
              className="flex-1 font-body text-[11px] px-2 py-1.5 rounded-md outline-none"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleAddKpi()}
            />
            <motion.button
              className="p-1.5 rounded cursor-pointer"
              style={{ color: 'var(--accent-warning)', background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)' }}
              whileHover={{ boxShadow: '0 0 12px rgba(255,184,0,0.2)' }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddKpi}
            >
              <Plus size={12} />
            </motion.button>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-5 p-3 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="font-system text-[8px] tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            PREVIEW
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}
            >
              <span className="font-system text-[10px] font-bold" style={{ color }}>
                {short || name.substring(0, 3).toUpperCase() || '---'}
              </span>
            </div>
            <div>
              <div className="font-display text-[12px] font-bold tracking-wide" style={{ color }}>
                {name ? name.toUpperCase() : 'VENTURE NAME'}
              </div>
              <div className="font-system text-[9px]" style={{ color: 'var(--text-muted)' }}>
                {Object.keys(editedKpis).length} KPIs configured
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <GlowButton variant="secondary" size="md" onClick={onClose}>
            CANCEL
          </GlowButton>
          <GlowButton variant="amber" size="md" onClick={handleSave}>
            {isNew ? 'CREATE VENTURE' : 'SAVE CHANGES'}
          </GlowButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
