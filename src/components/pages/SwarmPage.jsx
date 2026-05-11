import { useState } from 'react';
import { LayoutGrid, Move3D } from 'lucide-react';
import StatusBar from '../molecules/StatusBar';
import FilterBar from '../molecules/FilterBar';
import AgentGrid from '../organisms/AgentGrid';
import AgentCanvas from '../organisms/AgentCanvas';
import AgentDetail from '../organisms/AgentDetail';
import TaskFeed from '../organisms/TaskFeed';

export default function SwarmPage() {
  const [view, setView] = useState('grid'); // 'grid' | 'canvas'

  return (
    <div className={view === 'canvas' ? '' : 'max-w-7xl mx-auto'}>
      {/* Status bar + view toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <StatusBar />
        </div>
        {/* View toggle */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(255, 150, 30, 0.25)', background: 'rgba(30, 25, 18, 0.6)' }}
        >
          <button
            onClick={() => setView('grid')}
            className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors"
            style={{
              background: view === 'grid' ? 'rgba(255, 150, 30, 0.2)' : 'transparent',
              border: 'none',
              borderRight: '1px solid rgba(255, 150, 30, 0.15)',
              color: view === 'grid' ? '#FFB800' : 'rgba(156,163,175,0.7)',
            }}
          >
            <LayoutGrid size={12} />
            <span className="font-system text-[8px] font-bold tracking-widest">GRID</span>
          </button>
          <button
            onClick={() => setView('canvas')}
            className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors"
            style={{
              background: view === 'canvas' ? 'rgba(255, 150, 30, 0.2)' : 'transparent',
              border: 'none',
              color: view === 'canvas' ? '#FFB800' : 'rgba(156,163,175,0.7)',
            }}
          >
            <Move3D size={12} />
            <span className="font-system text-[8px] font-bold tracking-widest">CANVAS</span>
          </button>
        </div>
      </div>

      {/* Filters — only show in grid mode */}
      {view === 'grid' && (
        <div className="mb-4">
          <FilterBar />
        </div>
      )}

      {/* Main content */}
      {view === 'grid' ? (
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <AgentGrid />
          </div>
          <div className="hidden lg:block w-72 flex-shrink-0">
            <TaskFeed />
          </div>
        </div>
      ) : (
        <AgentCanvas />
      )}

      {/* Agent detail slide-in panel */}
      <AgentDetail />
    </div>
  );
}
