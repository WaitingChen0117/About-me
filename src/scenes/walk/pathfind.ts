import {
  clampWalkPoint,
  OPERATOR_RADIUS,
  type WalkObstacle,
  type WalkRect,
} from './clampWalk'

export type WalkPoint = { x: number; z: number }

const CELL = 0.18
const SQRT2 = Math.SQRT2

function inBounds(x: number, z: number, bounds: WalkRect): boolean {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ
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

/** True when (x,z) is inside room bounds and clear of inflated furniture. */
export function isWalkablePoint(
  x: number,
  z: number,
  bounds: WalkRect,
  obstacles: WalkObstacle[] = [],
  radius: number = OPERATOR_RADIUS,
): boolean {
  if (!inBounds(x, z, bounds)) return false
  return !blocked(x, z, obstacles, radius)
}

/** Sampled segment test — true when the open segment stays walkable. */
export function lineOfSight(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  bounds: WalkRect,
  obstacles: WalkObstacle[],
  radius: number = OPERATOR_RADIUS,
): boolean {
  const dx = bx - ax
  const dz = bz - az
  const dist = Math.hypot(dx, dz)
  if (dist < 1e-6) return isWalkablePoint(ax, az, bounds, obstacles, radius)
  const steps = Math.max(2, Math.ceil(dist / (CELL * 0.45)))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    if (!isWalkablePoint(ax + dx * t, az + dz * t, bounds, obstacles, radius)) {
      return false
    }
  }
  return true
}

type Grid = {
  cols: number
  rows: number
  originX: number
  originZ: number
  walkable: Uint8Array
  key: string
}

let cachedGrid: Grid | null = null

function gridKey(
  bounds: WalkRect,
  obstacles: WalkObstacle[],
  radius: number,
): string {
  // Obstacles arrays are module consts — identity is stable per scene.
  return `${bounds.minX},${bounds.maxX},${bounds.minZ},${bounds.maxZ}|${obstacles.length}|${radius}`
}

function buildGrid(
  bounds: WalkRect,
  obstacles: WalkObstacle[],
  radius: number,
): Grid {
  const key = gridKey(bounds, obstacles, radius)
  if (cachedGrid && cachedGrid.key === key) return cachedGrid

  const cols = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / CELL) + 1)
  const rows = Math.max(1, Math.ceil((bounds.maxZ - bounds.minZ) / CELL) + 1)
  const walkable = new Uint8Array(cols * rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bounds.minX + c * CELL
      const z = bounds.minZ + r * CELL
      walkable[r * cols + c] = isWalkablePoint(x, z, bounds, obstacles, radius) ? 1 : 0
    }
  }
  cachedGrid = {
    cols,
    rows,
    originX: bounds.minX,
    originZ: bounds.minZ,
    walkable,
    key,
  }
  return cachedGrid
}

function worldToCell(x: number, z: number, grid: Grid): { c: number; r: number } {
  const c = Math.round((x - grid.originX) / CELL)
  const r = Math.round((z - grid.originZ) / CELL)
  return {
    c: Math.max(0, Math.min(grid.cols - 1, c)),
    r: Math.max(0, Math.min(grid.rows - 1, r)),
  }
}

function cellToWorld(c: number, r: number, grid: Grid): WalkPoint {
  return { x: grid.originX + c * CELL, z: grid.originZ + r * CELL }
}

function nearestWalkableCell(
  x: number,
  z: number,
  grid: Grid,
): { c: number; r: number } | null {
  const start = worldToCell(x, z, grid)
  if (grid.walkable[start.r * grid.cols + start.c]) return start
  // Spiral search — start may sit on a blocked cell after rounding.
  const maxR = Math.max(grid.cols, grid.rows)
  for (let rad = 1; rad <= maxR; rad++) {
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue
        const c = start.c + dc
        const r = start.r + dr
        if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) continue
        if (grid.walkable[r * grid.cols + c]) return { c, r }
      }
    }
  }
  return null
}

const N8: Array<[number, number, number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
]

/**
 * A* on a coarse floor grid, then string-pull smooth.
 * Returns null when the goal is blocked / out of bounds / unreachable.
 * Does NOT push the goal out of furniture — unreachable clicks stay silent.
 */
