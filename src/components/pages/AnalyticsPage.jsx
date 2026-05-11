import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Activity, Settings as SettingsIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { VENTURES, STATUSES } from '../../data/constants';
import useAgentStore from '../../store/agentStore';

const GOAL_KEY = 'hive-cashflow-goal';

function loadGoal() {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveGoal(goal) {
  try { localStorage.setItem(GOAL_KEY, JSON.stringify(goal)); } catch {}
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsPage() {
  const agents = useAgentStore(s => s.agents);
  const tasks = useAgentStore(s => s.tasks);
  const [chartsReady, setChartsReady] = useState(false);
  const [goal, setGoal] = useState(() => loadGoal());
  const [editingGoal, setEditingGoal] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Derive weekly task volume from real tasks (last 7 days, by completion date)
  const taskData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return { date: d, day: DAY_LABELS[d.getDay()], tasks: 0, completed: 0 };
    });
    (tasks || []).forEach(t => {
      const startedAt = t.startedAt || t.createdAt;
      const completedAt = t.completedAt;
      if (startedAt) {
        const sd = new Date(startedAt);
        const bucket = week.find(w => w.date.toDateString() === sd.toDateString());
        if (bucket) bucket.tasks++;
      }
      if (completedAt) {
        const cd = new Date(completedAt);
        const bucket = week.find(w => w.date.toDateString() === cd.toDateString());
        if (bucket) bucket.completed++;
      }
    });
    return week.map(({ day, tasks, completed }) => ({ day, tasks, completed }));
  }, [tasks]);

  const tasksToday = taskData[6]?.tasks ?? 0;

  const statusData = useMemo(() => {
    return Object.entries(STATUSES).map(([key, s]) => ({
      name: s.label,
      value: agents.filter(a => a.status === key).length,
      color: s.color,
    })).filter(d => d.value > 0);
  }, [agents]);

  // Tasks per venture (last 30 days) — replaces the old hardcoded revenue mock
  const ventureTaskData = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400_000;
    const counts = {};
    (tasks || []).forEach(t => {
      const v = t.venture || 'cross';
      const ts = new Date(t.completedAt || t.startedAt || t.createdAt || 0).getTime();
      if (ts >= cutoff) counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(VENTURES).filter(([k]) => k !== 'cross').map(([key, v]) => ({
      name: v.short,
      tasks: counts[key] || 0,
      color: v.color,
    }));
  }, [tasks]);

  // Cashflow goal — user-configurable, defaults to null
  const pct = goal ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const dayPct = goal?.daysTotal ? Math.round((goal.daysElapsed / goal.daysTotal) * 100) : 0;

  function handleSaveGoal(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const next = {
      current: Number(fd.get('current')) || 0,
      target: Number(fd.get('target')) || 0,
      daysElapsed: Number(fd.get('daysElapsed')) || 0,
      daysTotal: Number(fd.get('daysTotal')) || 90,
    };
    saveGoal(next);
    setGoal(next);
    setEditingGoal(false);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={20} style={{ color: 'var(--accent-info)' }} />
        <h1 className="font-display text-[18px] font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
          ANALYTICS
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'TOTAL AGENTS', value: agents.length, icon: Activity, color: '#00FF88' },
          { label: 'ACTIVE NOW', value: agents.filter(a => a.status === 'active').length, icon: TrendingUp, color: '#00FF88' },
          { label: 'TASKS TODAY', value: tasksToday, icon: BarChart3, color: '#00D4FF' },
          { label: goal ? `${goal.daysTotal}-DAY TARGET` : 'CASHFLOW TARGET', value: goal ? `${pct}%` : '—', icon: Target, color: !goal ? '#6B7280' : pct >= dayPct ? '#00FF88' : '#FFB800' },
        ].map((kpi) => (
          <div key={kpi.label} className="animate-in p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-system text-[8px] tracking-widest" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
              <kpi.icon size={14} style={{ color: kpi.color }} />
            </div>
            <div className="font-display text-[24px] font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="animate-in p-5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[12px] font-bold tracking-wider" style={{ color: 'var(--accent-warning)' }}>
              {goal ? `${goal.daysTotal}-DAY CASHFLOW TARGET` : 'CASHFLOW TARGET'}
            </h3>
            <button onClick={() => setEditingGoal(v => !v)} className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <SettingsIcon size={11} /> {goal ? 'Edit' : 'Set goal'}
            </button>
          </div>

          {editingGoal ? (
            <form onSubmit={handleSaveGoal} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="font-system text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  Current ($)
                  <input name="current" type="number" defaultValue={goal?.current ?? 0} className="w-full mt-1 px-2 py-1 rounded font-system text-[12px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
                </label>
                <label className="font-system text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  Target ($)
                  <input name="target" type="number" defaultValue={goal?.target ?? 0} className="w-full mt-1 px-2 py-1 rounded font-system text-[12px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
                </label>
                <label className="font-system text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  Days elapsed
                  <input name="daysElapsed" type="number" defaultValue={goal?.daysElapsed ?? 0} className="w-full mt-1 px-2 py-1 rounded font-system text-[12px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
                </label>
                <label className="font-system text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  Days total
                  <input name="daysTotal" type="number" defaultValue={goal?.daysTotal ?? 90} className="w-full mt-1 px-2 py-1 rounded font-system text-[12px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
                </label>
              </div>
              <button type="submit" className="font-system text-[10px] px-3 py-1 rounded" style={{ background: '#00FF88', color: '#000' }}>Save</button>
            </form>
          ) : goal ? (
            <>
              <div className="flex items-end gap-2 mb-2">
                <span className="font-display text-[28px] font-bold" style={{ color: 'var(--text-primary)' }}>${goal.current.toLocaleString()}</span>
                <span className="font-system text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>/ ${goal.target.toLocaleString()}</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-surface)' }}>
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #FFB800, #00FF88)' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, ease: [0.43, 0.13, 0.23, 0.96], delay: 0.5 }} />
              </div>
              <div className="flex justify-between">
                <span className="font-system text-[9px]" style={{ color: 'var(--text-muted)' }}>Day {goal.daysElapsed} of {goal.daysTotal}</span>
                <span className="font-system text-[9px]" style={{ color: pct >= dayPct ? '#00FF88' : '#FFB800' }}>{pct >= dayPct ? 'ON TRACK' : 'BEHIND PACE'}</span>
              </div>
            </>
          ) : (
            <p className="font-system text-[11px]" style={{ color: 'var(--text-muted)' }}>
              No goal set. Click "Set goal" to define a current/target/duration. Values are stored locally in your browser.
            </p>
          )}
        </div>

        <div className="animate-in p-5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="font-display text-[12px] font-bold tracking-wider mb-4" style={{ color: 'var(--accent-secondary)' }}>
            AGENT STATUS DISTRIBUTION
          </h3>
          <div className="h-48">
            {chartsReady && statusData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => (<Cell key={i} fill={entry.color} stroke="transparent" />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono' }} labelStyle={{ color: '#9CA3AF' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {statusData.length === 0 && (
              <div className="flex items-center justify-center h-full font-system text-[11px]" style={{ color: 'var(--text-muted)' }}>No agents loaded yet.</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="font-system text-[8px]" style={{ color: 'var(--text-muted)' }}>{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="animate-in p-5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="font-display text-[12px] font-bold tracking-wider mb-4" style={{ color: 'var(--accent-primary)' }}>
            TASK VOLUME — LAST 7 DAYS
          </h3>
          <div className="h-48">
            {chartsReady && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskData} barGap={2}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Bar dataKey="tasks" fill="#00D4FF40" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="completed" fill="#00FF88" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-1">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#00D4FF40' }} /><span className="font-system text-[8px]" style={{ color: 'var(--text-muted)' }}>STARTED</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#00FF88' }} /><span className="font-system text-[8px]" style={{ color: 'var(--text-muted)' }}>COMPLETED</span></div>
          </div>
        </div>

        <div className="animate-in p-5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="font-display text-[12px] font-bold tracking-wider mb-4" style={{ color: 'var(--accent-info)' }}>
            TASKS PER VENTURE — LAST 30 DAYS
          </h3>
          <div className="h-48">
            {chartsReady && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventureTaskData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Bar dataKey="tasks" radius={[3, 3, 0, 0]}>
                    {ventureTaskData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
