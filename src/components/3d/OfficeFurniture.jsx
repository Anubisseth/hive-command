// =============================================
// HIVE COMMAND — 3D Office Furniture
// Desks, chairs, screens, and office elements
// =============================================

import { useMemo } from 'react';
import { VENTURES } from '../../data/constants';
import { buildPOIs } from '../../lib/pathfinding';

/**
 * A single desk unit with monitor, chair, and status light
 */
function Desk({ position, color = '#1a2332', accentColor = '#00FF88', agentStatus = 'offline' }) {
  const statusColors = {
    active:    '#00FF88',
    idle:      '#FFB800',
    blocked:   '#FF3344',
    offline:   '#2a2a3a',
    reviewing: '#00D4FF',
  };
  const statusColor = statusColors[agentStatus] || statusColors.offline;
  const isActive = agentStatus === 'active';

  return (
    <group position={position}>
      {/* Desk surface */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.06, 0.7]} />
        <meshStandardMaterial color="#2A3448" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Desk legs */}
      {[[-0.6, 0.35, -0.28], [0.6, 0.35, -0.28], [-0.6, 0.35, 0.28], [0.6, 0.35, 0.28]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
          <meshStandardMaterial color="#202838" roughness={0.5} metalness={0.7} />
        </mesh>
      ))}

      {/* Monitor */}
      <mesh position={[0, 1.1, -0.2]} castShadow>
        <boxGeometry args={[0.7, 0.45, 0.03]} />
        <meshStandardMaterial color="#0A0E14" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Monitor screen glow */}
      <mesh position={[0, 1.1, -0.18]}>
        <planeGeometry args={[0.62, 0.38]} />
        <meshBasicMaterial
          color={isActive ? accentColor : '#111827'}
          transparent
          opacity={isActive ? 0.4 : 0.15}
        />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[0.06, 0.25, 0.06]} />
        <meshStandardMaterial color="#1E2636" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Status light on desk edge */}
      <mesh position={[0.55, 0.76, 0.3]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      {/* Status light glow */}
      {agentStatus !== 'offline' && (
        <pointLight
          position={[0.55, 0.76, 0.3]}
          color={statusColor}
          intensity={0.5}
          distance={1.5}
        />
      )}

      {/* Chair */}
      <group position={[0, 0, 0.6]}>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.45, 0.05, 0.45]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.7} metalness={0.3} />
        </mesh>
        {/* Back rest */}
        <mesh position={[0, 0.7, -0.2]} castShadow>
          <boxGeometry args={[0.45, 0.5, 0.04]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.7} metalness={0.3} />
        </mesh>
        {/* Chair base */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.44, 6]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Whiteboard — venture POI for collaboration
 */
function Whiteboard({ position, color = '#00D4FF' }) {
  return (
    <group position={position}>
      {/* Board */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.4, 0.9, 0.04]} />
        <meshStandardMaterial color="#F5F5F0" roughness={0.85} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 1.1, -0.02]}>
        <boxGeometry args={[1.45, 0.95, 0.02]} />
        <meshStandardMaterial color="#2A3448" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Stand legs */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.55, 0]} castShadow>
          <boxGeometry args={[0.04, 1.1, 0.04]} />
          <meshStandardMaterial color="#1A2540" roughness={0.5} metalness={0.7} />
        </mesh>
      ))}
      {/* Marker squiggles (decorative) */}
      <mesh position={[-0.3, 1.2, 0.025]}>
        <planeGeometry args={[0.4, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.2, 1.05, 0.025]}>
        <planeGeometry args={[0.5, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.85, 0.025]}>
        <planeGeometry args={[0.3, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Coffee machine — venture POI for idle breaks
 */
function CoffeeMachine({ position }) {
  return (
    <group position={position}>
      {/* Base counter */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.5]} />
        <meshStandardMaterial color="#1E2530" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Machine body */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.4]} />
        <meshStandardMaterial color="#0A0E14" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Steam light */}
      <mesh position={[0, 1.05, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#FF6B35" />
      </mesh>
      <pointLight position={[0, 1.05, 0.18]} color="#FF6B35" intensity={0.4} distance={1} />
      {/* Coffee cup */}
      <mesh position={[0.18, 0.85, 0.18]} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.08, 8]} />
        <meshStandardMaterial color="#F9FAFB" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Water cooler — global POI
 */
