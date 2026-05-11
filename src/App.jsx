// =============================================
// HIVE COMMAND — App Router
// Root routing configuration with lazy-loaded pages
// =============================================

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardShell from './components/templates/DashboardShell';
import ErrorBoundary from './components/atoms/ErrorBoundary';
import LoadingState from './components/atoms/LoadingState';

// Lazy-load pages for code splitting (~40% bundle reduction)
const SwarmPage = lazy(() => import('./components/pages/SwarmPage'));
const VenturesPage = lazy(() => import('./components/pages/VenturesPage'));
const DirectivesPage = lazy(() => import('./components/pages/DirectivesPage'));
const OutputsPage = lazy(() => import('./components/pages/OutputsPage'));
const AnalyticsPage = lazy(() => import('./components/pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./components/pages/SettingsPage'));
const OfficePage = lazy(() => import('./components/pages/OfficePage'));
const CommanderPage = lazy(() => import('./components/pages/CommanderPage'));

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <span className="font-display text-[48px] font-black tracking-wider" style={{ color: 'var(--accent-warning)', opacity: 0.3 }}>404</span>
      <p className="font-display text-[14px] font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>SECTOR NOT FOUND</p>
      <p className="font-system text-[10px]" style={{ color: 'var(--text-disabled)' }}>The requested module does not exist in this command center.</p>
      <a href="/swarm" className="font-system text-[10px] px-4 py-2 rounded-lg no-underline" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00FF88' }}>
        RETURN TO SWARM
      </a>
    </div>
  );
}

function PageSuspense({ children }) {
  return (
    <Suspense fallback={<LoadingState message="LOADING MODULE..." size="lg" />}>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary fullPage>
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardShell />}>
            <Route index element={<Navigate to="/swarm" replace />} />
            <Route path="/swarm" element={<PageSuspense><SwarmPage /></PageSuspense>} />
            <Route path="/ventures" element={<PageSuspense><VenturesPage /></PageSuspense>} />
            <Route path="/directives" element={<PageSuspense><DirectivesPage /></PageSuspense>} />
            <Route path="/outputs" element={<PageSuspense><OutputsPage /></PageSuspense>} />
            <Route path="/analytics" element={<PageSuspense><AnalyticsPage /></PageSuspense>} />
            <Route path="/settings" element={<PageSuspense><SettingsPage /></PageSuspense>} />
            <Route path="/commander" element={<PageSuspense><CommanderPage /></PageSuspense>} />
            <Route path="/office" element={<PageSuspense><OfficePage /></PageSuspense>} />
            <Route path="/venture/:id" element={<PageSuspense><VenturesPage /></PageSuspense>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
