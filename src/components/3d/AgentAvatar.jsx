// === HIVE COMMAND — 3D Agent Avatar ===
// Retro-style agent characters with status effects
// Reliable click detection with drag-vs-click differentiation

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { TIERS, STATUSES, VENTURES } from '../../data/constants';
import { pickDialogueSnippet } from '../../lib/dialogue';

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
  behavior = 'idle',
  talkPartnerId = null,
  obstacles = [],
  onClick,
  isSelected = false,
}) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const dustRefs = useRef([useRef(), useRef(), useRef()]);
  const lastFootstepTime = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [dialogue, setDialogue] = useState(null);
  const pointerDownPos = useRef(null);

  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline;
  const tierScale = TIER_SCALE[agent.tier] ?? 1;
  const ventureColor = VENTURES[agent.venture]?.color || '#8B5CF6';
  const isActive = agent.status === 'active';
  const isOffline = agent.status === 'offline';
  const isBlocked = agent.status === 'blocked';
  const isWorking = behavior === 'working';
  const isWalking = behavior === 'walking';
  const isTalking = behavior === 'talking';

  // Track if the current task was received in the last 4s (NEW DIRECTIVE pulse).
  const PULSE_MS = 4000;
  const receivedAt = agent.task?.receivedAt;
  const [now, setNow] = useState(() => Date.now());
  const isFreshTask = receivedAt && now - receivedAt < PULSE_MS;
  useEffect(() => {
    if (!receivedAt) return;
    const remaining = PULSE_MS - (Date.now() - receivedAt);
    if (remaining <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), remaining + 50);
    return () => clearTimeout(id);
  }, [receivedAt]);

  // Halo ref for animating the fresh-task ring
  const haloRef = useRef();

  // Pick a fresh dialogue snippet whenever a new talking session starts
  useEffect(() => {
    if (isTalking && talkPartnerId) {
      setDialogue(pickDialogueSnippet(agent, null));
    } else {
      setDialogue(null);
    }
  }, [isTalking, talkPartnerId, agent]);

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

  // Procedural animations + smooth movement
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const phase = t * 2 + position[0];

    // ─── Body animation by behavior ─────────────────────
    if (bodyRef.current) {
      if (isWorking || isActive) {
        // Typing motion: subtle vertical bob + tiny side-to-side
        bodyRef.current.position.y = 0.55 + Math.sin(phase) * 0.02;
        bodyRef.current.rotation.z = Math.sin(phase * 0.7) * 0.04;
      } else if (isWalking) {
        // Walking gait: more pronounced bob + slight forward lean
        bodyRef.current.position.y = 0.55 + Math.abs(Math.sin(t * 8)) * 0.04;
        bodyRef.current.rotation.x = 0.08;
        bodyRef.current.rotation.z = 0;
      } else if (isTalking) {
        // Talking: gentle sway
        bodyRef.current.position.y = 0.55;
        bodyRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;
        bodyRef.current.rotation.x = 0;
      } else if (isBlocked) {
        // Stuck: slight slump
        bodyRef.current.position.y = 0.52;
        bodyRef.current.rotation.x = 0.15;
        bodyRef.current.rotation.z = 0;
      } else {
        // Idle: very slight breathing
        bodyRef.current.position.y = 0.55 + Math.sin(t * 1.2) * 0.008;
        bodyRef.current.rotation.x = 0;
        bodyRef.current.rotation.z = 0;
      }
    }

    // ─── Head animation by behavior ─────────────────────
    if (headRef.current) {
      if (isWorking) {
        // Head tilted forward looking at "screen"
        headRef.current.rotation.x = 0.25 + Math.sin(phase * 0.5) * 0.02;
        headRef.current.rotation.y = 0;
      } else if (isTalking) {
        // Head turns side-to-side as if conversing
        headRef.current.rotation.x = 0;
        headRef.current.rotation.y = Math.sin(t * 1.8) * 0.25;
      } else if (isWalking) {
        // Looking forward
        headRef.current.rotation.x = -0.05;
        headRef.current.rotation.y = 0;
      } else {
        headRef.current.rotation.x = 0;
        headRef.current.rotation.y = 0;
      }
    }

    // ─── Move toward target with soft obstacle repulsion ────
    if (targetPosition) {
      const current = groupRef.current.position;
      let dx = targetPosition[0] - current.x;
      let dz = targetPosition[2] - current.z;

      // Apply soft repulsion from any nearby obstacle (NavMesh-light).
      // We add a perpendicular push when within `repulsionRadius`.
      const repulsionRadius = 0.9;
      let repelX = 0, repelZ = 0;
      for (const o of obstacles) {
        const odx = current.x - o.x;
        const odz = current.z - o.z;
        const od = Math.hypot(odx, odz);
        if (od > 0 && od < repulsionRadius) {
          const strength = (repulsionRadius - od) / repulsionRadius;
          repelX += (odx / od) * strength * 1.5;
          repelZ += (odz / od) * strength * 1.5;
        }
      }
      dx += repelX;
      dz += repelZ;

      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.05) {
        // Walking speed depends on tier (Commander struts slower, Agents scurry)
        const baseSpeed = isWalking ? (agent.tier >= 2 ? 1.6 : 1.2) : (isActive ? 0.6 : 0.3);
        const step = Math.min(baseSpeed * delta, dist);
        current.x += (dx / dist) * step;
        current.z += (dz / dist) * step;

        // Face movement direction
        const angle = Math.atan2(dx, dz);
        const cur = groupRef.current.rotation.y;
        // Smoothly interpolate angle (handle wrap-around)
        let diff = angle - cur;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        groupRef.current.rotation.y += diff * 0.15;

        // Footstep dust — emit a particle every ~0.35s while walking
        if (isWalking && t - lastFootstepTime.current > 0.35) {
          lastFootstepTime.current = t;
          const idx = Math.floor(t * 3) % 3;
          const dust = dustRefs.current[idx]?.current;
          if (dust) {
            dust.position.set(0, 0.05, 0);
            dust.material.opacity = 0.4;
            dust.scale.setScalar(0.5);
            dust.userData.bornAt = t;
          }
        }
      }
    }

    // Pulse the fresh-task halo ring + scale the exclamation
    if (haloRef.current && isFreshTask) {
      const pulse = 1 + Math.sin(t * 6) * 0.15;
      haloRef.current.scale.setScalar(pulse);
      haloRef.current.material.opacity = 0.5 + Math.sin(t * 6) * 0.25;
    }

    // Fade & lift footstep dust over its lifetime
    dustRefs.current.forEach(ref => {
      const d = ref?.current;
      if (!d || !d.userData.bornAt) return;
      const age = t - d.userData.bornAt;
      if (age > 1.0) {
        d.material.opacity = 0;
        return;
      }
      d.position.y = 0.05 + age * 0.15;
      d.material.opacity = 0.4 * (1 - age);
      d.scale.setScalar(0.5 + age * 0.6);
    });
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

        {/* Head + visor group (rotates independently) */}
        <group ref={headRef} position={[0, 0.42, 0]}>
          <mesh castShadow>
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
          <mesh position={[0, 0.02, 0.12]}>
            <boxGeometry args={[0.2, 0.06, 0.05]} />
            <meshBasicMaterial
              color={statusColor}
              transparent
              opacity={isOffline ? 0.2 : 0.8}
            />
          </mesh>
        </group>

        {/* Tier badge (on chest) */}
        {agent.tier <= 1 && (
          <mesh position={[0, 0.1, 0.19]}>
            <boxGeometry args={[0.08, 0.08, 0.01]} />
            <meshBasicMaterial color={TIERS[agent.tier]?.color || '#FFB800'} />
          </mesh>
        )}

        {/* Tier-specific accessory */}
        {agent.tier === 0 && (
          <>
            {/* Commander crown on head */}
            <mesh position={[0, 0.62, 0]}>
              <coneGeometry args={[0.13, 0.16, 5]} />
              <meshStandardMaterial color="#FFB800" metalness={0.85} roughness={0.2} emissive="#FFB800" emissiveIntensity={0.3} />
            </mesh>
            {/* Crown gem */}
            <mesh position={[0, 0.7, 0]}>
              <octahedronGeometry args={[0.04, 0]} />
              <meshStandardMaterial color="#FF3344" emissive="#FF3344" emissiveIntensity={0.6} />
            </mesh>
            {/* Cape (back of body) */}
            <mesh position={[0, -0.05, -0.18]} rotation={[0.1, 0, 0]}>
              <coneGeometry args={[0.22, 0.55, 6, 1, true]} />
              <meshStandardMaterial color="#7C2D12" roughness={0.85} side={2} />
            </mesh>
          </>
        )}
        {agent.tier === 1 && (
          <>
            {/* Director briefcase in hand */}
            <mesh position={[0.22, -0.05, 0]} castShadow>
              <boxGeometry args={[0.14, 0.1, 0.05]} />
              <meshStandardMaterial color="#2A1810" roughness={0.5} metalness={0.4} />
            </mesh>
            {/* Briefcase handle */}
            <mesh position={[0.22, 0.02, 0]}>
              <torusGeometry args={[0.025, 0.008, 4, 8, Math.PI]} />
              <meshStandardMaterial color="#D4A574" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Shoulder pads */}
            <mesh position={[-0.18, 0.22, 0]}>
              <boxGeometry args={[0.06, 0.05, 0.16]} />
              <meshStandardMaterial color={ventureColor} roughness={0.4} metalness={0.5} />
            </mesh>
            <mesh position={[0.18, 0.22, 0]}>
              <boxGeometry args={[0.06, 0.05, 0.16]} />
              <meshStandardMaterial color={ventureColor} roughness={0.4} metalness={0.5} />
            </mesh>
          </>
        )}
        {agent.tier === 2 && (
          <>
            {/* Manager headset (band over head) */}
            <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.17, 0.012, 4, 12, Math.PI]} />
              <meshStandardMaterial color="#2A3448" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Mic boom */}
            <mesh position={[0.12, 0.42, 0.05]} rotation={[0, 0, -Math.PI / 4]}>
              <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
              <meshStandardMaterial color="#2A3448" />
            </mesh>
            <mesh position={[0.16, 0.36, 0.08]}>
              <sphereGeometry args={[0.018, 6, 6]} />
              <meshBasicMaterial color={statusColor} />
            </mesh>
          </>
        )}
        {agent.tier === 3 && isWorking && (
          /* Tier-3 worker: tablet/clipboard in hand when working */
          <mesh position={[0.18, 0, 0.15]} rotation={[0.3, 0.4, 0]} castShadow>
            <boxGeometry args={[0.12, 0.16, 0.01]} />
            <meshBasicMaterial color={statusColor} transparent opacity={0.6} />
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

      {/* NEW DIRECTIVE — floor halo ring + floating exclamation mark when freshly received */}
      {isFreshTask && (
        <>
          <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.5, 0.75, 32]} />
            <meshBasicMaterial color="#FFB800" transparent opacity={0.6} />
          </mesh>
          {/* Floating exclamation above head */}
          <group position={[0, 1.25, 0]}>
            <mesh>
              <coneGeometry args={[0.06, 0.18, 6]} />
              <meshBasicMaterial color="#FFB800" />
            </mesh>
            <mesh position={[0, -0.16, 0]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshBasicMaterial color="#FFB800" />
            </mesh>
          </group>
          <pointLight position={[0, 1.4, 0]} color="#FFB800" intensity={1.5} distance={2.5} />
        </>
      )}

      {/* Footstep dust particles (3 reusable, recycled on each footstep) */}
      {[0, 1, 2].map(i => (
        <mesh key={`dust-${i}`} ref={dustRefs.current[i]} position={[0, -1, 0]}>
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshBasicMaterial color={ventureColor} transparent opacity={0} />
        </mesh>
      ))}

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

      {/* Talking dialogue bubble — overrides task bubble when talking */}
      {dialogue && !hovered && !isSelected && (
        <Html
          position={[0, 1.55 + (3 - agent.tier) * 0.05, 0]}
          center
          distanceFactor={18}
          style={{ pointerEvents: 'none' }}
        >
          <div className="hive-speech-bubble" style={{
            background: 'rgba(10, 14, 20, 0.95)',
            border: `1px solid #00FF88`,
            borderRadius: '12px',
            padding: '4px 8px',
            maxWidth: '180px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px',
            color: '#00FF88',
            boxShadow: `0 0 10px #00FF8855`,
            backdropFilter: 'blur(6px)',
            position: 'relative',
            animation: 'hive-bubble-float 2.5s ease-in-out infinite',
          }}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dialogue}
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              marginLeft: '-4px',
              width: 0, height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `4px solid #00FF88`,
            }} />
          </div>
        </Html>
      )}

      {/* Persistent task speech bubble — shows whenever the agent has an active task and isn't talking */}
      {agent.task && !dialogue && !hovered && !isSelected && (
        <Html
          // Stagger Y by tier so clustered bubbles don't all overlap
          position={[0, 1.4 + (3 - agent.tier) * 0.18, 0]}
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
