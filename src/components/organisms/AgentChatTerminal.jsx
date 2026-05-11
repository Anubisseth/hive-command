// === HIVE COMMAND — Agent Chat Terminal ===
// Terminal-style chat interface for direct agent communication
// Supports direct messaging + CEO delegation to swarm

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, ChevronDown, Bot, User, Hexagon, X, Loader, ArrowRight } from 'lucide-react';
import useAgentStore from '../../store/agentStore';
import { TIERS, VENTURES } from '../../data/constants';
import { createDirective, createTask, logActivity, isAirtableConfigured } from '../../lib/airtable';
import { chat as ollamaChat, isOllamaAvailable } from '../../lib/ollama';

// Terminal colors matching hive theme
const ROLE_COLORS = {
  user: '#FFB800',
  agent: '#00FF88',
  system: '#00D4FF',
  error: '#FF3344',
  delegation: '#8B5CF6',
};

function AgentChatTerminal({ agent, onClose, isOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [delegateMode, setDelegateMode] = useState(false);
  const [delegateTarget, setDelegateTarget] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const agents = useAgentStore(s => s.agents);
  const addDirective = useAgentStore(s => s.addDirective);
  const addTask = useAgentStore(s => s.addTask);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Welcome message on agent change
  useEffect(() => {
    if (agent) {
      const tier = TIERS[agent.tier]?.label || 'Agent';
      const isCommander = agent.tier === 0;
      setMessages([{
        id: 'welcome',
        role: 'system',
        content: `Connected to ${agent.name} [${tier}]${agent.venture ? ` — ${VENTURES[agent.venture]?.name || agent.venture}` : ''}
${agent.mandate ? `Mission: ${agent.mandate}` : ''}
${isCommander ? '\n[COMMANDER MODE] You can delegate tasks to any agent. Use /delegate <agent_id> <instruction> or toggle delegate mode.' : ''}
${agent.task ? `\nCurrent task: ${agent.task.description} (${agent.task.progress}%)` : '\nNo active task.'}`,
        time: new Date(),
      }]);
      setDelegateMode(false);
      setDelegateTarget('');
    }
  }, [agent?.id]);

  // Get subordinate agents for delegation
  const subordinates = agent ? agents.filter(a => a.parent === agent.id) : [];
  const allAgents = agents.filter(a => a.id !== agent?.id);
  const delegatable = agent?.tier === 0 ? allAgents : subordinates;

  const addMessage = useCallback((role, content, extra = {}) => {
    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
      time: new Date(),
      ...extra,
    }]);
  }, []);

  // Handle delegation command
  const handleDelegation = useCallback(async (targetId, instruction) => {
    const target = agents.find(a => a.id === targetId || a.name.toLowerCase() === targetId.toLowerCase());
    if (!target) {
      addMessage('error', `Agent "${targetId}" not found. Available: ${delegatable.map(a => a.id).join(', ')}`);
      return;
    }

    addMessage('delegation', `Delegating to ${target.name}: "${instruction}"`);
    setLoading(true);

    try {
      // Create directive in Airtable
      const directive = {
        title: `[${agent.name}] → ${target.name}: ${instruction.slice(0, 60)}`,
        description: instruction,
        status: 'active',
        priority: 'medium',
        issuedBy: agent.id,
        targetAgents: [target.id],
        venture: target.venture || agent.venture || '',
      };

      // Add to local store
      const localDir = {
        id: `d_${Date.now()}`,
        ...directive,
        createdAt: new Date().toISOString(),
      };
      addDirective(localDir);

      // Create task for the target agent
      const task = {
        title: instruction.slice(0, 100),
        description: instruction,
        agentId: target.id,
        status: 'queued',
        progress: 0,
        venture: target.venture || '',
      };
      addTask({ id: `t_${Date.now()}`, ...task, startedAt: new Date().toISOString() });

      // Sync to Airtable
      if (isAirtableConfigured()) {
        createDirective(directive).catch(err => console.error('[Chat] Directive sync failed:', err));
        createTask(task).catch(err => console.error('[Chat] Task sync failed:', err));
        logActivity({
          event: `${agent.name} delegated to ${target.name}: ${instruction.slice(0, 80)}`,
          agentId: agent.id,
          eventType: 'directive_issued',
          venture: target.venture || '',
          details: `Delegated via chat terminal. Target: ${target.name} (${target.id})`,
        }).catch(() => {});
      }

      addMessage('agent', `Directive deployed to ${target.name}. Task queued and ready for execution.`);
    } catch (err) {
      addMessage('error', `Delegation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [agent, agents, delegatable, addDirective, addTask, addMessage]);

  // Handle direct instruction to current agent
  const handleInstruction = useCallback(async (instruction) => {
    setLoading(true);
    try {
      // Create task for this agent
      const task = {
        title: instruction.slice(0, 100),
        description: instruction,
        agentId: agent.id,
        status: 'queued',
        progress: 0,
        venture: agent.venture || '',
      };
      addTask({ id: `t_${Date.now()}`, ...task, startedAt: new Date().toISOString() });

      if (isAirtableConfigured()) {
        createTask(task).catch(err => console.error('[Chat] Task sync failed:', err));
        logActivity({
          event: `Instruction to ${agent.name}: ${instruction.slice(0, 80)}`,
          agentId: agent.id,
          eventType: 'task_started',
          venture: agent.venture || '',
          details: `Via chat terminal: ${instruction}`,
        }).catch(() => {});
      }

      // Try to get AI response via Ollama
      let aiResponse = null;
      const ollamaOk = await isOllamaAvailable();
      if (ollamaOk) {
        try {
          aiResponse = await ollamaChat([
            { role: 'system', content: `You are ${agent.name}, a ${TIERS[agent.tier]?.label || 'Agent'} in the HIVE COMMAND AI swarm. Your mandate: ${agent.mandate || 'Execute tasks efficiently'}. Respond in character — brief, tactical, professional. Acknowledge the instruction and describe how you'll execute it.` },
            { role: 'user', content: instruction },
          ], { temperature: 0.6 });
        } catch {
          aiResponse = null;
        }
      }

      if (aiResponse) {
        addMessage('agent', aiResponse);
      } else {
        addMessage('agent', `Acknowledged. Task queued: "${instruction.slice(0, 80)}${instruction.length > 80 ? '...' : ''}". Standing by for execution.`);
      }
    } catch (err) {
      addMessage('error', `Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [agent, addTask, addMessage]);

  // Handle send
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    addMessage('user', text);

    // Check for /delegate command
    const delegateMatch = text.match(/^\/delegate\s+(\S+)\s+(.+)$/i);
    if (delegateMatch) {
      handleDelegation(delegateMatch[1], delegateMatch[2]);
      return;
    }

    // Check for /status command
    if (text.toLowerCase() === '/status') {
      const statusSummary = agents
        .filter(a => a.venture === agent.venture || agent.tier === 0)
        .map(a => `  ${a.id}: ${a.name} [${a.status}]${a.task ? ` — ${a.task.description.slice(0, 40)}` : ''}`)
        .join('\n');
      addMessage('system', `Swarm status:\n${statusSummary}`);
      return;
    }

    // Check for /help command
    if (text.toLowerCase() === '/help') {
      addMessage('system', `Commands:
  /delegate <agent_id> <instruction> — Delegate task to another agent
  /status — Show swarm status
  /help — Show this help
  Or type any instruction to assign to ${agent.name}`);
      return;
    }

    // Delegate mode: send to selected target
    if (delegateMode && delegateTarget) {
      handleDelegation(delegateTarget, text);
      return;
    }

    // Direct instruction to current agent
    handleInstruction(text);
  }, [input, loading, agent, agents, delegateMode, delegateTarget, addMessage, handleDelegation, handleInstruction]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!agent) return null;

  const isCommander = agent.tier === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            maxHeight: '420px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Terminal Header */}
          <div
            className="flex items-center justify-between px-3 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-2">
              <Terminal size={12} style={{ color: ROLE_COLORS.agent }} />
              <span className="font-system text-[10px] font-bold tracking-wider" style={{ color: ROLE_COLORS.agent }}>
                {agent.name}
              </span>
              <span className="font-system text-[8px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
                TERMINAL
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Delegate Mode Toggle (Commander only or agents with subordinates) */}
              {(isCommander || subordinates.length > 0) && (
                <motion.button
                  className="font-system text-[8px] font-bold tracking-wider px-2 py-0.5 rounded cursor-pointer"
                  style={{
                    background: delegateMode ? 'rgba(139,92,246,0.15)' : 'transparent',
                    border: `1px solid ${delegateMode ? '#8B5CF660' : 'var(--border-subtle)'}`,
                    color: delegateMode ? '#8B5CF6' : 'var(--text-muted)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setDelegateMode(!delegateMode);
                    if (!delegateMode && delegatable.length > 0) {
                      setDelegateTarget(delegatable[0].id);
                    }
                  }}
                >
                  <ArrowRight size={8} className="inline mr-0.5" /> DELEGATE
                </motion.button>
              )}
              <motion.button
                className="cursor-pointer"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
                whileHover={{ color: 'var(--text-primary)' }}
                onClick={onClose}
              >
                <X size={12} />
              </motion.button>
            </div>
          </div>

          {/* Delegate Target Selector */}
          <AnimatePresence>
            {delegateMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 overflow-hidden flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(139,92,246,0.05)' }}
              >
                <span className="font-system text-[8px] tracking-wider" style={{ color: '#8B5CF6' }}>TARGET:</span>
                <select
                  value={delegateTarget}
                  onChange={e => setDelegateTarget(e.target.value)}
                  className="font-system text-[10px] px-2 py-0.5 rounded outline-none cursor-pointer flex-1"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {delegatable.map(a => (
                    <option key={a.id} value={a.id}>
                      {TIERS[a.tier]?.label}: {a.name} [{a.status}]
                    </option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-2"
            style={{ minHeight: '180px', maxHeight: '280px', scrollbarWidth: 'thin' }}
          >
            {messages.map(msg => (
              <div key={msg.id} className="mb-2">
                <div className="flex items-start gap-1.5">
                  {/* Role icon */}
                  {msg.role === 'user' && <User size={10} style={{ color: ROLE_COLORS.user, marginTop: 2, flexShrink: 0 }} />}
                  {msg.role === 'agent' && <Bot size={10} style={{ color: ROLE_COLORS.agent, marginTop: 2, flexShrink: 0 }} />}
                  {msg.role === 'system' && <Hexagon size={10} style={{ color: ROLE_COLORS.system, marginTop: 2, flexShrink: 0 }} />}
                  {msg.role === 'error' && <X size={10} style={{ color: ROLE_COLORS.error, marginTop: 2, flexShrink: 0 }} />}
                  {msg.role === 'delegation' && <ArrowRight size={10} style={{ color: ROLE_COLORS.delegation, marginTop: 2, flexShrink: 0 }} />}

                  <div className="flex-1 min-w-0">
                    <span
                      className="font-system text-[10px] leading-relaxed whitespace-pre-wrap break-words"
                      style={{ color: ROLE_COLORS[msg.role] || 'var(--text-secondary)' }}
                    >
                      {msg.content}
                    </span>
                    <span className="font-system text-[7px] ml-2" style={{ color: 'var(--text-disabled)' }}>
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-1.5 mb-2">
                <Loader size={10} className="animate-spin" style={{ color: ROLE_COLORS.agent }} />
                <span className="font-system text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Processing...
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div
            className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
          >
            <span className="font-system text-[10px] font-bold flex-shrink-0" style={{ color: delegateMode ? '#8B5CF6' : '#FFB800' }}>
              {delegateMode ? `[→${delegateTarget}]$` : `[${agent.id}]$`}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={delegateMode ? `Instruction for ${delegatable.find(a => a.id === delegateTarget)?.name || 'agent'}...` : `Message ${agent.name}...`}
              disabled={loading}
              className="flex-1 font-system text-[11px] outline-none"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                caretColor: delegateMode ? '#8B5CF6' : '#FFB800',
              }}
            />
            <motion.button
              className="cursor-pointer flex-shrink-0"
              style={{
                background: 'none',
                border: 'none',
                color: input.trim() ? (delegateMode ? '#8B5CF6' : '#FFB800') : 'var(--text-disabled)',
              }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send size={12} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AgentChatTerminal;
