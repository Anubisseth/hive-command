// === HIVE COMMAND — Commander Loop Hook ===
// Bridges CommanderLoop engine ↔ Zustand stores ↔ Airtable

import { useEffect, useCallback, useRef } from 'react';
import { commanderLoop } from '../lib/commanderLoop';
import { useCommanderLoopStore } from '../store/commanderLoopStore';
import useAgentStore from '../store/agentStore';

export function useCommanderLoop() {
  const agents = useAgentStore(s => s.agents);
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  const mountedRef = useRef(true);

  // Access stores via getState() to avoid subscribing to entire store
  const store = useCallback(() => useCommanderLoopStore.getState(), []);
  const agentActions = useCallback(() => useAgentStore.getState(), []);

  // Subscribe to loop events
  useEffect(() => {
    mountedRef.current = true;
    const unsubs = [];

    unsubs.push(commanderLoop.on('stateChange', (state) => {
      if (!mountedRef.current) return;
      store().setLoopState(state);
    }));

    unsubs.push(commanderLoop.on('phaseChange', (phase) => {
      if (!mountedRef.current) return;
      store().setCurrentPhase(phase);
    }));

    unsubs.push(commanderLoop.on('iterationStart', (iteration) => {
      if (!mountedRef.current) return;
      store().setIteration(iteration);
      store().resetIteration();
    }));

    unsubs.push(commanderLoop.on('log', (entry) => {
      if (!mountedRef.current) return;
      store().addLog(entry);
    }));

    unsubs.push(commanderLoop.on('tasksCreated', (tasks) => {
      if (!mountedRef.current) return;
      store().setTasks(tasks);
    }));

    unsubs.push(commanderLoop.on('taskDistributed', (task) => {
      if (!mountedRef.current) return;
      const taskRecord = {
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: task.title,
        description: task.description,
        agentId: task.agentId,
        status: 'queued',
        progress: 0,
        venture: task.venture || null,
      };
      agentActions().addTask(taskRecord);

      if (task.agentId) {
        agentActions().updateAgentStatus(task.agentId, 'active');
        // Bind the task to the agent so it shows everywhere (3D bubble, grid card, graph node).
        agentActions().updateAgentTask(task.agentId, {
          description: task.title || task.description,
          progress: 0,
        });
        // Push a notification — fixes the previously-empty bell icon.
        agentActions().addNotification({
          id: `n_${Date.now()}_${task.agentId}`,
          type: 'directive_received',
          message: `${task.agentName || task.agentId} received: ${task.title}`,
          agentId: task.agentId,
          time: new Date().toISOString(),
          read: false,
        });
      }

      import('../lib/airtable').then(({ createTask, logActivity }) => {
        createTask(taskRecord).catch(() => {});
        logActivity({
          event: `Task assigned: ${task.title} → ${task.agentName || task.agentId}`,
          agentId: task.agentId,
          eventType: 'task_started',
          venture: task.venture,
        }).catch(() => {});
      }).catch(() => {});
    }));

    unsubs.push(commanderLoop.on('agentExecuting', ({ agentId, taskIndex, total }) => {
      if (!mountedRef.current) return;
      store().setExecutingAgent(agentId, taskIndex + 1, total);
      // Bump task progress to ~50% so the UI shows "in progress" while the LLM call runs.
      const agent = agentsRef.current.find(a => a.id === agentId);
      if (agent?.task) {
        agentActions().updateAgentTask(agentId, { ...agent.task, progress: 50 });
      }
    }));

    unsubs.push(commanderLoop.on('agentComplete', ({ agentId }) => {
      if (!mountedRef.current) return;
      store().clearExecutingAgent();
      agentActions().updateAgentStatus(agentId, 'reviewing');
      const agent = agentsRef.current.find(a => a.id === agentId);
      if (agent?.task) {
        agentActions().updateAgentTask(agentId, { ...agent.task, progress: 100 });
      }
      agentActions().addNotification({
        id: `n_${Date.now()}_${agentId}`,
        type: 'task_completed',
        message: `${agent?.name || agentId} completed the task`,
        agentId,
        time: new Date().toISOString(),
        read: false,
      });
      // Clear the task ~3s later so the grid card stops showing the stale description.
      setTimeout(() => {
        if (mountedRef.current) {
          const stillSameAgent = agentsRef.current.find(a => a.id === agentId);
          if (stillSameAgent?.task) {
            agentActions().updateAgentTask(agentId, null);
          }
          agentActions().updateAgentStatus(agentId, 'idle');
        }
      }, 3000);
    }));

    unsubs.push(commanderLoop.on('agentError', ({ agentId, error }) => {
      if (!mountedRef.current) return;
      store().clearExecutingAgent();
      agentActions().updateAgentStatus(agentId, 'blocked');
      const agent = agentsRef.current.find(a => a.id === agentId);
      agentActions().addNotification({
        id: `n_${Date.now()}_${agentId}`,
        type: 'error',
        message: `${agent?.name || agentId} failed: ${error || 'unknown error'}`,
        agentId,
        time: new Date().toISOString(),
        read: false,
      });
    }));

    unsubs.push(commanderLoop.on('outputsCollected', (outputs) => {
      if (!mountedRef.current) return;
      store().setOutputs(outputs);

      for (const output of outputs) {
        const outputRecord = {
          id: `o_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: `${output.agentName}: ${output.taskTitle}`,
          type: 'document',
          agentId: output.agentId,
          status: 'pending_review',
          content: output.content,
          venture: null,
        };
        agentActions().addOutput(outputRecord);
        agentActions().addNotification({
          id: `n_${Date.now()}_${output.agentId}_out`,
          type: 'output_ready',
          message: `Output ready for review: "${output.taskTitle}"`,
          agentId: output.agentId,
          time: new Date().toISOString(),
          read: false,
        });

        import('../lib/airtable').then(({ createOutput, logActivity }) => {
          createOutput(outputRecord).catch(() => {});
          logActivity({
            event: `Output created: ${output.taskTitle}`,
            agentId: output.agentId,
            eventType: 'output_created',
          }).catch(() => {});
        }).catch(() => {});
      }
    }));

    unsubs.push(commanderLoop.on('reviewComplete', (review) => {
      if (!mountedRef.current) return;
      store().setReview(review);
    }));

    unsubs.push(commanderLoop.on('iterationComplete', (entry) => {
      if (!mountedRef.current) return;
      store().pushIterationHistory(entry);

      import('../lib/airtable').then(({ logActivity }) => {
        logActivity({
          event: `Iteration ${entry.iteration} complete — Score: ${entry.review?.overallScore}/10`,
          agentId: 'cmd',
          eventType: 'system',
          details: entry.review?.overallFeedback,
        }).catch(() => {});
      }).catch(() => {});
    }));

    unsubs.push(commanderLoop.on('complete', () => {
      if (!mountedRef.current) return;
      store().clearExecutingAgent();
    }));

    const handleBeforeUnload = (e) => {
      if (commanderLoop.state === 'RUNNING' || commanderLoop.state === 'PAUSED') {
        e.preventDefault();
        e.returnValue = 'Commander Loop is running. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mountedRef.current = false;
      unsubs.forEach(unsub => unsub());
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [store, agentActions]);

  const start = useCallback((directive, options = {}) => {
    const s = store();
    s.resetLoop();
    s.setCurrentDirective(directive);
    s.setLoopState('RUNNING');
    s.setMaxIterations(options.maxIterations || 10);

    const directiveRecord = {
      id: `d_${Date.now()}`,
      title: directive.title,
      description: directive.description,
      status: 'active',
      priority: directive.priority || 'medium',
      issuedBy: 'cmd',
      targetAgents: [],
      venture: directive.venture || null,
      createdAt: new Date().toISOString(),
    };
    agentActions().addDirective(directiveRecord);

    import('../lib/airtable').then(({ createDirective, logActivity }) => {
      createDirective(directiveRecord).catch(() => {});
      logActivity({
        event: `Commander Loop started: ${directive.title}`,
        agentId: 'cmd',
        eventType: 'directive_issued',
        venture: directive.venture,
      }).catch(() => {});
    }).catch(() => {});

    commanderLoop.start(directive, agentsRef.current, {
      maxIterations: options.maxIterations || s.maxIterations,
      delayBetweenCalls: options.delayBetweenCalls || s.delayBetweenCalls,
    });
  }, [store, agentActions]);

  const pause = useCallback(() => commanderLoop.pause(), []);
  const resume = useCallback(() => commanderLoop.resume(), []);
  const stop = useCallback(() => commanderLoop.stop(), []);

  return { start, pause, resume, stop };
}
