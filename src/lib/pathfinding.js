// =============================================
// HIVE COMMAND — A* Pathfinding Engine
// Grid-based pathfinding for 3D office agents
// Inspired by claw3d retro-office systems
// =============================================

import { VENTURES } from '../data/constants';

const GRID_SIZE = 0.5; // World units per grid cell

/**
 * Convert world position to grid coordinates
 */
export function worldToGrid(x, z) {
  return {
    gx: Math.round(x / GRID_SIZE),
    gz: Math.round(z / GRID_SIZE),
  };
}

/**
 * Convert grid coordinates to world position
 */
export function gridToWorld(gx, gz) {
  return {
    x: gx * GRID_SIZE,
    z: gz * GRID_SIZE,
  };
}

/**
 * A* Pathfinding on a 2D grid
 * @param {Object} start - { gx, gz }
 * @param {Object} end - { gx, gz }
 * @param {Set} obstacles - Set of "gx,gz" strings
 * @param {number} maxIterations - Safety limit
 * @returns {Array} Array of { x, z } world positions
 */
export function findPath(start, end, obstacles = new Set(), maxIterations = 500) {
  const openSet = new Map();
  const closedSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const key = (gx, gz) => `${gx},${gz}`;
  const startKey = key(start.gx, start.gz);
  const endKey = key(end.gx, end.gz);

  // Heuristic: Manhattan distance
  const h = (gx, gz) => Math.abs(gx - end.gx) + Math.abs(gz - end.gz);

  gScore.set(startKey, 0);
  fScore.set(startKey, h(start.gx, start.gz));
  openSet.set(startKey, { gx: start.gx, gz: start.gz });

  let iterations = 0;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest fScore
    let currentKey = null;
    let currentF = Infinity;
    for (const [k, _] of openSet) {
      const f = fScore.get(k) || Infinity;
      if (f < currentF) {
        currentF = f;
        currentKey = k;
      }
    }

    if (currentKey === endKey) {
      // Reconstruct path
      const path = [];
      let ck = currentKey;
      while (ck) {
        const [gx, gz] = ck.split(',').map(Number);
        const world = gridToWorld(gx, gz);
        path.unshift(world);
        ck = cameFrom.get(ck);
      }
      return path;
    }

    const current = openSet.get(currentKey);
    openSet.delete(currentKey);
    closedSet.add(currentKey);

    // Check all 4 neighbors (no diagonals for clean movement)
    const neighbors = [
      { gx: current.gx + 1, gz: current.gz },
      { gx: current.gx - 1, gz: current.gz },
      { gx: current.gx, gz: current.gz + 1 },
      { gx: current.gx, gz: current.gz - 1 },
    ];

    for (const neighbor of neighbors) {
      const nKey = key(neighbor.gx, neighbor.gz);

      if (closedSet.has(nKey)) continue;
      if (obstacles.has(nKey)) continue;

      const tentativeG = (gScore.get(currentKey) || 0) + 1;

      if (tentativeG < (gScore.get(nKey) || Infinity)) {
        cameFrom.set(nKey, currentKey);
        gScore.set(nKey, tentativeG);
        fScore.set(nKey, tentativeG + h(neighbor.gx, neighbor.gz));

        if (!openSet.has(nKey)) {
          openSet.set(nKey, neighbor);
        }
      }
    }
  }

  // No path found — return direct line
  return [
    gridToWorld(start.gx, start.gz),
    gridToWorld(end.gx, end.gz),
  ];
}

/**
 * Auto-distribute venture cluster centers around a circle, with `cross` at center.
 * Works for any number of ventures the operator configures.
 */
export function buildVentureZones(ventures, radius = 7) {
  const keys = Object.keys(ventures).filter(k => k !== 'cross');
  const zones = {};
  keys.forEach((key, i) => {
    const angle = (i / keys.length) * Math.PI * 2 - Math.PI / 2;
    zones[key] = {
      cx: Math.round(Math.cos(angle) * radius * 10) / 10,
      cz: Math.round(Math.sin(angle) * radius * 10) / 10,
      label: ventures[key]?.short || key.slice(0, 3).toUpperCase(),
    };
  });
  zones.cross = { cx: 0, cz: 0, label: ventures.cross?.short || 'CMD' };
  return zones;
}

/**
 * Assign desk positions to agents based on venture clusters
 */
export function assignDeskPositions(agents) {
  // Auto-distribute venture cluster centers around a circle so the layout
  // adapts to whatever ventures the operator has configured. "cross" stays
  // in the middle.
  const VENTURE_ZONES = buildVentureZones(VENTURES);

  const ventureCounters = {};
  const positions = {};

  agents.forEach((agent) => {
    const venture = agent.venture || 'cross';
    const zone = VENTURE_ZONES[venture] || VENTURE_ZONES.cross;

    if (!ventureCounters[venture]) ventureCounters[venture] = 0;
    const idx = ventureCounters[venture]++;

    // Arrange in a grid within the zone (2 columns)
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = zone.cx + (col * 2.5) - 1.25;
    const z = zone.cz + (row * 2) - 1;

    positions[agent.id] = { x, z, deskX: x, deskZ: z };
  });

  return positions;
}

/**
 * Get a random wander position near an agent's desk
 */
export function getWanderTarget(deskPos, range = 3) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 1 + Math.random() * range;
  return {
    x: deskPos.x + Math.cos(angle) * dist,
    z: deskPos.z + Math.sin(angle) * dist,
  };
}
