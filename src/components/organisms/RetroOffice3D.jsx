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
import { assignDeskPositions, buildPOIs, pickPOIForStatus } from '../../lib/pathfinding';
import { VENTURES } from '../../data/constants';
import useAgentStore from '../../store/agentStore';

/**
 * Agent tick system — manages agent movement and behaviors.
 * Drives the office-level state machine: agents pick POIs based on their status,
 * walk there, hang for a bit, then return to their desk.
 *
 * Behaviors: working | walking | atPOI | talking | idle | blocked | offline
 */
function useAgentTick(agents, deskPositions, pois) {
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
        currentPOI: null,
        moveTimer: 4 + Math.random() * 10,
        talkPartner: null,
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

      // Phase 1: per-agent behavior updates
      Object.entries(statesRef.current).forEach(([agentId, state]) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;
        const desk = deskPositions[agentId];
        if (!desk) return;

        const elapsed = (now - state.lastUpdate) / 1000;
        state.moveTimer -= elapsed;
        state.lastUpdate = now;

        // Offline → stay put silently
        if (agent.status === 'offline') {
          if (state.behavior !== 'offline') {
            state.targetPosition = [desk.x, 0, desk.z];
            state.behavior = 'offline';
            state.currentPOI = null;
            changed = true;
          }
          return;
        }

        // Blocked → stay at desk, red pulse handled in avatar
        if (agent.status === 'blocked') {
          if (state.behavior !== 'blocked') {
            state.targetPosition = [desk.x, 0, desk.z];
            state.behavior = 'blocked';
            state.currentPOI = null;
            changed = true;
          }
          return;
        }

        // Talking takes priority — handled in phase 2 below

        // Movement loop for active/idle/reviewing
        if (state.moveTimer <= 0) {
          if (state.behavior === 'walking' || state.behavior === 'atPOI') {
            // Return to desk
            state.targetPosition = [desk.x, 0, desk.z];
            state.behavior = 'walking';
            state.currentPOI = null;
            state.moveTimer = 8 + Math.random() * 12; // stay at desk for a while
          } else {
            // Pick a POI to walk to (or stay if pickPOIForStatus returns null)
            const poi = pickPOIForStatus(agent, pois, deskPositions);
            if (poi) {
              state.targetPosition = [poi.x, 0, poi.z];
              state.behavior = 'walking';
              state.currentPOI = poi.type;
              state.moveTimer = 6 + Math.random() * 8; // dwell at POI
            } else {
              // Stay at desk
              state.targetPosition = [desk.x, 0, desk.z];
              state.behavior = agent.status === 'active' ? 'working' : 'idle';
              state.moveTimer = 5 + Math.random() * 8;
            }
          }
          changed = true;
        }

        // Transition walking → atPOI / working when we've arrived
        if (state.behavior === 'walking') {
          const dx = state.targetPosition[0] - state.position[0];
          const dz = state.targetPosition[2] - state.position[2];
          if (Math.hypot(dx, dz) < 0.2) {
            const atDesk = Math.hypot(state.targetPosition[0] - desk.x, state.targetPosition[2] - desk.z) < 0.3;
            state.behavior = atDesk
              ? (agent.status === 'active' ? 'working' : 'idle')
              : 'atPOI';
            changed = true;
          }
        }
      });

      // Phase 2: detect proximity-based talking interactions
      const agentList = Object.entries(statesRef.current);
      for (let i = 0; i < agentList.length; i++) {
        const [idA, sA] = agentList[i];
        if (sA.behavior === 'offline' || sA.behavior === 'blocked') continue;
        if (sA.behavior === 'walking') continue; // don't interrupt walking
        if (sA.talkPartner) continue;

        for (let j = i + 1; j < agentList.length; j++) {
          const [idB, sB] = agentList[j];
          if (sB.behavior === 'offline' || sB.behavior === 'blocked') continue;
          if (sB.behavior === 'walking') continue;
          if (sB.talkPartner) continue;

          const d = Math.hypot(sA.position[0] - sB.position[0], sA.position[2] - sB.position[2]);
          if (d < 1.5 && Math.random() < 0.005) {
            // Start talking
            sA.talkPartner = idB;
            sB.talkPartner = idA;
            sA.behavior = 'talking';
            sB.behavior = 'talking';
            sA.moveTimer = 4 + Math.random() * 4;
            sB.moveTimer = sA.moveTimer;
            changed = true;
            break;
          }
        }
      }

      // Phase 3: end talking when timer expires
      agentList.forEach(([id, s]) => {
        if (s.behavior === 'talking' && s.moveTimer <= 0) {
          const partnerState = s.talkPartner ? statesRef.current[s.talkPartner] : null;
          s.talkPartner = null;
          if (partnerState) {
            partnerState.talkPartner = null;
            partnerState.behavior = 'atPOI';
            partnerState.moveTimer = 1 + Math.random() * 2;
          }
          s.behavior = 'atPOI';
          s.moveTimer = 1 + Math.random() * 2;
          changed = true;
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
  }, [agents, deskPositions, pois]);

  return agentStates;
}

/**
 * The 3D scene contents (rendered inside Canvas)
 */
function OfficeScene({ agents, onAgentClick, selectedAgentId, cameraPreset, showStats }) {
  // Calculate desk positions based on ventures
  const deskPositions = useMemo(() => assignDeskPositions(agents), [agents]);
  const pois = useMemo(() => buildPOIs(VENTURES), []);

  // Agent tick system for movement behaviors
  const agentStates = useAgentTick(agents, deskPositions, pois);

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
            behavior={state.behavior}
            talkPartnerId={state.talkPartner}
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
