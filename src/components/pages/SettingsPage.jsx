// === HIVE COMMAND — Settings Page ===
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Settings, Palette, Bell, Link2, Shield, Database, Cloud, HardDrive, CheckCircle, XCircle, Volume2, VolumeX, Key, User, Clock, LogIn, Bot, Cpu, Zap } from 'lucide-react';
import GlowButton from '../atoms/GlowButton';
import { useDataSource } from '../../store/agentStore';
import { isAirtableConfigured, TABLES } from '../../lib/airtable';

const THEMES = [
  { label: 'TACTICAL DARK', id: 'tactical-dark', bgVoid: '#0A0E14', bgPrimary: '#0F1318', bgElevated: '#171C23', accent: null },
  { label: 'MIDNIGHT',      id: 'midnight',      bgVoid: '#0F172A', bgPrimary: '#131B2E', bgElevated: '#1A2338', accent: null },
  { label: 'VOID',          id: 'void',          bgVoid: '#000000', bgPrimary: '#0A0A0A', bgElevated: '#141414', accent: null },
  { label: 'DEEP OCEAN',    id: 'deep-ocean',    bgVoid: '#020C1B', bgPrimary: '#0A192F', bgElevated: '#112240', accent: '#64FFDA' },
  { label: 'CRIMSON OPS',   id: 'crimson-ops',   bgVoid: '#1A0A0A', bgPrimary: '#1F0F0F', bgElevated: '#2A1515', accent: '#FF6B6B' },
  { label: 'PHANTOM',       id: 'phantom',       bgVoid: '#0D0D1A', bgPrimary: '#12121F', bgElevated: '#1A1A2E', accent: '#A855F7' },
  { label: 'ARCTIC',        id: 'arctic',        bgVoid: '#0A1014', bgPrimary: '#0E1A22', bgElevated: '#14242E', accent: '#38BDF8' },
];

// Check specific env vars by name — avoids exposing the full import.meta.env object
const hasAirtable = isAirtableConfigured();
const hasOllamaEnv = !!import.meta.env.VITE_OLLAMA_URL;
const hasAnthropicEnv = !!import.meta.env.VITE_ANTHROPIC_API_KEY;
const hasOpenAIEnv = !!import.meta.env.VITE_OPENAI_API_KEY;
const hasN8nEnv = !!import.meta.env.VITE_N8N_URL;

function getIntegrations() {
  return [
    { name: 'Airtable',      status: hasAirtable ? 'connected' : 'disconnected', color: '#18BFFF' },
    { name: 'GoHighLevel',   status: 'connected', color: '#FF6B35' },
    { name: 'Gmail',         status: 'connected', color: '#EA4335' },
    { name: 'LinkedIn',      status: 'connected', color: '#0A66C2' },
    { name: 'Shopify',       status: 'connected', color: '#96BF48' },
    { name: 'n8n Workflows', status: hasN8nEnv ? 'connected' : 'pending', color: '#FF6D5A', note: 'Phase 3' },
    { name: 'Notion',        status: 'connected', color: '#FFFFFF' },
    { name: 'Claude API',    status: hasAnthropicEnv ? 'connected' : 'disconnected', color: '#D4A574' },
    { name: 'Ollama',        status: hasOllamaEnv ? 'connected' : 'disconnected', color: '#FFFFFF', note: 'Local LLM' },
    { name: 'OpenAI',        status: hasOpenAIEnv ? 'connected' : 'disconnected', color: '#74AA9C' },
    { name: 'DataDocked',    status: 'pending', color: '#1E40AF' },
    { name: 'Canva',         status: 'pending', color: '#00C4CC' },
    { name: 'Meta Ads',      status: 'disconnected', color: '#0668E1' },
    { name: 'ManyChat',      status: 'disconnected', color: '#0084FF' },
  ];
}

const STATUS_STYLE = {
  connected:    { color: '#00FF88', label: 'CONNECTED' },
  pending:      { color: '#FFB800', label: 'PENDING' },
  disconnected: { color: '#6B7280', label: 'DISCONNECTED' },
};

