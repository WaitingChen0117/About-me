import * as THREE from 'three'

export type WalkRect = { minX: number; maxX: number; minZ: number; maxZ: number }

export type WalkObstacle = WalkRect

/** Footprint radius so the chibi body doesn't sink into prop edges. */
export const OPERATOR_RADIUS = 0.2

/** Ops Deck (Scene A) — open floor inside studio walls. */
export const OPS_WALK_BOUNDS: WalkRect = {
  minX: -4.55,
  maxX: 4.55,
  minZ: -3.55,
  maxZ: 3.35,
}

/**
 * Scene A solid props — desks / chair / shelves / side tables.
 * Boxes match furniture footprints (before OPERATOR_RADIUS inflate).
 * Desk vs chair keep a ≥ 2×radius gap so inflated AABBs never overlap
 * (avoids push-out oscillation and keeps desk clicks on the front aisle).
 */
export const OPS_WALK_OBSTACLES: WalkObstacle[] = [
  // Main desk slab (center ~0.1,-0.35 · 4.6×2.0) — front clipped slightly
  { minX: -2.2, maxX: 2.4, minZ: -1.35, maxZ: 0.58 },
  // Task chair (south of desk; gap keeps inflate clear)
  { minX: -0.4, maxX: 0.5, minZ: 1.02, maxZ: 1.55 },
  // Back-wall credenza / ledge
  { minX: -4.1, maxX: 4.1, minZ: -4.25, maxZ: -3.65 },
  // Projects bookshelf + PC tower
  { minX: 3.65, maxX: 4.9, minZ: 0.05, maxZ: 0.9 },
  // Articles drawer cabinet
  { minX: -4.55, maxX: -3.5, minZ: 0.35, maxZ: 1.2 },
  // Hobbies side table
  { minX: -3.1, maxX: -2.0, minZ: 2.2, maxZ: 3.3 },
  // Contact lamp + mail tray
  { minX: 2.4, maxX: 3.5, minZ: 2.25, maxZ: 3.2 },
  // Corner plant
  { minX: -4.7, maxX: -4.05, minZ: 2.55, maxZ: 3.25 },
]

/** Craft Lab (Scene B) — workshop floor. */
export const CRAFT_WALK_BOUNDS: WalkRect = {
  minX: -4.55,
  maxX: 4.55,
  minZ: -3.55,
  maxZ: 3.4,
}

/**
 * Scene B solid props — workbench island + bay furniture.
 * Island sized to the timeline / craft table so click-walk and patrol
 * cannot sink into the tabletop.
 */
export const CRAFT_WALK_OBSTACLES: WalkObstacle[] = [
  // Central workbench island (top ~4.9×2.9 at 0.2, 0.15)
  { minX: -2.25, maxX: 2.65, minZ: -1.3, maxZ: 1.6 },
  // Articles folder stack
  { minX: -4.75, maxX: -3.75, minZ: 0.45, maxZ: 1.25 },
  // Hobbies shelf
  { minX: -3.4, maxX: -2.3, minZ: 2.6, maxZ: 3.3 },
  // Contact mailbox
  { minX: 3.5, maxX: 4.25, minZ: 2.55, maxZ: 3.2 },
  // Projects lightbox bay
  { minX: 3.55, maxX: 4.75, minZ: -1.95, maxZ: -1.15 },
]

const _v = new THREE.Vector3()

function clampToRect(x: number, z: number, rect: WalkRect): { x: number; z: number } {
  return {
    x: THREE.MathUtils.clamp(x, rect.minX, rect.maxX),
    z: THREE.MathUtils.clamp(z, rect.minZ, rect.maxZ),
  }
}

function inflate(obs: WalkObstacle, radius: number): WalkObstacle {
  return {
    minX: obs.minX - radius,
    maxX: obs.maxX + radius,
    minZ: obs.minZ - radius,
    maxZ: obs.maxZ + radius,
  }
}

