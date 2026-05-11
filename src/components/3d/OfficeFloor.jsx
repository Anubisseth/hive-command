// =============================================
// HIVE COMMAND — 3D Office Floor
// Tactical grid floor with venture zone markers
// =============================================

import { useMemo } from 'react';
import { VENTURES } from '../../data/constants';
import { buildVentureZones } from '../../lib/pathfinding';

const FLOOR_SIZE = 30;
const GRID_DIVISIONS = 60;

// Venture zone centers — auto-distributed to match pathfinding.js
const VENTURE_ZONES = buildVentureZones(VENTURES);

function ZoneMarker({ position, color, label }) {
  return (
    <group position={position}>
      {/* Zone border circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.2, 3.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>
      {/* Zone fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[3.2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

export default function OfficeFloor() {
  const gridLines = useMemo(() => {
    const lines = [];
    const half = FLOOR_SIZE / 2;
    const step = FLOOR_SIZE / GRID_DIVISIONS;

    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const pos = -half + i * step;
      const isMajor = i % 5 === 0;
      lines.push(
        <group key={`h-${i}`}>
          <mesh position={[0, 0.002, pos]}>
            <boxGeometry args={[FLOOR_SIZE, 0.001, isMajor ? 0.03 : 0.01]} />
            <meshBasicMaterial
              color={isMajor ? '#A090D0' : '#7068A0'}
              transparent
              opacity={isMajor ? 0.4 : 0.18}
            />
          </mesh>
        </group>,
        <group key={`v-${i}`}>
          <mesh position={[pos, 0.002, 0]}>
            <boxGeometry args={[isMajor ? 0.03 : 0.01, 0.001, FLOOR_SIZE]} />
            <meshBasicMaterial
              color={isMajor ? '#A090D0' : '#7068A0'}
              transparent
              opacity={isMajor ? 0.4 : 0.18}
            />
          </mesh>
        </group>
      );
    }
    return lines;
  }, []);

  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial
          color="#1E2436"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Grid lines — brighter for visibility */}
      {gridLines}

      {/* Venture zone markers */}
      {Object.entries(VENTURE_ZONES).map(([key, zone]) => (
        <ZoneMarker
          key={key}
          position={[zone.cx, 0, zone.cz]}
          color={VENTURES[key]?.color || '#8B5CF6'}
          label={zone.label}
        />
      ))}

      {/* Outer boundary glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[14, 14.5, 64]} />
        <meshBasicMaterial color="#FFB800" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}
