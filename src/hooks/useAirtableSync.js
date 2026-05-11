// =============================================
// HIVE COMMAND — Airtable Sync Hook
// Polls all 5 tables with exponential backoff
// Falls back to local data if no API key
// =============================================

import { useEffect, useRef, useCallback } from 'react';
import useAgentStore from '../store/agentStore';
import {
  fetchAgents,
  fetchDirectives,
  fetchTasks,
  fetchOutputs,
  fetchActivityLog,
  isAirtableConfigured,
} from '../lib/airtable';

const BASE_INTERVAL = 30_000;  // 30 seconds normal polling
const MAX_INTERVAL = 120_000;  // 2 minutes max backoff
const MAX_RETRIES = 5;         // stop retrying after 5 consecutive failures

export default function useAirtableSync() {
  const setAgents = useAgentStore(s => s.setAgents);
  const setDirectives = useAgentStore(s => s.setDirectives);
  const setTasks = useAgentStore(s => s.setTasks);
  const setOutputs = useAgentStore(s => s.setOutputs);
  const setActivityLog = useAgentStore(s => s.setActivityLog);
  const setDataSource = useAgentStore(s => s.setDataSource);
  const setLoading = useAgentStore(s => s.setLoading);
  const setLastSync = useAgentStore(s => s.setLastSync);
  const timeoutRef = useRef(null);
  const failCountRef = useRef(0);
  const mountedRef = useRef(true);

  const scheduleNext = useCallback((delay) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) sync();
    }, delay);
  }, []); // sync added below via hoisting

  const sync = useCallback(async () => {
    if (!isAirtableConfigured()) {
      setDataSource('local');
      setLoading(false);
      return;
    }

    try {
      // Fetch all tables in parallel for speed
      const [agents, directives, tasks, outputs, activity] = await Promise.all([
        fetchAgents().catch(err => { console.error('[Sync] Agents fetch failed:', err); return null; }),
        fetchDirectives().catch(err => { console.error('[Sync] Directives fetch failed:', err); return null; }),
        fetchTasks().catch(err => { console.error('[Sync] Tasks fetch failed:', err); return null; }),
        fetchOutputs().catch(err => { console.error('[Sync] Outputs fetch failed:', err); return null; }),
        fetchActivityLog(100).catch(err => { console.error('[Sync] Activity fetch failed:', err); return null; }),
      ]);

      if (!mountedRef.current) return;

      // Honor active-template flag: if a template is loaded, don't overwrite agents
      let templateActive = false;
      try { templateActive = !!localStorage.getItem('hive-active-template'); } catch {}

      // Update each store slice if data was returned
      if (agents && agents.length > 0 && !templateActive) {
        setAgents(agents);
        setDataSource('airtable');
      }
      if (directives) setDirectives(directives);
      if (tasks) setTasks(tasks);
      if (outputs) setOutputs(outputs);
      if (activity) setActivityLog(activity);

      setLastSync(new Date());
      failCountRef.current = 0;
      scheduleNext(BASE_INTERVAL);
    } catch (err) {
      if (!mountedRef.current) return;
      failCountRef.current++;
      console.error(`[Sync] Attempt ${failCountRef.current} failed:`, err.message);

      if (failCountRef.current >= MAX_RETRIES) {
        console.warn('[Sync] Max retries reached — falling back to local data');
        setDataSource('local');
      } else {
        const delay = Math.min(BASE_INTERVAL * Math.pow(2, failCountRef.current - 1), MAX_INTERVAL);
        console.warn(`[Sync] Retrying in ${delay / 1000}s`);
        scheduleNext(delay);
      }
    } finally {
      setLoading(false);
    }
  }, [setAgents, setDirectives, setTasks, setOutputs, setActivityLog, setDataSource, setLoading, setLastSync, scheduleNext]);

  useEffect(() => {
    mountedRef.current = true;
    sync(); // initial fetch

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sync]);

  // Manual sync trigger for UI
  const manualSync = useCallback(() => {
    failCountRef.current = 0;
    setLoading(true);
    sync();
  }, [sync, setLoading]);

  return { sync: manualSync, isConfigured: isAirtableConfigured() };
}