function DatabaseSection() {
  const configured = isAirtableConfigured();
  const { source, lastSync } = useDataSource();

  const tables = [
    { name: 'Agents', id: TABLES.agents, records: 22 },
    { name: 'Directives', id: TABLES.directives, records: 0 },
    { name: 'Tasks', id: TABLES.tasks, records: 0 },
    { name: 'Outputs', id: TABLES.outputs, records: 0 },
    { name: 'Activity Log', id: TABLES.activityLog, records: 0 },
  ];

  return (
    <div className="animate-in">
      <h2 className="font-display text-[14px] font-bold tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
        DATABASE CONNECTION
      </h2>

      {/* Connection status card */}
      <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {configured ? (
              <Cloud size={14} style={{ color: '#00FF88' }} />
            ) : (
              <HardDrive size={14} style={{ color: 'var(--text-muted)' }} />
            )}
            <span className="font-system text-[11px] font-bold tracking-wider" style={{ color: configured ? '#00FF88' : 'var(--text-muted)' }}>
              {configured ? 'AIRTABLE CONNECTED' : 'LOCAL MODE'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {configured ? (
              <CheckCircle size={12} style={{ color: '#00FF88' }} />
            ) : (
              <XCircle size={12} style={{ color: '#FFB800' }} />
            )}
            <span className="font-system text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
              {source === 'airtable' ? `Last sync: ${lastSync?.toLocaleTimeString() || 'Never'}` : 'Using hardcoded data'}
            </span>
          </div>
        </div>

        {!configured && (
          <div className="p-3 rounded-lg mt-3" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}>
            <p className="font-system text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              To enable live data, create a <code className="font-system text-[9px] px-1 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: '#FFB800' }}>.env</code> file in the project root with your Airtable Personal Access Token:
            </p>
            <pre className="font-system text-[9px] mt-2 p-2 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)', whiteSpace: 'pre-wrap' }}>
              VITE_AIRTABLE_API_KEY=pat_your_token_here{'\n'}VITE_AIRTABLE_BASE_ID=app_your_base_id_here
            </pre>
          </div>
        )}
      </div>

      {/* Tables overview */}
      <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>AIRTABLE SCHEMA</h3>
        <div className="flex flex-col gap-2">
          {tables.map(t => (
            <div key={t.name} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--bg-surface)' }}>
              <div className="flex items-center gap-2">
                <Database size={11} style={{ color: '#18BFFF' }} />
                <span className="font-system text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-system text-[8px] tracking-wider" style={{ color: 'var(--text-disabled)' }}>{t.id}</span>
                <span className="font-system text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                  {t.records} rows
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DisplaySection() {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('hive-theme') || 'tactical-dark';
  });
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    return localStorage.getItem('hive-animations') !== 'false';
  });

  // Restore saved theme on mount
  useEffect(() => {
    const saved = THEMES.find(t => t.id === activeTheme);
    if (saved && saved.id !== 'tactical-dark') {
      const root = document.documentElement;
      root.style.setProperty('--bg-void', saved.bgVoid);
      root.style.setProperty('--bg-primary', saved.bgPrimary);
      root.style.setProperty('--bg-elevated', saved.bgElevated);
      if (saved.accent) root.style.setProperty('--accent-primary', saved.accent);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyTheme = useCallback((theme) => {
    setActiveTheme(theme.id);
    localStorage.setItem('hive-theme', theme.id);
    const root = document.documentElement;
    root.style.setProperty('--bg-void', theme.bgVoid);
    root.style.setProperty('--bg-primary', theme.bgPrimary);
    root.style.setProperty('--bg-elevated', theme.bgElevated);
    // Apply accent color override if theme defines one, otherwise reset to default
    if (theme.accent) {
      root.style.setProperty('--accent-primary', theme.accent);
    } else {
      root.style.setProperty('--accent-primary', '#00FF88');
    }
  }, []);

  const toggleAnimations = useCallback(() => {
    setAnimationsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('hive-animations', String(next));
      document.documentElement.classList.toggle('reduce-motion', !next);
      return next;
    });
  }, []);

  return (
    <div className="animate-in">
      <h2 className="font-display text-[14px] font-bold tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
        DISPLAY & THEME
      </h2>
      <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>THEME</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {THEMES.map(theme => (
            <div key={theme.id}
              className="p-3 rounded-lg cursor-pointer text-center relative overflow-hidden"
              onClick={() => applyTheme(theme)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') applyTheme(theme); }}
              style={{
                background: theme.bgVoid,
                border: `2px solid ${activeTheme === theme.id ? (theme.accent || 'var(--accent-primary)') : 'var(--border-subtle)'}`,
              }}>
              {/* Color preview bar */}
              <div className="flex gap-1 mb-2 justify-center">
                <span className="w-3 h-3 rounded-full" style={{ background: theme.bgPrimary, border: '1px solid rgba(255,255,255,0.1)' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: theme.bgElevated, border: '1px solid rgba(255,255,255,0.1)' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: theme.accent || '#00FF88' }} />
              </div>
              <span className="font-system text-[8px] tracking-wider" style={{ color: activeTheme === theme.id ? (theme.accent || 'var(--accent-primary)') : 'var(--text-muted)' }}>
                {theme.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>ANIMATIONS</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className="w-8 h-4 rounded-full relative transition-colors"
            style={{ background: animationsEnabled ? 'var(--accent-primary)' : 'var(--border-strong)' }}
            onClick={toggleAnimations}
            role="switch"
            aria-checked={animationsEnabled}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAnimations(); } }}
          >
            <div
              className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
              style={{
                background: 'white',
                left: animationsEnabled ? 'auto' : '2px',
                right: animationsEnabled ? '2px' : 'auto',
              }}
            />
          </div>
          <span className="font-system text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {animationsEnabled ? 'Animations enabled' : 'Animations disabled'}
          </span>
        </label>
      </div>
    </div>
  );
}

const NOTIFICATION_TOGGLES = [
  { key: 'task-completions', label: 'Task completions', defaultValue: true },
  { key: 'agent-status-changes', label: 'Agent status changes', defaultValue: true },
  { key: 'output-ready', label: 'Output ready for review', defaultValue: true },
  { key: 'directive-updates', label: 'Directive updates', defaultValue: true },
  { key: 'system-alerts', label: 'System alerts', defaultValue: true },
  { key: 'sound', label: 'Notification sounds', defaultValue: false, icon: true },
];

function useNotifToggle(key, defaultValue) {
  const storageKey = `hive-notif-${key}`;
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return defaultValue;
    return stored === 'true';
  });
  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }, [storageKey]);
  return [enabled, toggle];
}

