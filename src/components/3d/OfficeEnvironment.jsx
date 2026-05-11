// =============================================
// HIVE COMMAND — 3D Office Environment
// Lighting, fog, post-processing effects
// Tactical cyberpunk atmosphere
// =============================================

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Ambient particles floating in the office
 */
function DataParticles({ count = 80 }) {
  const meshRef = useRef();
  const positions = useRef(
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 28,
      y: 0.5 + Math.random() * 3,
      z: (Math.random() - 0.5) * 28,
      speed: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }))
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    const posArray = meshRef.current.geometry.attributes.position;
    positions.current.forEach((p, i) => {
      posArray.setXYZ(
        i,
        p.x + Math.sin(t * p.speed + p.phase) * 0.3,
        p.y + Math.sin(t * 0.5 + p.phase) * 0.4,
        p.z + Math.cos(t * p.speed + p.phase) * 0.3
      );
    });
    posArray.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#00FF88"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Overhead holographic ring (command center aesthetic)
 */
function HoloRing() {
  const ringRef = useRef();

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={ringRef} position={[0, 3.5, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5, 0.03, 8, 64]} />
        <meshBasicMaterial color="#FFB800" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.3, 0.02, 8, 64]} />
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Complete office environment with lighting and effects
 */
export default function OfficeEnvironment() {
  return (
    <>
      {/* Main ambient — bright enough to see the full office */}
      <ambientLight intensity={1.2} color="#E0E4F0" />

      {/* Key light — strong warm from above */}
      <directionalLight
        position={[8, 15, 8]}
        intensity={2.0}
        color="#FFE8C8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />

      {/* Fill light — cool from opposite side */}
      <directionalLight
        position={[-8, 10, -6]}
        intensity={1.0}
        color="#88BBEE"
      />

      {/* Bottom fill to reduce harsh shadows */}
      <directionalLight
        position={[0, -2, 0]}
        intensity={0.3}
        color="#334466"
      />

      {/* Overhead spot for center command zone */}
      <spotLight
        position={[0, 8, 0]}
        angle={0.8}
        penumbra={0.6}
        intensity={1.5}
        color="#FFB800"
        castShadow={false}
      />

      {/* Venture zone accent lights — bright */}
      <pointLight position={[-6, 4, -4]} intensity={2.0} color="#3B82F6" distance={14} /> {/* OF zone */}
      <pointLight position={[6, 4, -4]} intensity={2.0} color="#C7D2FE" distance={14} />  {/* SYN zone */}
      <pointLight position={[0, 4, -6]} intensity={2.0} color="#10B981" distance={14} />   {/* NUT zone */}
      <pointLight position={[0, 4, 6]} intensity={2.0} color="#06B6D4" distance={14} />    {/* JET zone */}
      <pointLight position={[-6, 4, 4]} intensity={2.0} color="#1E40AF" distance={14} />   {/* CHK zone */}
      <pointLight position={[6, 4, 4]} intensity={2.0} color="#D97706" distance={14} />    {/* TEN zone */}

      {/* Fog for depth — far enough to see whole office */}
      <fog attach="fog" args={['#080C14', 30, 55]} />

      {/* Data particles */}
      <DataParticles count={80} />

      {/* Holographic ring above command center */}
      <HoloRing />
    </>
  );
}