function WaterCooler({ position }) {
  return (
    <group position={position}>
      {/* Bottle (transparent blue) */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.5, 12]} />
        <meshStandardMaterial color="#00D4FF" transparent opacity={0.4} roughness={0.1} metalness={0.2} />
      </mesh>
      {/* Dispenser body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.6} />
      </mesh>
      {/* Tap */}
      <mesh position={[0, 0.7, 0.22]}>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 6]} />
        <meshStandardMaterial color="#2A3448" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Server rack (decoration for the command center zone)
 */
function ServerRack({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 2, 0.5]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Blinking LEDs */}
      {[0.6, 0.3, 0, -0.3, -0.6].map((y, i) => (
        <mesh key={i} position={[0.31, y, 0]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#00FF88' : '#00D4FF'} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Meeting table for the command center
 */
function MeetingTable({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.06, 16]} />
        <meshStandardMaterial color="#1E2530" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.15, 0.3, 0.64, 8]} />
        <meshStandardMaterial color="#1E2636" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Holographic projector ring */}
      <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.85, 32]} />
        <meshBasicMaterial color="#FFB800" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

/**
 * Wall segments around office perimeter
 */
function Walls() {
  const wallColor = '#1A2540';
  const half = 14;

  return (
    <group>
      {/* North wall */}
      <mesh position={[0, 1.25, -half]} castShadow>
        <boxGeometry args={[half * 2, 2.5, 0.15]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.2} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, 1.25, half]} castShadow>
        <boxGeometry args={[half * 2, 2.5, 0.15]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.2} />
      </mesh>
      {/* East wall */}
      <mesh position={[half, 1.25, 0]} castShadow>
        <boxGeometry args={[0.15, 2.5, half * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.2} />
      </mesh>
      {/* West wall */}
      <mesh position={[-half, 1.25, 0]} castShadow>
        <boxGeometry args={[0.15, 2.5, half * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Complete furniture layout for the office
 */
export default function OfficeFurniture({ agentPositions = {}, agents = [] }) {
  const agentStatusMap = useMemo(() => {
    const map = {};
    agents.forEach(a => { map[a.id] = a.status; });
    return map;
  }, [agents]);

  const desks = useMemo(() => {
    return Object.entries(agentPositions).map(([agentId, pos]) => {
      const agent = agents.find(a => a.id === agentId);
      const venture = agent?.venture || 'cross';
      const accentColor = VENTURES[venture]?.color || '#8B5CF6';

      return (
        <Desk
          key={agentId}
          position={[pos.deskX, 0, pos.deskZ]}
          accentColor={accentColor}
          agentStatus={agentStatusMap[agentId] || 'offline'}
        />
      );
    });
  }, [agentPositions, agents, agentStatusMap]);

  const pois = useMemo(() => buildPOIs(VENTURES), []);

  const whiteboards = useMemo(() => {
    return Object.entries(pois.byVenture).map(([ventureKey, p]) => (
      <Whiteboard
        key={`wb-${ventureKey}`}
        position={[p.whiteboard.x, 0, p.whiteboard.z]}
        color={VENTURES[ventureKey]?.color || '#00D4FF'}
      />
    ));
  }, [pois]);

  const coffeeMachines = useMemo(() => {
    return Object.entries(pois.byVenture).map(([ventureKey, p]) => (
      <CoffeeMachine
        key={`cf-${ventureKey}`}
        position={[p.coffee.x, 0, p.coffee.z]}
      />
    ));
  }, [pois]);

  return (
    <group>
      {desks}
      {whiteboards}
      {coffeeMachines}
      <Walls />
      <MeetingTable position={[pois.global.meetingTable.x, 0, pois.global.meetingTable.z]} />
      <WaterCooler position={[pois.global.waterCooler.x, 0, pois.global.waterCooler.z]} />

      {/* Server racks along east wall */}
      <ServerRack position={[13, 1, -8]} />
      <ServerRack position={[13, 1, -6]} />
      <ServerRack position={[13, 1, -4]} />

      {/* Server racks along west wall */}
      <ServerRack position={[-13, 1, -8]} />
      <ServerRack position={[-13, 1, -6]} />
    </group>
  );
}