function NotifToggleRow({ toggleKey, label, defaultValue, isSound }) {
  const [enabled, toggle] = useNotifToggle(toggleKey, defaultValue);
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <div className="flex items-center gap-2">
        {isSound && (
          enabled
            ? <Volume2 size={12} style={{ color: 'var(--accent-primary)' }} />
            : <VolumeX size={12} style={{ color: 'var(--text-muted)' }} />
        )}
        <span className="font-system text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <div
        className="w-8 h-4 rounded-full relative transition-colors"
        style={{ background: enabled ? 'var(--accent-primary)' : 'var(--border-strong)' }}
        onClick={toggle}
        role="switch"
        aria-checked={enabled}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
      >
        <div
          className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
          style={{
            background: 'white',
            left: enabled ? 'auto' : '2px',
            right: enabled ? '2px' : 'auto',
          }}
        />
      </div>
    </label>
  );
}

function NotificationsSection() {
  return (
    <div className="animate-in">
      <h2 className="font-display text-[14px] font-bold tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
        NOTIFICATIONS
      </h2>

      {/* Notification types */}
      <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>ALERT TYPES</h3>
        <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {NOTIFICATION_TOGGLES.filter(t => !t.icon).map(t => (
            <NotifToggleRow
              key={t.key}
              toggleKey={t.key}
              label={t.label}
              defaultValue={t.defaultValue}
              isSound={false}
            />
          ))}
        </div>
      </div>

      {/* Sound toggle */}
      <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>SOUND</h3>
        {NOTIFICATION_TOGGLES.filter(t => t.icon).map(t => (
          <NotifToggleRow
            key={t.key}
            toggleKey={t.key}
            label={t.label}
            defaultValue={t.defaultValue}
            isSound={true}
          />
        ))}
      </div>
    </div>
  );
}