export function findPath(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  bounds: WalkRect,
  obstacles: WalkObstacle[] = [],
  radius: number = OPERATOR_RADIUS,
): WalkPoint[] | null {
  if (!isWalkablePoint(toX, toZ, bounds, obstacles, radius)) return null

  let sx = fromX
  let sz = fromZ
  if (!isWalkablePoint(sx, sz, bounds, obstacles, radius)) {
    const p = clampWalkPoint(sx, sz, bounds, obstacles, radius)
    sx = p.x
    sz = p.z
  }

  if (lineOfSight(sx, sz, toX, toZ, bounds, obstacles, radius)) {
    return [
      { x: sx, z: sz },
      { x: toX, z: toZ },
    ]
  }

  const grid = buildGrid(bounds, obstacles, radius)
  const start = nearestWalkableCell(sx, sz, grid)
  const goal = nearestWalkableCell(toX, toZ, grid)
  if (!start || !goal) return null

  // Goal cell must still map near the true click (avoid snapping into furniture).
  const goalWorld = cellToWorld(goal.c, goal.r, grid)
  if (
    Math.hypot(goalWorld.x - toX, goalWorld.z - toZ) > CELL * 1.6 ||
    !isWalkablePoint(toX, toZ, bounds, obstacles, radius)
  ) {
    // Exact goal walkable but rounding drifted — still require LOS to snapped cell.
    if (!lineOfSight(goalWorld.x, goalWorld.z, toX, toZ, bounds, obstacles, radius)) {
      return null
    }
  }

  const startIdx = start.r * grid.cols + start.c
  const goalIdx = goal.r * grid.cols + goal.c
  if (startIdx === goalIdx) {
    return [
      { x: sx, z: sz },
      { x: toX, z: toZ },
    ]
  }

  const n = grid.cols * grid.rows
  const gScore = new Float32Array(n)
  gScore.fill(Infinity)
  const fScore = new Float32Array(n)
  fScore.fill(Infinity)
  const came = new Int32Array(n)
  came.fill(-1)
  const closed = new Uint8Array(n)
  const open: number[] = []

  const heuristic = (c: number, r: number) => {
    const dx = Math.abs(c - goal.c)
    const dz = Math.abs(r - goal.r)
    return Math.max(dx, dz) + (SQRT2 - 1) * Math.min(dx, dz)
  }

  gScore[startIdx] = 0
  fScore[startIdx] = heuristic(start.c, start.r)
  open.push(startIdx)

  const popBest = () => {
    let bi = 0
    for (let i = 1; i < open.length; i++) {
      if (fScore[open[i]!]! < fScore[open[bi]!]!) bi = i
    }
    const idx = open[bi]!
    open[bi] = open[open.length - 1]!
    open.pop()
    return idx
  }

  let found = false
  while (open.length) {
    const current = popBest()
    if (current === goalIdx) {
      found = true
      break
    }
    if (closed[current]) continue
    closed[current] = 1
    const cc = current % grid.cols
    const cr = (current / grid.cols) | 0
    for (const [dc, dr, cost] of N8) {
      const nc = cc + dc
      const nr = cr + dr
      if (nc < 0 || nr < 0 || nc >= grid.cols || nr >= grid.rows) continue
      // Corner cut: both orthogonal neighbors must be free.
      if (dc !== 0 && dr !== 0) {
        if (!grid.walkable[cr * grid.cols + nc] || !grid.walkable[nr * grid.cols + cc]) {
          continue
        }
      }
      const ni = nr * grid.cols + nc
      if (!grid.walkable[ni] || closed[ni]) continue
      const tent = gScore[current]! + cost
      if (tent >= gScore[ni]!) continue
      came[ni] = current
      gScore[ni] = tent
      fScore[ni] = tent + heuristic(nc, nr)
      open.push(ni)
    }
  }

  if (!found) return null

  const cells: WalkPoint[] = []
  let cur = goalIdx
  while (cur !== -1) {
    const c = cur % grid.cols
    const r = (cur / grid.cols) | 0
    cells.push(cellToWorld(c, r, grid))
    if (cur === startIdx) break
    cur = came[cur]!
  }
  cells.reverse()

  // Replace ends with exact start / click goal, then string-pull.
  const raw: WalkPoint[] = [{ x: sx, z: sz }, ...cells.slice(1, -1), { x: toX, z: toZ }]
  return smoothPath(raw, bounds, obstacles, radius)
}

/** Funnel / string-pull: keep only corners required for clear LOS. */
function smoothPath(
  path: WalkPoint[],
  bounds: WalkRect,
  obstacles: WalkObstacle[],
  radius: number,
): WalkPoint[] {
  if (path.length <= 2) return path
  const out: WalkPoint[] = [path[0]!]
  let i = 0
  while (i < path.length - 1) {
    let farthest = i + 1
    for (let j = i + 2; j < path.length; j++) {
      const a = path[i]!
      const b = path[j]!
      if (lineOfSight(a.x, a.z, b.x, b.z, bounds, obstacles, radius)) {
        farthest = j
      } else {
        break
      }
    }
    out.push(path[farthest]!)
    i = farthest
  }
  return out
}

/** Hover helper: walkable cell + path exists from (fromX,fromZ). */
export function canReachPoint(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  bounds: WalkRect,
  obstacles: WalkObstacle[] = [],
  radius: number = OPERATOR_RADIUS,
): boolean {
  return findPath(fromX, fromZ, toX, toZ, bounds, obstacles, radius) != null
}

/**
 * Trim a planned route to the still-ahead portion given the follower's XZ.
 * The polyline starts at the follower so walked segments disappear behind them.
 */
export function remainingWalkPath(
  path: WalkPoint[],
  x: number,
  z: number,
): WalkPoint[] {
  if (path.length === 0) return []
  const goal = path[path.length - 1]!
  if (path.length === 1) return [{ x, z }, goal]

  let seg = 0
  for (; seg < path.length - 1; seg++) {
    const a = path[seg]!
    const b = path[seg + 1]!
    const abx = b.x - a.x
    const abz = b.z - a.z
    const len2 = abx * abx + abz * abz
    if (len2 < 1e-10) continue
    const t = ((x - a.x) * abx + (z - a.z) * abz) / len2
    // Still on / before this segment — keep from here to the goal.
    if (t < 0.98) {
      const fromIdx = t <= 0 ? seg : seg + 1
      return dedupePath([{ x, z }, ...path.slice(fromIdx)])
    }
  }

  return dedupePath([{ x, z }, goal])
}

/** Drop near-duplicate consecutive points; always keep ≥2 when possible. */
function dedupePath(points: WalkPoint[]): WalkPoint[] {
  if (points.length === 0) return points
  const out: WalkPoint[] = [points[0]!]
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!
    const prev = out[out.length - 1]!
    if (Math.hypot(p.x - prev.x, p.z - prev.z) > 0.02) out.push(p)
  }
  if (out.length < 2 && points.length >= 2) {
    out.push(points[points.length - 1]!)
  }
  return out
}
