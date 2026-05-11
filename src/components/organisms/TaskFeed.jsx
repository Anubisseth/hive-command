import { AnimatePresence } from 'framer-motion';
import TaskFeedItem from '../molecules/TaskFeedItem';
import useAgentStore, { useActiveTasks } from '../../store/agentStore';

export default function TaskFeed() {
  const tasks = useActiveTasks();
  const selectAgent = useAgentStore(s => s.selectAgent);

  if (tasks.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-[12px] font-bold tracking-wider" style={{ color: 'var(--accent-secondary)' }}>
          ACTIVE TASKS
        </h3>
        <span className="font-system text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {tasks.length} RUNNING
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <TaskFeedItem key={task.agentId} task={task} onClick={selectAgent} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
