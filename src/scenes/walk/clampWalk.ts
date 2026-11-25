import * as THREE from 'three'

export type WalkRect = { minX: number; maxX: number; minZ: number; maxZ: number }

export type WalkObstacle = WalkRect

/** Ops Deck (Scene A) — open floor inside studio walls. */
export const OPS_WALK_BOUNDS: WalkRect = {
  minX: -4.55,
  maxX: 4.55,
  minZ: -3.55,
  maxZ: 3.35,
}

/** Desk + chair footprint — soft-avoid so free-walk stays in open aisle. */
export const OPS_WALK_OBSTACLES: WalkObstacle[] = [
  // Main desk slab (approx world xz of the desk box)
  { minX: -2.15, maxX: 2.35, minZ: -1.3, maxZ: 0.6 },
  // Task chair base
  { minX: -0.45, maxX: 0.55, minZ: 0.7, maxZ: 1.55 },
]

/** Craft Lab (Scene B) — workshop floor. */
export const CRAFT_WALK_BOUNDS: WalkRect = {
  minX: -4.55,
  maxX: 4.55,
  minZ: -3.55,
  maxZ: 3.4,
}

/** Central workbench island. */
export const CRAFT_WALK_OBSTACLES: WalkObstacle[] = [
  { minX: -2.15, maxX: 2.55, minZ: -1.2, maxZ: 1.5 },
]

const _v = new THREE.Vector3()

function clampToRect(x: number, z: number, rect: WalkRect): { x: number; z: number } {
  return {
    x: THREE.MathUtils.clamp(x, rect.minX, rect.maxX),
    z: THREE.MathUtils.clamp(z, rect.minZ, rect.maxZ),
  }
}

/** Push (x,z) to the nearest edge if inside an obstacle AABB. */
function pushOutOfObstacle(x: number, z: number, obs: WalkObstacle): { x: number; z: number } {
  if (x < obs.minX || x > obs.maxX || z < obs.minZ || z > obs.maxZ) {
    return { x, z }
  }
  const dMinX = x - obs.minX
  const dMaxX = obs.maxX - x
  const dMinZ = z - obs.minZ
  const dMaxZ = obs.maxZ - z
  const m = Math.min(dMinX, dMaxX, dMinZ, dMaxZ)
  if (m === dMinX) return { x: obs.minX, z }
  if (m === dMaxX) return { x: obs.maxX, z }
  if (m === dMinZ) return { x, z: obs.minZ }
  return { x, z: obs.maxZ }
}

/**
 * Soft-clamp a floor hit into a walkable point: room rect, then push out of
 * major furniture AABBs, then re-clamp to bounds.
 */
export function clampWalkPoint(
  x: number,
  z: number,
  bounds: WalkRect,
  obstacles: WalkObstacle[] = [],
): THREE.Vector3 {
  let p = clampToRect(x, z, bounds)
  for (const obs of obstacles) {
    p = pushOutOfObstacle(p.x, p.z, obs)
  }
  p = clampToRect(p.x, p.z, bounds)
  return _v.set(p.x, 0, p.z).clone()
}
