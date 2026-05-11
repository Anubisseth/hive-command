// === HIVE COMMAND — Retro Office 3D Scene ===
// Main orchestrating component for the 3D office
// Reliable click detection with eventPrefix and raycaster sorting

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import OfficeFloor from '../3d/OfficeFloor';
import OfficeFurniture from '../3d/OfficeFurniture';
import AgentAvatar from '../3d/AgentAvatar';
import OfficeEnvironment from '../3d/OfficeEnvironment';
import CameraController from '../3d/CameraController';
import { assignDeskPositions, getWanderTarget } from '../../lib/pathfinding';
import useAgentStore from '../../store/agentStore';

/**
 * Agent tick system — manages agent movement and behaviors
 * Runs outside React render cycle for performance (claw3d pattern)
 */
function useAgentTick(agents, deskPositions) {
  const [agentStates, setAgentStates] = useState({});
  const tickRef = useRef(null);
  const statesRef = useRef({});

  // Initialize agent states
  useEffect(() => {
    const states = {};
    agents.forEach(agent => {
      const desk = deskPositions[agent.id];
      if (!desk) return;

      states[agent.id] = {
        position: [desk.x, 0, desk.z],
        targetPosition: [desk.x, 0, desk.z],
        behavior: agent.status === 'active' ? 'working' : 'idle',
        wanderTimer: 3 + Math.random() * 8,
        lastUpdate: Date.now(),
      };
    });
    statesRef.current = states;
    setAgentStates({ ...states });
  }, [agents.length]); // Only re-init when agent count changes

  // Tick loop — update behaviors
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      let changed = false;

      Object.entries(statesRef.current).forEach(([agentId, state]) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;
        const desk = deskPositions[agentId];
        if (!desk) return;

        const elapsed = (now - state.lastUpdate) / 1000;
        state.wanderTimer -= elapsed;
        state.lastUpdate = now;

        // Active agents occasionally wander to "collaborate"
        if (agent.status === 'active' && state.wanderTimer <= 0) {
          if (state.behavior === 'working') {
            // Go wander
            const target = getWanderTarget(desk, 2.5);
            state.targetPosition = [target.x, 0, target.z];
            state.behavior = 'wandering';
            state.wanderTimer = 2 + Math.random() * 3;
          } else {
            // Return to desk
            state.targetPosition = [desk.x, 0, desk.z];
            state.behavior = 'working';
            state.wanderTimer = 5 + Math.random() * 10;
          }
          changed = true;
        }

        // Idle agents stay at desk
        if (agent.status === 'idle') {
          state.targetPosition = [desk.x, 0, desk.z];
          state.behavior = 'idle';
        }

        // Blocked agents stay put with no movement
        if (agent.status === 'blocked') {
          state.targetPosition = [desk.x, 0, desk.z];
          state.behavior = 'blocked';
        }

        // Offline agents don't move
        if (agent.status === 'offline') {
          state.targetPosition = [desk.x, 0, desk.z];
          state.behavior = 'offline';
        }
      });

      if (changed) {
        setAgentStates({ ...statesRef.current });
      }

      tickRef.current = requestAnimationFrame(tick);
    };

    tickRef.current = requestAnimationFrame(tick);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, [agents, deskPositions]);

  return agentStates;
}

/**
 * The 3D scene contents (rendered inside Canvas)
 */
function OfficeScene({ agents, onAgentClick, selectedAgentId, cameraPreset, showStats }) {
  // Calculate desk positions based on ventures
  const deskPositions = useMemo(() => assignDeskPositions(agents), [agents]);

  // Agent tick system for movement behaviors
  const agentStates = useAgentTick(agents, deskPositions);

  // Follow selected agent
  const followTarget = useMemo(() => {
    if (!selectedAgentId) return null;
    const state = agentStates[selectedAgentId];
    if (!state) return null;
    return state.position;
  }, [selectedAgentId, agentStates]);

  return (
    <>
      <OfficeEnvironment />
      <CameraController preset={cameraPreset} followTarget={followTarget} />
      <OfficeFloor />
      <OfficeFurniture agentPositions={deskPositions} agents={agents} />

      {/* Render all agents */}
      {agents.map(agent => {
        const state = agentStates[agent.id];
        if (!state) return null;

        return (
          <AgentAvatar
            key={agent.id}
            agent={agent}
            position={state.position}
            targetPosition={state.targetPosition}
            onClick={onAgentClick}
            isSelected={agent.id === selectedAgentId}
          />
        );
      })}

      {showStats && <Stats />}
    </>
  );
}

/**
 * Main RetroOffice3D component with Canvas wrapper
 */
export default function RetroOffice3D({
  onAgentClick,
  selectedAgentId,
  cameraPreset = 'overview',
  showStats = false,
  className = '',
  style = {},
}) {
  const agents = useAgentStore(s => s.agents);

  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          fov: 45,
          near: 0.1,
          far: 100,
          position: [0, 18, 18],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        eventPrefix="offset"
        raycaster={{
          filter: (items) => items.sort((a, b) => a.distance - b.distance),
          params: { Points: { threshold: 0.2 } },
        }}
        style={{ background: '#080C14' }}
      >
        <OfficeScene
          agents={agents}
          onAgentClick={onAgentClick}
          selectedAgentId={selectedAgentId}
          cameraPreset={cameraPreset}
          showStats={showStats}
        />
      </Canvas>
    </div>
  );
}
