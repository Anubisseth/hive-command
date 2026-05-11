import { useMemo, useCallback, useState, useEffect } from 'react';
import { Crown, Briefcase, Settings, Bot, Cpu } from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TIERS, STATUSES, TOOL_COLORS } from '../../data/constants';
import { MODEL_CATALOG, TIER_COLORS as MODEL_TIER_COLORS } from '../../lib/aiPricing';
import useAgentStore, { useFilteredAgents } from '../../store/agentStore';

/* ═══════════════════════════════════════════════════
   Custom Agent Node
   ═══════════════════════════════════════════════════ */
function AgentNode({ data }) {
  const tier = TIERS[data.tier] || TIERS[3];
  const status = STATUSES[data.status] || STATUSES.offline;

  return (
    <div
      className="rounded-sm cursor-grab active:cursor-grabbing"
      style={{
        background: 'linear-gradient(160deg, rgba(40, 32, 18, 0.95) 0%, rgba(28, 22, 12, 0.92) 100%)',
        border: `1.5px solid ${tier.border}`,
        padding: data.tier === 0 ? '16px 20px' : '12px 14px',
        minWidth: data.tier === 0 ? 280 : data.tier === 1 ? 220 : 190,
        maxWidth: data.tier === 0 ? 340 : data.tier === 1 ? 260 : 220,
        boxShadow: `0 0 3px ${tier.color}30, 0 6px 28px rgba(0,0,0,0.7)`,
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Incoming handle */}
      {data.tier > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: tier.color,
            border: 'none',
            width: 6,
            height: 6,
            boxShadow: `0 0 6px ${tier.color}60`,
          }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {/* Status dot */}
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: status.color,
              boxShadow: data.status === 'active' ? `0 0 6px ${status.color}80` : 'none',
            }}
          />
          {/* Tier label */}
          <span
            className="font-system text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded"
            style={{
              color: tier.color,
              background: `${tier.color}18`,
              border: `1px solid ${tier.color}30`,
            }}
          >
            {tier.label}
          </span>
        </div>
        {/* Status indicator */}
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: status.color,
            boxShadow: data.status === 'active' ? `0 0 4px ${status.color}` : 'none',
          }}
        />
      </div>

      {/* Agent icon + name */}
      <div className="flex items-center gap-2 mb-1">
        {data.tier === 0 && <Crown size={16} strokeWidth={2.5} style={{ color: tier.color }} />}
        {data.tier === 1 && (
          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-sm" style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
            <Briefcase size={12} strokeWidth={2.5} style={{ color: tier.color }} />
          </div>
        )}
        {data.tier === 2 && (
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-sm" style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
            <Settings size={10} strokeWidth={2.5} style={{ color: tier.color }} />
          </div>
        )}
        {data.tier === 3 && (
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-sm" style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
            <Bot size={10} strokeWidth={2.5} style={{ color: tier.color }} />
          </div>
        )}
        <h3
          className="font-body font-black uppercase tracking-wider truncate"
          style={{
            color: tier.color,
            fontSize: data.tier === 0 ? '14px' : data.tier === 1 ? '11px' : '10px',
          }}
        >
          {data.label}
        </h3>
      </div>

      {/* Mandate */}
      <p
        className="font-body text-[9px] leading-snug mb-2 line-clamp-2"
        style={{ color: 'rgba(209,213,219,0.8)' }}
      >
        {data.mandate}
      </p>

      {/* Task progress */}
      {data.task && (
        <div className="mb-2">
          <p className="font-system text-[7px] mb-0.5 truncate" style={{ color: 'rgba(209,213,219,0.6)' }}>
            {data.task.description}
          </p>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${data.task.progress}%`,
                background: 'linear-gradient(90deg, #00FF88, #00D4FF)',
                boxShadow: '0 0 4px rgba(0,255,136,0.4)',
              }}
            />
          </div>
        </div>
      )}

      {/* Model badge (if assigned) */}
      {data.model && MODEL_CATALOG[data.model] && (
        <div
          className="flex items-center gap-1 mb-1.5 px-1.5 py-0.5 rounded font-system text-[7px] font-semibold tracking-wider w-fit"
          style={{
            background: `${MODEL_TIER_COLORS[MODEL_CATALOG[data.model].tier]}18`,
            border: `1px solid ${MODEL_TIER_COLORS[MODEL_CATALOG[data.model].tier]}40`,
            color: MODEL_TIER_COLORS[MODEL_CATALOG[data.model].tier],
          }}
          title={`${MODEL_CATALOG[data.model].label} · $${MODEL_CATALOG[data.model].input}/$${MODEL_CATALOG[data.model].output} per M tokens`}
        >
          <Cpu size={7} />
          {MODEL_CATALOG[data.model].label.toUpperCase()}
        </div>
      )}

      {/* Tool squares */}
      <div className="flex gap-1 flex-wrap">
        {data.tools.slice(0, 5).map(tool => {
          const color = TOOL_COLORS[tool] || '#9CA3AF';
          return (
            <span
              key={tool}
              className="w-5 h-5 rounded flex items-center justify-center font-system text-[6px] font-bold"
              style={{
                background: `${color}30`,
                border: `1px solid ${color}50`,
                color: '#F9FAFB',
              }}
              title={tool}
            >
              {tool.slice(0, 2).toUpperCase()}
            </span>
          );
        })}
      </div>

      {/* Outgoing handle */}
      {data.tier < 3 && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: tier.color,
            border: 'none',
            width: 6,
            height: 6,
            boxShadow: `0 0 6px ${tier.color}60`,
          }}
        />
      )}
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

/* ═══════════════════════════════════════════════════
   Layout Helper — auto-position by tier
   ═══════════════════════════════════════════════════ */
function buildNodesAndEdges(agents) {
  const tierGroups = { 0: [], 1: [], 2: [], 3: [] };
  agents.forEach(a => {
    if (tierGroups[a.tier]) tierGroups[a.tier].push(a);
  });

  const nodes = [];
  const edges = [];

  const TIER_Y = { 0: 0, 1: 200, 2: 440, 3: 680 };
  const X_SPACING = { 0: 360, 1: 300, 2: 260, 3: 240 };

  Object.entries(tierGroups).forEach(([tier, group]) => {
    const t = Number(tier);
    const totalWidth = group.length * X_SPACING[t];
    const startX = -totalWidth / 2 + X_SPACING[t] / 2;

    group.forEach((agent, i) => {
      nodes.push({
        id: agent.id,
        type: 'agentNode',
        position: { x: startX + i * X_SPACING[t], y: TIER_Y[t] },
        data: {
          label: agent.name,
          tier: agent.tier,
          status: agent.status,
          mandate: agent.mandate,
          tools: agent.tools,
          task: agent.task,
          model: agent.model,
        },
      });

      // Edge to parent
      if (agent.parent) {
        const parentTier = TIERS[t - 1];
        edges.push({
          id: `e-${agent.parent}-${agent.id}`,
          source: agent.parent,
          target: agent.id,
          type: 'smoothstep',
          animated: agent.status === 'active',
          style: {
            stroke: parentTier ? parentTier.color : '#FFB800',
            strokeWidth: 1.5,
            strokeOpacity: 0.4,
          },
        });
      }
    });
  });

  return { nodes, edges };
}

/* ═══════════════════════════════════════════════════
   Main Canvas Component
   ═══════════════════════════════════════════════════ */
export default function AgentCanvas() {
  const filteredAgents = useFilteredAgents();
  const selectAgent = useAgentStore(s => s.selectAgent);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildNodesAndEdges(filteredAgents),
    [filteredAgents]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes/edges when agent data changes (e.g. Airtable sync)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_, node) => {
    selectAgent(node.id);
  }, [selectAgent]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>

      {/* Access Live Agents Top Banner */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
        <div 
          className="flex items-center gap-2.5 px-6 py-2 rounded-sm shadow-[0_0_30px_rgba(0,255,136,0.3)] backdrop-blur-md"
          style={{ background: 'rgba(5, 45, 25, 0.85)', border: '1.5px solid rgba(0,255,136,0.4)', color: '#00FF88' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] animate-pulse"></span>
          <span className="font-display font-bold tracking-widest text-[11px] uppercase pt-0.5">ACCESS LIVE AGENTS</span>
          <span className="font-bold text-[14px]">➔</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          variant="lines"
          gap={32}
          size={1}
          color="rgba(140, 120, 180, 0.04)"
        />
        <Controls
          showInteractive={false}
          style={{
            background: 'rgba(30, 25, 18, 0.9)',
            border: '1px solid rgba(255, 150, 30, 0.25)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            const tier = TIERS[node.data?.tier] || TIERS[3];
            return tier.color;
          }}
          maskColor="rgba(10, 10, 14, 0.85)"
          style={{
            background: 'rgba(20, 18, 12, 0.9)',
            border: '1px solid rgba(255, 150, 30, 0.2)',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
}
