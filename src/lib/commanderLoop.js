// === HIVE COMMAND — Commander Loop Engine ===
// Autonomous swarm orchestration loop: Decompose → Distribute → Execute → Collect → Review → Iterate

import { callLLM, extractJSON } from './llmClient';
import {
  decomposeSystemPrompt, decomposeUserPrompt,
  executeSystemPrompt, executeUserPrompt,
  reviewSystemPrompt, reviewUserPrompt,
} from './commanderPrompts';

const PHASES = ['decompose', 'distribute', 'execute', 'collect', 'review'];

class CommanderLoop {
  constructor() {
    this.state = 'IDLE'; // IDLE | RUNNING | PAUSED | STOPPED
    this.abortController = null;
    this.iteration = 0;
    this.maxIterations = 10;
    this.delayMs = 2000;
    this._pausePromise = null;
    this._pauseResolve = null;
    this._listeners = {};
  }

  // ─── Event System ────────────────────────────────

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => { this._listeners[event] = this._listeners[event].filter(f => f !== fn); };
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(fn => {
      try { fn(data); } catch (e) { console.error(`[Loop] Event handler error:`, e); }
    });
  }

  // ─── Controls ────────────────────────────────────

  async start(directive, agents, options = {}) {
    if (this.state === 'RUNNING') throw new Error('Loop already running');

    this.state = 'RUNNING';
    this.iteration = 0;
    this.maxIterations = options.maxIterations || 10;
    this.delayMs = options.delayBetweenCalls || 2000;
    this.abortController = new AbortController();

    this._emit('stateChange', 'RUNNING');
    this._emit('log', { message: `Commander Loop started — "${directive.title}"`, type: 'system' });

    let currentDirective = { ...directive };

    try {
      while (this.iteration < this.maxIterations && this.state !== 'STOPPED') {
        // Check for pause
        if (this.state === 'PAUSED') {
          this._emit('log', { message: 'Loop paused. Waiting for resume...', type: 'system' });
          await this._waitForResume();
          if (this.state === 'STOPPED') break;
          this._emit('log', { message: 'Loop resumed.', type: 'system' });
        }

        this.iteration++;
        this._emit('iterationStart', this.iteration);
        this._emit('log', { message: `═══ Iteration ${this.iteration}/${this.maxIterations} ═══`, type: 'system' });

        // Phase 1: DECOMPOSE
        this._emit('phaseChange', 'decompose');
        this._emit('log', { message: 'HIVE PRIME decomposing directive...', type: 'info' });
        const tasks = await this._decompose(currentDirective, agents);
        if (this._shouldStop()) break;
        this._emit('log', { message: `Decomposed into ${tasks.length} sub-tasks`, type: 'success' });
        this._emit('tasksCreated', tasks);

        // Phase 2: DISTRIBUTE
        this._emit('phaseChange', 'distribute');
        this._emit('log', { message: 'Distributing tasks to agents...', type: 'info' });
        await this._distribute(tasks, currentDirective);
        if (this._shouldStop()) break;
        this._emit('log', { message: 'Tasks distributed to swarm', type: 'success' });

        // Phase 3: EXECUTE
        this._emit('phaseChange', 'execute');
        const outputs = [];
        for (let i = 0; i < tasks.length; i++) {
          if (this._shouldStop()) break;
          if (this.state === 'PAUSED') {
            await this._waitForResume();
            if (this._shouldStop()) break;
          }

          const task = tasks[i];
          const agent = agents.find(a => a.id === task.agentId);
          if (!agent) {
            this._emit('log', { message: `Agent ${task.agentId} not found, skipping task`, type: 'error' });
            continue;
          }

          this._emit('agentExecuting', { agentId: agent.id, taskIndex: i, total: tasks.length });
          this._emit('log', { message: `${agent.name} executing: "${task.title}"`, type: 'info' });

          try {
            const output = await this._executeAgent(agent, task, currentDirective);
            outputs.push({
              agentId: agent.id,
              agentName: agent.name,
              taskTitle: task.title,
              taskDescription: task.description,
              content: output,
            });
            this._emit('agentComplete', { agentId: agent.id, taskIndex: i, output });
            this._emit('log', { message: `${agent.name} delivered output (${output.length} chars)`, type: 'success' });
          } catch (err) {
            this._emit('agentError', { agentId: agent.id, error: err.message });
            this._emit('log', { message: `${agent.name} failed: ${err.message}`, type: 'error' });
          }

          // Rate limit delay between agents
          if (i < tasks.length - 1) {
            await this._delay(this.delayMs);
          }
        }

        if (this._shouldStop()) break;

        // Phase 4: COLLECT
        this._emit('phaseChange', 'collect');
        this._emit('log', { message: `Collected ${outputs.length} outputs from swarm`, type: 'info' });
        this._emit('outputsCollected', outputs);

        if (outputs.length === 0) {
          this._emit('log', { message: 'No outputs produced. Stopping loop.', type: 'error' });
          break;
        }

        // Phase 5: REVIEW
        this._emit('phaseChange', 'review');
        this._emit('log', { message: 'HIVE PRIME reviewing outputs...', type: 'info' });
        const review = await this._review(currentDirective, outputs);
        if (this._shouldStop()) break;

        this._emit('reviewComplete', review);
        this._emit('log', {
          message: `Review: ${review.overallScore}/10 — ${review.directiveComplete ? 'DIRECTIVE COMPLETE' : 'Needs iteration'}`,
          type: review.directiveComplete ? 'success' : 'info',
        });

        // Log individual reviews
        for (const r of review.reviews || []) {
          this._emit('log', {
            message: `  ${r.agentId}: ${r.verdict.toUpperCase()} (${r.score}/10) — ${r.feedback}`,
            type: r.verdict === 'approve' ? 'success' : r.verdict === 'revise' ? 'info' : 'error',
          });
        }

        this._emit('iterationComplete', {
          iteration: this.iteration,
          tasks,
          outputs,
          review,
        });

        // Decision: continue or stop?
        if (review.directiveComplete) {
          this._emit('log', { message: 'Commander satisfied. Directive complete.', type: 'success' });
          break;
        }

        // Compose next iteration directive from review feedback
        if (review.newSubTasks && review.newSubTasks.length > 0) {
          currentDirective = {
            ...directive,
            title: `[Iter ${this.iteration + 1}] ${directive.title}`,
            description: `${review.overallFeedback}\n\nImprovements needed:\n${review.newSubTasks.map(t => `- ${t.title}: ${t.description}`).join('\n')}`,
          };
          this._emit('log', { message: `Issuing ${review.newSubTasks.length} new sub-tasks for next iteration`, type: 'system' });
        } else {
          this._emit('log', { message: 'No new sub-tasks. Loop complete.', type: 'success' });
          break;
        }

        await this._delay(this.delayMs);
      }

      if (this.iteration >= this.maxIterations) {
        this._emit('log', { message: `Max iterations (${this.maxIterations}) reached. Stopping.`, type: 'system' });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        this._emit('log', { message: `Loop error: ${err.message}`, type: 'error' });
        this._emit('error', err);
      }
    } finally {
      const finalState = this.state === 'STOPPED' ? 'STOPPED' : 'IDLE';
      this.state = 'IDLE';
      this._emit('stateChange', 'IDLE');
      this._emit('log', {
        message: `Loop ended after ${this.iteration} iteration(s). Final state: ${finalState}`,
        type: 'system',
      });
      this._emit('complete', { iterations: this.iteration });
    }
  }

  pause() {
    if (this.state !== 'RUNNING') return;
    this.state = 'PAUSED';
    this._pausePromise = new Promise(resolve => { this._pauseResolve = resolve; });
    this._emit('stateChange', 'PAUSED');
  }

  resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'RUNNING';
    this._pauseResolve?.();
    this._emit('stateChange', 'RUNNING');
  }

  stop() {
    this.state = 'STOPPED';
    this.abortController?.abort();
    this._pauseResolve?.(); // Unblock if paused
    this._emit('stateChange', 'STOPPED');
    this._emit('log', { message: 'STOP signal received.', type: 'system' });
  }

  // ─── Internal Phases ─────────────────────────────

  async _decompose(directive, agents) {
    const { content } = await callLLM({
      system: decomposeSystemPrompt(),
      messages: [{ role: 'user', content: decomposeUserPrompt(directive, agents) }],
      options: { temperature: 0.5, maxTokens: 4096 },
      signal: this.abortController?.signal,
    });

    const tasks = extractJSON(content);
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('Commander failed to decompose directive into tasks');
    }
    return tasks;
  }

  async _distribute(tasks, directive) {
    // Emit distribution events — Airtable writes happen in the hook layer
    for (const task of tasks) {
      this._emit('taskDistributed', { ...task, directiveTitle: directive.title });
    }
  }

  async _executeAgent(agent, task, directive) {
    const { content } = await callLLM({
      system: executeSystemPrompt(agent),
      messages: [{ role: 'user', content: executeUserPrompt(task, directive) }],
      options: { temperature: 0.7, maxTokens: 4096 },
      signal: this.abortController?.signal,
    });

    return content;
  }

  async _review(directive, outputs) {
    const { content } = await callLLM({
      system: reviewSystemPrompt(),
      messages: [{ role: 'user', content: reviewUserPrompt(directive, outputs) }],
      options: { temperature: 0.4, maxTokens: 4096 },
      signal: this.abortController?.signal,
    });

    const review = extractJSON(content);
    if (!review || !review.reviews) {
      // Fallback: treat as complete if we can't parse review
      return {
        reviews: outputs.map(o => ({
          agentId: o.agentId,
          taskTitle: o.taskTitle,
          verdict: 'approve',
          score: 7,
          feedback: 'Review parse failed — auto-approved',
        })),
        directiveComplete: true,
        overallScore: 7,
        overallFeedback: 'Commander review could not be parsed. Outputs auto-approved.',
        newSubTasks: [],
      };
    }
    return review;
  }

  // ─── Helpers ─────────────────────────────────────

  _shouldStop() {
    return this.state === 'STOPPED' || this.abortController?.signal?.aborted;
  }

  async _waitForResume() {
    if (this._pausePromise) await this._pausePromise;
    this._pausePromise = null;
    this._pauseResolve = null;
  }

  _delay(ms) {
    return new Promise((resolve, reject) => {
      const signal = this.abortController?.signal;
      if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
  }
}

// Singleton
export const commanderLoop = new CommanderLoop();
