import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid3x3, Building2, Zap, FileText, BarChart3, Settings, Bell, Crown, Binary, Cloud, HardDrive, Building, Hexagon, Info, X } from 'lucide-react';
import SearchInput from '../atoms/SearchInput';
import MatrixRain from '../atoms/MatrixRain';
import useAgentStore from '../../store/agentStore';
import { useStatusCounts, useDataSource, useNotifications } from '../../store/agentStore';
import { STATUSES, NAV_ITEMS } from '../../data/constants';
import useAirtableSync from '../../hooks/useAirtableSync';
import NotificationPanel from '../organisms/NotificationPanel';
import CommandBar from '../organisms/CommandBar';
import useCommandBar from '../../hooks/useCommandBar';

const ICONS = { Grid3x3, Building2, Zap, FileText, BarChart3, Settings, Building, Crown };

// Navigation sourced from constants.js — single source of truth
const NAV = NAV_ITEMS;

const DEMO_BANNER_KEY = 'hive-demo-banner-dismissed';

export default function DashboardShell() {
  const [matrixOn, setMatrixOn] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(() => {
    try { return !!localStorage.getItem(DEMO_BANNER_KEY); } catch { return false; }
  });
  const searchQuery = useAgentStore(s => s.searchQuery);
  const setSearch = useAgentStore(s => s.setSearch);
  const counts = useStatusCounts();
  const { source, lastSync } = useDataSource();
  const { unreadCount } = useNotifications();
  const commandBar = useCommandBar();

  // Start Airtable sync on mount
  useAirtableSync();

  // DEMO MODE: when no Airtable is configured AND no template is loaded,
  // we're running on the local seed only — make this visible so visitors
  // know they're in a sandbox, not a live system.
  const isDemoMode = source !== 'airtable' && source !== 'template';
  const showDemoBanner = isDemoMode && !demoBannerDismissed;

  const dismissDemoBanner = () => {
    try { localStorage.setItem(DEMO_BANNER_KEY, '1'); } catch {}
    setDemoBannerDismissed(true);
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-void)' }}>
      {showDemoBanner && (
        <div
          className="flex items-center justify-between gap-3 px-5 py-2 flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, rgba(255,184,0,0.12), rgba(0,212,255,0.10))',
            borderBottom: '1px solid rgba(255,184,0,0.30)',
            color: '#FFB800',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Info size={12} className="flex-shrink-0" />
            <span className="font-system text-[10px] tracking-wider font-semibold">DEMO MODE</span>
            <span className="font-system text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
              You're seeing generic seed data — no Airtable backend. Fork the repo + add your own .env to run with your real swarm.
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href="https://github.com/Anubisseth/hive-command#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="font-system text-[10px] tracking-wider font-semibold no-underline px-2 py-1 rounded"
              style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.30)' }}
            >
              SETUP →
            </a>
            <button
              onClick={dismissDemoBanner}
              className="cursor-pointer p-1"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
              aria-label="Dismiss demo banner"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ boxShadow: ['0 0 10px rgba(255,184,0,0.2)', '0 0 20px rgba(255,184,0,0.4)', '0 0 10px rgba(255,184,0,0.2)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)' }}
            >
              <Hexagon size={16} style={{ color: '#FFB800', fill: 'rgba(255,184,0,0.15)' }} />
            </motion.div>
            <h1 className="font-display text-[16px] font-black tracking-[0.1em]" style={{ color: '#FFB800' }}>
              HIVE COMMAND
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-52 hidden md:block">
            <SearchInput value={searchQuery} onChange={setSearch} />
          </div>
          {/* Matrix Rain Toggle */}
          <motion.button
            className="p-2 rounded-lg cursor-pointer"
            style={{
              background: matrixOn ? 'rgba(0,255,136,0.1)' : 'var(--bg-surface)',
              border: `1px solid ${matrixOn ? 'rgba(0,255,136,0.3)' : 'var(--border-subtle)'}`,
            }}
            whileHover={{ borderColor: matrixOn ? 'rgba(0,255,136,0.5)' : 'var(--border-strong)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMatrixOn(v => !v)}
            title={matrixOn ? 'Disable Matrix Rain' : 'Enable Matrix Rain'}
          >
            <Binary size={14} style={{ color: matrixOn ? '#00FF88' : 'var(--text-tertiary)' }} />
          </motion.button>
          <motion.button
            className="relative p-2 rounded-lg cursor-pointer"
            style={{
              background: showNotifications ? 'rgba(0,212,255,0.1)' : 'var(--bg-surface)',
              border: `1px solid ${showNotifications ? 'rgba(0,212,255,0.3)' : 'var(--border-subtle)'}`,
            }}
            whileHover={{ borderColor: showNotifications ? 'rgba(0,212,255,0.5)' : 'var(--border-strong)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(v => !v)}
            title="Notifications"
          >
            <Bell size={14} style={{ color: showNotifications ? '#00D4FF' : 'var(--text-tertiary)' }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{ background: '#FF3344', color: 'white' }}
              >
                {unreadCount}
              </span>
            )}
          </motion.button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)' }}
          >
            <Crown size={14} style={{ color: '#FFB800' }} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav
          className="hidden md:flex flex-col w-48 flex-shrink-0 py-4 px-3 gap-1"
          style={{ background: 'var(--bg-primary)', borderRight: '1px solid var(--border-subtle)' }}
        >
          {NAV.map(item => {
            const Icon = ICONS[item.icon];
            return (
              <NavLink key={item.path} to={item.path} className="no-underline">
                {({ isActive }) => (
                  <motion.div
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: isActive ? 'var(--bg-surface)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    }}
                    whileHover={{ background: 'var(--bg-hover)' }}
                  >
                    <Icon size={14} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                    <span
                      className="font-system text-[10px] font-semibold tracking-[0.12em]"
                      style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto relative grid-bg-tactical">
          {matrixOn && <MatrixRain color="#00FF88" opacity={0.12} />}
          <div className="relative z-10 p-5">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Status ribbon */}
      <footer
        className="flex items-center gap-4 px-5 py-2 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)' }}
      >
        {Object.entries(STATUSES).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
            <span className="font-system text-[9px] font-semibold" style={{ color: s.color }}>
              {counts[key] || 0}
            </span>
            <span className="font-system text-[8px] tracking-wider hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3">
          {/* Data source indicator */}
          <div className="flex items-center gap-1.5">
            {source === 'airtable' ? (
              <Cloud size={10} style={{ color: '#00FF88' }} />
            ) : (
              <HardDrive size={10} style={{ color: 'var(--text-muted)' }} />
            )}
            <span className="font-system text-[8px] tracking-wider" style={{ color: source === 'airtable' ? '#00FF88' : 'var(--text-muted)' }}>
              {source === 'airtable' ? 'LIVE' : 'LOCAL'}
            </span>
            {lastSync && (
              <span className="font-system text-[7px]" style={{ color: 'var(--text-disabled)' }}>
                {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
          <span className="font-system text-[8px] tracking-wider" style={{ color: 'var(--text-disabled)' }}>
            HIVE COMMAND v1.0
          </span>
        </div>
      </footer>

      {/* Notification Panel */}
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Command Bar (⌘K) */}
      <CommandBar isOpen={commandBar.isOpen} onClose={commandBar.close} />

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden flex items-center justify-around py-2 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)' }}
      >
        {NAV.slice(0, 5).map(item => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink key={item.path} to={item.path} className="no-underline">
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5 px-2">
                  <Icon size={18} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  <span className="font-system text-[7px] tracking-wider" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {item.label}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