function SecuritySection() {
  const configured = isAirtableConfigured();
  const [teamKeys, setTeamKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hive-team-keys') || '{}'); } catch { return {}; }
  });
  const [editingKey, setEditingKey] = useState(null);
  const [keyInput, setKeyInput] = useState('');

  const accessLogs = [
    { location: 'Cape Town, ZA', time: '2026-03-29 08:14:22 UTC' },
    { location: 'Cape Town, ZA', time: '2026-03-28 19:41:07 UTC' },
    { location: 'Cape Town, ZA', time: '2026-03-27 07:55:33 UTC' },
  ];

  const teamKeySlots = [
    { id: 'airtable', label: 'Airtable PAT', prefix: 'pat', color: '#18BFFF', code: 'AT' },
    { id: 'anthropic', label: 'Anthropic API Key', prefix: 'sk-ant', color: '#D4A574', code: 'CL' },
    { id: 'openai', label: 'OpenAI API Key', prefix: 'sk-', color: '#74AA9C', code: 'OA' },
    { id: 'ollama_url', label: 'Ollama URL', prefix: 'http', color: '#FFFFFF', code: 'OL' },
  ];

  const handleSaveKey = (slotId) => {
    const updated = { ...teamKeys, [slotId]: keyInput };
    setTeamKeys(updated);
    localStorage.setItem('hive-team-keys', JSON.stringify(updated));
    setEditingKey(null);
    setKeyInput('');
  };

  const handleClearKey = (slotId) => {
    const updated = { ...teamKeys };
    delete updated[slotId];
    setTeamKeys(updated);
    localStorage.setItem('hive-team-keys', JSON.stringify(updated));
  };

  const maskKey = (key) => {
    if (!key) return '';
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  };

  return (
    <div className="animate-in">
      <h2 className="font-display text-[14px] font-bold tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
        SECURITY
      </h2>

      {/* Security Notice Banner */}
      <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
        <div className="flex items-start gap-3">
          <Shield size={16} style={{ color: '#00FF88', flexShrink: 0, marginTop: 2 }} />
          <div>
            <span className="font-system text-[10px] font-bold tracking-wider block mb-1" style={{ color: '#00FF88' }}>
              API KEY ISOLATION ACTIVE
            </span>
            <p className="font-system text-[9px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              Owner API keys are stored server-side and never exposed to the browser. Team members connect their own keys below — keys are stored locally in your browser only and never sent to other users.
            </p>
          </div>
        </div>
      </div>

      {/* Session info */}
      <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>CURRENT SESSION</h3>
        <div className="flex flex-col gap-2">
          {[
            { icon: User, label: 'USER', value: 'Jacques Botes (COMMANDER)', valueColor: 'var(--tier-commander)' },
            { icon: Shield, label: 'ROLE', value: 'Owner — Full Access', valueColor: '#FFB800' },
            { icon: Clock, label: 'SESSION', value: `Active since ${new Date().toLocaleDateString('en-ZA')}`, valueColor: 'var(--accent-primary)' },
            { icon: Key, label: 'AUTH', value: 'Token-based (Server Proxy)', valueColor: 'var(--text-tertiary)' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--bg-surface)' }}>
              <div className="flex items-center gap-2">
                <row.icon size={11} style={{ color: 'var(--text-muted)' }} />
                <span className="font-system text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
              </div>
              <span className="font-system text-[10px] font-semibold" style={{ color: row.valueColor }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team Member API Keys — connect your own */}
      <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>YOUR API KEYS</h3>
        <p className="font-system text-[8px] mb-3" style={{ color: 'var(--text-disabled)' }}>
          Connect your own API keys. These are stored in YOUR browser only — not visible to the owner or other team members.
        </p>
        <div className="flex flex-col gap-2">
          {teamKeySlots.map(slot => {
            const hasKey = !!teamKeys[slot.id];
            const isEditing = editingKey === slot.id;

            return (
              <div key={slot.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: `${slot.color}12`, border: `1px solid ${slot.color}25` }}>
                      <span className="font-system text-[8px] font-bold" style={{ color: slot.color }}>{slot.code}</span>
                    </div>
                    <div>
                      <span className="font-system text-[10px] font-semibold block" style={{ color: 'var(--text-primary)' }}>{slot.label}</span>
                      <span className="font-system text-[8px] tracking-wider" style={{ color: hasKey ? '#00FF88' : 'var(--text-muted)' }}>
                        {hasKey ? maskKey(teamKeys[slot.id]) : 'NOT SET'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasKey && (
                      <GlowButton variant="danger" size="sm" onClick={() => handleClearKey(slot.id)}>
                        CLEAR
                      </GlowButton>
                    )}
                    <GlowButton variant="amber" size="sm" onClick={() => { setEditingKey(isEditing ? null : slot.id); setKeyInput(''); }}>
                      {isEditing ? 'CANCEL' : hasKey ? 'UPDATE' : 'SET KEY'}
                    </GlowButton>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="password"
                      className="flex-1 font-system text-[10px] outline-none px-3 py-1.5 rounded"
                      placeholder={`Paste your ${slot.label}...`}
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      autoFocus
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                    />
                    <GlowButton variant="primary" size="sm" onClick={() => handleSaveKey(slot.id)} disabled={!keyInput.trim()}>
                      SAVE
                    </GlowButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Server-side API Status (owner only) */}
      <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>SERVER API STATUS</h3>
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(24,191,255,0.08)', border: '1px solid rgba(24,191,255,0.2)' }}>
              <span className="font-system text-[9px] font-bold" style={{ color: '#18BFFF' }}>AT</span>
            </div>
            <div>
              <span className="font-system text-[11px] font-semibold block" style={{ color: 'var(--text-primary)' }}>Airtable (Server-side)</span>
              <span className="font-system text-[8px] tracking-wider" style={{ color: configured ? '#00FF88' : 'var(--text-muted)' }}>
                {configured ? 'CONNECTED — KEY HIDDEN' : 'NOT CONFIGURED'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {configured && (
              <span className="font-system text-[9px] flex items-center gap-1" style={{ color: '#00FF88' }}>
                <Shield size={9} /> SECURE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Access Log */}
      <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>ACCESS LOG</h3>
        <div className="flex flex-col gap-2">
          {accessLogs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded" style={{ background: 'var(--bg-surface)' }}>
              <LogIn size={11} style={{ color: 'var(--accent-primary)' }} />
              <span className="font-system text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Login from {log.location}
              </span>
              <span className="font-system text-[9px] ml-auto" style={{ color: 'var(--text-disabled)' }}>
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIAssistantSection() {
  // Only check boolean existence — never store actual key values in component state
  const hasOllama = hasOllamaEnv;
  const hasClaude = hasAnthropicEnv;
  const hasOpenAI = hasOpenAIEnv;
  const ollamaModel = import.meta.env.VITE_OLLAMA_MODEL || 'Not set';

  // Determine active provider
  let activeProvider = 'None configured';
  let activeType = 'N/A';
  let activeColor = 'var(--text-muted)';
  let activeModel = 'N/A';

  if (hasOllama) {
    activeProvider = 'Ollama';
    activeType = 'LOCAL';
    activeColor = '#00FF88';
    activeModel = ollamaModel;
  } else if (hasClaude) {
    activeProvider = 'Claude (Anthropic)';
    activeType = 'CLOUD';
    activeColor = '#D4A574';
    activeModel = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  } else if (hasOpenAI) {
    activeProvider = 'OpenAI';
    activeType = 'CLOUD';
    activeColor = '#74AA9C';
    activeModel = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';
  }

  const providers = [
    { name: 'Ollama (Local)', configured: hasOllama, type: 'LOCAL', color: '#FFFFFF', icon: Cpu },
    { name: 'Claude API', configured: hasClaude, type: 'CLOUD', color: '#D4A574', icon: Bot },
    { name: 'OpenAI', configured: hasOpenAI, type: 'CLOUD', color: '#74AA9C', icon: Zap },
  ];

  return (
    <div className="animate-in">
      <h2 className="font-display text-[14px] font-bold tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
        AI ASSISTANT
      </h2>

      {/* Active model card */}
      <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>ACTIVE MODEL</h3>
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bot size={14} style={{ color: activeColor }} />
              <span className="font-system text-[11px] font-bold" style={{ color: activeColor }}>
                {activeProvider}
              </span>
            </div>
            <span className="font-system text-[8px] tracking-wider px-2 py-0.5 rounded"
              style={{
                background: activeType === 'LOCAL' ? 'rgba(0,255,136,0.1)' : activeType === 'CLOUD' ? 'rgba(212,165,116,0.1)' : 'rgba(107,114,128,0.1)',
                color: activeType === 'LOCAL' ? '#00FF88' : activeType === 'CLOUD' ? '#D4A574' : 'var(--text-muted)',
                border: `1px solid ${activeType === 'LOCAL' ? 'rgba(0,255,136,0.2)' : activeType === 'CLOUD' ? 'rgba(212,165,116,0.2)' : 'rgba(107,114,128,0.2)'}`,
              }}>
              {activeType}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-system text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>MODEL</span>
            <span className="font-system text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{activeModel}</span>
          </div>
        </div>
      </div>

      {/* Provider status */}
      <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-system text-[10px] tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>AVAILABLE PROVIDERS</h3>
        <div className="flex flex-col gap-2">
          {providers.map(p => (
            <div key={p.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: `${p.color}12`, border: `1px solid ${p.color}25` }}>
                  <p.icon size={14} style={{ color: p.color }} />
                </div>
                <div>
                  <span className="font-system text-[11px] font-semibold block" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  <span className="font-system text-[8px] tracking-wider" style={{ color: p.configured ? '#00FF88' : 'var(--text-muted)' }}>
                    {p.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-system text-[8px] px-1.5 py-0.5 rounded tracking-wider"
                  style={{
                    background: p.type === 'LOCAL' ? 'rgba(0,255,136,0.08)' : 'rgba(0,212,255,0.08)',
                    color: p.type === 'LOCAL' ? '#00FF88' : '#00D4FF',
                  }}>
                  {p.type}
                </span>
                {p.configured ? (
                  <CheckCircle size={12} style={{ color: '#00FF88' }} />
                ) : (
                  <XCircle size={12} style={{ color: 'var(--text-disabled)' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Config hint */}
      {!hasOllama && !hasClaude && !hasOpenAI && (
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}>
          <p className="font-system text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            No AI provider configured. Add one of the following to your <code className="font-system text-[9px] px-1 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: '#FFB800' }}>.env</code> file:
          </p>
          <pre className="font-system text-[9px] mt-2 p-2 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)', whiteSpace: 'pre-wrap' }}>
            VITE_OLLAMA_URL=http://localhost:11434{'\n'}VITE_ANTHROPIC_API_KEY=sk-ant-...{'\n'}VITE_OPENAI_API_KEY=sk-...
          </pre>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('integrations');

  const sections = [
    { id: 'integrations', label: 'INTEGRATIONS', icon: Link2 },
    { id: 'ai-assistant', label: 'AI ASSISTANT', icon: Bot },
    { id: 'notifications', label: 'NOTIFICATIONS', icon: Bell },
    { id: 'display', label: 'DISPLAY', icon: Palette },
    { id: 'database', label: 'DATABASE', icon: Database },
    { id: 'security', label: 'SECURITY', icon: Shield },
  ];

  const { source, lastSync } = useDataSource();
  const integrations = useMemo(() => getIntegrations(), []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings size={20} style={{ color: 'var(--text-muted)' }} />
        <h1 className="font-display text-[18px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
          SETTINGS
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Section nav */}
        <div className="w-44 flex-shrink-0">
          <div className="flex flex-col gap-1">
            {sections.map(s => (
              <button
                key={s.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left cursor-pointer w-full hover:bg-[var(--bg-hover)]"
                style={{
                  background: activeSection === s.id ? 'var(--bg-surface)' : 'transparent',
                  border: 'none',
                  borderLeft: activeSection === s.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                }}
                onClick={() => setActiveSection(s.id)}
              >
                <s.icon size={13} style={{ color: activeSection === s.id ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                <span className="font-system text-[10px] font-semibold tracking-wider"
                  style={{ color: activeSection === s.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'integrations' && (
            <div className="animate-in">
              <h2 className="font-display text-[14px] font-bold tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
                TOOL INTEGRATIONS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {integrations.map((int, i) => {
                  const st = STATUS_STYLE[int.status];
                  return (
                    <div
                      key={int.name}
                      className="flex items-center gap-3 p-3 rounded-lg animate-in"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: `${int.color}12`, border: `1px solid ${int.color}25` }}>
                        <span className="font-system text-[9px] font-bold" style={{ color: int.color }}>
                          {int.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-system text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {int.name}
                          </span>
                          {int.note && (
                            <span className="font-system text-[7px] tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.15)' }}>
                              {int.note}
                            </span>
                          )}
                        </div>
                        <span className="font-system text-[8px] tracking-wider" style={{ color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      {int.status === 'disconnected' ? (
                        <span
                          title="Add this tool's credentials to your .env file — see SETUP.md"
                          className="font-system text-[8px] tracking-wider px-2 py-1 rounded"
                          style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                        >
                          VIA .ENV
                        </span>
                      ) : int.status === 'pending' ? (
                        <span
                          title="Configuration in progress"
                          className="font-system text-[8px] tracking-wider px-2 py-1 rounded"
                          style={{ color: '#FFB800', border: '1px solid rgba(255,184,0,0.25)', background: 'rgba(255,184,0,0.06)' }}
                        >
                          PENDING
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full" style={{ background: '#00FF88', boxShadow: '0 0 6px rgba(0,255,136,0.5)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'ai-assistant' && (
            <AIAssistantSection />
          )}

          {activeSection === 'display' && (
            <DisplaySection />
          )}

          {activeSection === 'database' && (
            <DatabaseSection />
          )}

          {activeSection === 'notifications' && (
            <NotificationsSection />
          )}

          {activeSection === 'security' && (
            <SecuritySection />
          )}
        </div>
      </div>
    </div>
  );
}
