// === HIVE COMMAND — 3D Camera Controller ===
// Orbit controls with preset views and smooth follow-cam

import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Camera preset positions
const PRESETS = {
  overview:    { pos: [0, 18, 18],   target: [0, 0, 0] },
  topDown:     { pos: [0, 25, 0.1],  target: [0, 0, 0] },
  commander:   { pos: [0, 8, 8],     target: [0, 0, 0] },
  frontRow:    { pos: [0, 3, 12],    target: [0, 1, 0] },
  cinematic:   { pos: [-12, 6, 12],  target: [0, 0, 0] },
};

export default function CameraController({ preset = 'overview', followTarget = null }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);

  // Animate camera to preset
  const goToPreset = useCallback((presetName) => {
    const p = PRESETS[presetName];
    if (!p) return;

    targetPos.current.set(...p.pos);
    targetLookAt.current.set(...p.target);
    isAnimating.current = true;
  }, []);

  // Set initial position
  useEffect(() => {
    goToPreset(preset);
  }, [preset, goToPreset]);

  // Follow an agent — smoothly animate camera to focus on them
  useEffect(() => {
    if (followTarget) {
      targetPos.current.set(
        followTarget[0] + 4,
        5,
        followTarget[2] + 4
      );
      targetLookAt.current.set(followTarget[0], 0.5, followTarget[2]);
      isAnimating.current = true;
    }
  }, [followTarget]);

  // Smooth camera animation with responsive lerp
  useFrame(() => {
    if (!isAnimating.current || !controlsRef.current) return;

    const lerpFactor = 0.06;
    camera.position.lerp(targetPos.current, lerpFactor);
    controlsRef.current.target.lerp(targetLookAt.current, lerpFactor);
    controlsRef.current.update();

    // Stop animating when close enough
    if (camera.position.distanceTo(targetPos.current) < 0.1) {
      isAnimating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={3}
      maxDistance={35}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0.2}
      panSpeed={0.8}
      rotateSpeed={0.5}
      zoomSpeed={1.2}
      target={[0, 0, 0]}
      enableDamping
      dampingFactor={0.03}
    />
  );
}

export { PRESETS };