function inside(x: number, z: number, obs: WalkObstacle): boolean {
  return x >= obs.minX && x <= obs.maxX && z >= obs.minZ && z <= obs.maxZ
}

/**
 * Push (x,z) to the nearest edge if inside an obstacle AABB.
 * Slight bias against -Z so desk / workbench clicks prefer the open
 * aisle toward the camera instead of the narrow gap by the back wall.
 */
function pushOutOfObstacle(x: number, z: number, obs: WalkObstacle): { x: number; z: number } {
  if (!inside(x, z, obs)) return { x, z }
  const dMinX = x - obs.minX
  const dMaxX = obs.maxX - x
  const dMinZ = z - obs.minZ + 0.85
  const dMaxZ = obs.maxZ - z
  const m = Math.min(dMinX, dMaxX, dMinZ, dMaxZ)
  const near = (d: number) => d <= m + 1e-6
  if (near(dMaxZ)) return { x, z: obs.maxZ }
  if (near(dMinX)) return { x: obs.minX, z }
  if (near(dMaxX)) return { x: obs.maxX, z }
  return { x, z: obs.minZ }
}

function blocked(
  x: number,
  z: number,
  obstacles: WalkObstacle[],
  radius: number,
): boolean {
  for (const obs of obstacles) {
    if (inside(x, z, inflate(obs, radius))) return true
  }
  return false
}

/**
 * Soft-clamp a floor hit into a walkable point: room rect, then push out of
 * major furniture AABBs (inflated by operator radius), then re-clamp to bounds.
 */
export function clampWalkPoint(
  x: number,
  z: number,
  bounds: WalkRect,
  obstacles: WalkObstacle[] = [],
  radius: number = OPERATOR_RADIUS,
): THREE.Vector3 {
  let p = clampToRect(x, z, bounds)
  // Iterate push-outs so nested / corner hits settle on free floor.
  for (let i = 0; i < 6; i++) {
    let moved = false
    for (const obs of obstacles) {
      const next = pushOutOfObstacle(p.x, p.z, inflate(obs, radius))
      if (next.x !== p.x || next.z !== p.z) {
        p = next
        moved = true
      }
    }
    p = clampToRect(p.x, p.z, bounds)
    if (!moved && !blocked(p.x, p.z, obstacles, radius)) break
  }
  return _v.set(p.x, 0, p.z).clone()
}

/**
 * Solid step: move toward (toX,toZ) without entering inflated furniture.
 * Axis-separated so the operator can slide along desk/table edges.
 */
export function resolveWalkStep(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  bounds: WalkRect,
  obstacles: WalkObstacle[] = [],
  radius: number = OPERATOR_RADIUS,
): { x: number; z: number } {
  const tryPoint = (x: number, z: number) => {
    const c = clampToRect(x, z, bounds)
    if (blocked(c.x, c.z, obstacles, radius)) return null
    return c
  }

  const full = tryPoint(toX, toZ)
  if (full) return full

  // Slide along X, then Z (or vice-versa if X blocked).
  let nx = fromX
  let nz = fromZ
  const xOnly = tryPoint(toX, fromZ)
  if (xOnly) nx = xOnly.x
  const zOnly = tryPoint(nx, toZ)
  if (zOnly) {
    nz = zOnly.z
  } else if (!xOnly) {
    // Both axes blocked from from — try Z first then X.
    const zFirst = tryPoint(fromX, toZ)
    if (zFirst) nz = zFirst.z
    const xAfter = tryPoint(toX, nz)
    if (xAfter) nx = xAfter.x
  }

  // Still overlapping (spawned inside)? Push out.
  let p = { x: nx, z: nz }
  if (blocked(p.x, p.z, obstacles, radius)) {
    for (const obs of obstacles) {
      p = pushOutOfObstacle(p.x, p.z, inflate(obs, radius))
    }
    p = clampToRect(p.x, p.z, bounds)
  }
  return p
}
