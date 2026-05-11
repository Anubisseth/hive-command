// === HIVE COMMAND — 3D Agent Avatar ===
// Retro-style agent characters with status effects
// Reliable click detection with drag-vs-click differentiation

import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { TIERS, STATUSES, VENTURES } from '../../data/constants';

const STATUS_COLORS = {
  active:    '#00FF88',
  idle:      '#FFB800',
  blocked:   '#FF3344',
  offline:   '#4B5563',
  reviewing: '#00D4FF',
};

const TIER_SCALE = {
  0: 1.3,   // Commander — bigger
  1: 1.15,  // Director
  2: 1.0,   // Manager
  3: 0.9,   // Agent
};

// Threshold in pixels — movement below this counts as a click, not a drag
const CLICK_MOVE_THRESHOLD = 5;

/**
 * Single agent avatar — low-poly character with status effects
 */
export default function AgentAvatar({
  agent,
  position = [0, 0, 0],
  targetPosition = null,
  onClick,
  isSelected = false,
}) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const [hovered, setHovered] = useState(false);
  const pointerDownPos = useRef(null);

  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline;
  const tierScale = TIER_SCALE[agent.tier] ?? 1;
  const ventureColor = VENTURES[agent.venture]?.color || '#8B5CF6';
  const isActive = agent.status === 'active';
  const isOffline = agent.status === 'offline';

  // Track pointer-down position for click-vs-drag detection
  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Only fire click if pointer barely moved (not a drag/orbit)
  const handlePointerUp = useCallback((e) => {
    e.stopPropagation();
    if (!pointerDownPos.current) return;

    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CLICK_MOVE_THRESHOLD) {
      onClick?.(agent.id);
    }

    pointerDownPos.current = null;
  }, [onClick, agent.id]);

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  // Smooth movement toward target
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Breathing/idle animation
    if (bodyRef.current) {
      const t = state.clock.elapsedTime;
      if (isActive) {
        bodyRef.current.position.y = 0.55 + Math.sin(t * 2 + position[0]) * 0.02;
      } else {
        bodyRef.current.position.y = 0.55;
      }
    }

    // Move toward target if we have one
    if (targetPosition) {
      const current = groupRef.current.position;
      const dx = targetPosition[0] - current.x;
      const dz = targetPosition[2] - current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.05) {
        const speed = isActive ? 2 : 1;
        const step = Math.min(speed * delta, dist);
        current.x += (dx / dist) * step;
        current.z += (dz / dist) * step;

        // Face movement direction
        const angle = Math.atan2(dx, dz);
        groupRef.current.rotation.y += (angle - groupRef.current.rotation.y) * 0.1;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={tierScale}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Large click hitbox — transparent but raycaster-visible */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 2.5, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={isOffline ? 0.1 : 0.3} />
      </mesh>

      {/* Body group */}
      <group ref={bodyRef} position={[0, 0.55, 0]}>
        {/* Torso — capsule shape */}
        <mesh castShadow>
          <capsuleGeometry args={[0.18, 0.35, 4, 8]} />
          <meshStandardMaterial
            color={ventureColor}
            roughness={0.5}
            metalness={0.3}
            transparent={isOffline}
            opacity={isOffline ? 0.3 : 1}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color="#E5E7EB"
            roughness={0.6}
            metalness={0.1}
            transparent={isOffline}
            opacity={isOffline ? 0.3 : 1}
          />
        </mesh>

        {/* Status visor */}
        <mesh position={[0, 0.44, 0.12]}>
          <boxGeometry args={[0.2, 0.06, 0.05]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={isOffline ? 0.2 : 0.8}
          />
        </mesh>

        {/* Tier badge (on chest) */}
        {agent.tier <= 1 && (
          <mesh position={[0, 0.1, 0.19]}>
            <boxGeometry args={[0.08, 0.08, 0.01]} />
            <meshBasicMaterial color={TIERS[agent.tier]?.color || '#FFB800'} />
          </mesh>
        )}
      </group>

      {/* Status ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.32, 0.38, 16]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={isActive ? 0.5 : 0.15}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[0.42, 0.5, 16]} />
          <meshBasicMaterial color="#FFB800" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Hover ring */}
      {hovered && !isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
          <ringGeometry args={[0.4, 0.46, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} />
        </mesh>
      )}

      {/* Active particle glow */}
      {isActive && (
        <pointLight
          position={[0, 1, 0]}
          color={statusColor}
          intensity={0.8}
          distance={2.5}
        />
      )}

      {/* Blocked warning indicator */}
      {agent.status === 'blocked' && (
        <mesh position={[0, 1.3, 0]}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshBasicMaterial color="#FF3344" />
        </mesh>
      )}

      {/* Persistent task speech bubble — shows whenever the agent has an active task */}
      {agent.task && !hovered && !isSelected && (
        <Html
          position={[0, 1.4, 0]}
          center
          distanceFactor={18}
          style={{ pointerEvents: 'none' }}
        >
          <div className="hive-speech-bubble" style={{
            background: 'rgba(10, 14, 20, 0.85)',
            border: `1px solid ${statusColor}80`,
            borderRadius: '12px',
            padding: '4px 8px',
            maxWidth: '160px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px',
            color: '#00D4FF',
            boxShadow: `0 0 8px ${statusColor}40`,
            backdropFilter: 'blur(6px)',
            position: 'relative',
            animation: 'hive-bubble-float 3s ease-in-out infinite',
          }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {agent.task.description}
            </div>
            {/* Tail */}
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              marginLeft: '-4px',
              width: 0, height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `4px solid ${statusColor}80`,
            }} />
          </div>
        </Html>
      )}

      {/* Hover / selection full info card */}
      {(hovered || isSelected) && (
        <Html
          position={[0, 1.5, 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(10, 14, 20, 0.95)',
            border: `1px solid ${statusColor}`,
            borderRadius: '6px',
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: '#F9FAFB',
            boxShadow: `0 0 15px ${statusColor}30`,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ color: TIERS[agent.tier]?.color || '#4ADE80', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '2px' }}>
              {agent.name}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '8px', letterSpacing: '0.15em' }}>
              {TIERS[agent.tier]?.label || 'AGENT'} &bull; {(agent.status || 'offline').toUpperCase()}
            </div>
            {agent.model && (
              <div style={{ color: '#8B5CF6', fontSize: '8px', marginTop: '2px', letterSpacing: '0.1em' }}>
                MODEL: {agent.model}
              </div>
            )}
            {agent.task && (
              <div style={{ color: '#00D4FF', fontSize: '8px', marginTop: '3px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {agent.task.description}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
