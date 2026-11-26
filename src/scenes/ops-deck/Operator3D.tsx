import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import * as THREE from 'three'
import type { SectionId } from '../../content/sections'
import type { HotspotDef } from '../types'
import {
  clampWalkPoint,
  resolveWalkStep,
  type WalkObstacle,
  type WalkRect,
} from '../walk/clampWalk'
import { findPath, type WalkPoint } from '../walk/pathfind'
import { CHAIR_OUTWARD_YAW, OPERATOR_HOME } from './hotspots'
import { OperatorAvatar, type OperatorClip } from './OperatorAvatar'
import type { DeckPalette } from './themeColors'

/** Free click-to-walk — follows a planned polyline (path around furniture). */
export type FreeWalkCommand = {
  ticket: number
  /** Final click goal (also path[path.length-1]). */
  x: number
  z: number
  /** Waypoints from near the operator to the goal; required for click-walk. */
  path: WalkPoint[]
}

/** Walk to approach, then blend onto the seat. */
export type SitCommand = {
  ticket: number
  approachX: number
  approachZ: number
  sitX: number
  sitY: number
  sitZ: number
  faceYaw: number
}

/** Turn chair+body to exitYaw first, then stand and rest at standX/Z. */
export type StandCommand = {
  ticket: number
  standX: number
  standZ: number
  /** World yaw to face before rising (aisle / outward). */
  exitYaw?: number
}

type Props = {
  hotspots: HotspotDef[]
  target: SectionId | null
  ticket: number
  onArrive: (id: SectionId) => void
  onTap: () => void
  palette: DeckPalette
  introRef: MutableRefObject<number>
  /** Override spawn / idle position (defaults to Ops Deck home). */
  home?: [number, number, number]
  /** Optional CSS class for the hover tip bubble. */
  tipClassName?: string
  /** Camera / panel focus — turn to face this hotspot while idle */
  lookAtId?: SectionId | null
  /** Click-empty-floor walk; ticket bump restarts even to the same point */
  freeWalk?: FreeWalkCommand | null
  /** Room walk bounds — solid-clamp goals + per-step collision */
  walkBounds?: WalkRect | null
  /** Furniture AABBs — click-walk and patrol cannot sink into these */
  walkObstacles?: WalkObstacle[]
  /** Desk chair sit request */
  sitCommand?: SitCommand | null
  /** Leave chair request */
  standCommand?: StandCommand | null
  onSeated?: () => void
  onStood?: () => void
  /** Fired when a free-walk path is fully consumed (or aborted mid-route). */
  onFreeWalkDone?: () => void
  /**
   * Live XZ for WalkSurface pathfinding / hover reachability.
   * Written every frame while standing / walking.
   */
  positionRef?: MutableRefObject<{ x: number; z: number }>
  /**
   * While in a seat phase, Operator writes its world yaw here each frame
   * so DeckWorld can swivel the chair in lockstep (no body-only twist).
   */
  seatYawRef?: MutableRefObject<number>
  /**
   * DeckWorld sets true once the chair seat opens toward the character.
   * Sit-blend waits on this so the body never drops through the backrest.
   */
  chairOrientedRef?: MutableRefObject<boolean>
  /**
   * While seated, prefer this yaw over lookAtId (forced monitor turn).
   */
  seatTurnYawRef?: MutableRefObject<number | null>
}

/** Shortest signed angle from `from` to `to` in (−π, π]. */
function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

const WALK_SPEED = 2.55

/**
 * KayKit Rogue origin is at the soles — no procedural sole offset.
 * Keep a tiny lift so ContactShadows don't z-fight.
 */
const STAND_Y_LIFT = 0.02

/** Hermite smoothstep — softer sit/stand XZ ease. */
function smoothstep01(t: number) {
  const x = THREE.MathUtils.clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

type SeatPhase =
  | 'none'
  | 'to-approach'
  | 'wait-chair'
  | 'sit-blend'
  | 'seated'
  | 'pre-stand-turn'
  | 'stand-blend'

export function Operator3D({
  hotspots,
  target,
  ticket,
  onArrive,
  onTap,
  palette,
  introRef,
  home = OPERATOR_HOME,
  tipClassName = 'ops-html-tip',
  lookAtId = null,
  freeWalk = null,
  walkBounds = null,
  walkObstacles = [],
  sitCommand = null,
  standCommand = null,
  onSeated,
  onStood,
  onFreeWalkDone,
  positionRef,
  seatYawRef,
  chairOrientedRef,
  seatTurnYawRef,
}: Props) {
  const group = useRef<THREE.Group>(null)
  const pos = useRef(new THREE.Vector3(...home))
  const goal = useRef(new THREE.Vector3(...home))
  const waypoints = useRef<WalkPoint[]>([])
  const wpIndex = useRef(0)
  /** When true, locomotion trusts the polyline (skip AABB step resolve). */
  const trustPath = useRef(false)
  const pending = useRef<SectionId | null>(null)
  const arriveRef = useRef(onArrive)
  const seatedRef = useRef(onSeated)
  const stoodRef = useRef(onStood)
  const freeWalkDoneRef = useRef(onFreeWalkDone)
  const freeWalkActive = useRef(false)
  const lastFreeTicket = useRef(0)
  const lastSitTicket = useRef(0)
  const lastStandTicket = useRef(0)
  const walkingRef = useRef(false)
  const seatPhase = useRef<SeatPhase>('none')
  const sitBlend = useRef(0)
  const sitTarget = useRef({ x: 0, y: 0, z: 0, yaw: 0 })
  /** World XZ captured when sit-blend begins (approach → seat lerp). */
  const sitFrom = useRef({ x: 0, z: 0 })
  const standTarget = useRef({ x: 0, z: 0 })
  /** Yaw to reach (chair follows) before stand-blend. */
  const standExitYaw = useRef(CHAIR_OUTWARD_YAW)
  const collide = useRef(true)
  const boundsRef = useRef(walkBounds)
  const obstaclesRef = useRef(walkObstacles)
  boundsRef.current = walkBounds
  obstaclesRef.current = walkObstacles

  const [walking, setWalking] = useState(false)
  const [seated, setSeated] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [clip, setClip] = useState<OperatorClip>('idle')
  const marker = useRef<THREE.Mesh>(null)
  const stride = useRef(0)

  const publishSeatYaw = (yaw: number) => {
    if (seatYawRef) seatYawRef.current = yaw
  }

  useEffect(() => {
    arriveRef.current = onArrive
  }, [onArrive])
  useEffect(() => {
    seatedRef.current = onSeated
  }, [onSeated])
  useEffect(() => {
    stoodRef.current = onStood
  }, [onStood])
  useEffect(() => {
    freeWalkDoneRef.current = onFreeWalkDone
  }, [onFreeWalkDone])

  // Walk / idle plane follows home Y (ops-deck 0; craft/skyline may raise floor).
  const floorY = home[1] + STAND_Y_LIFT

  const publishPos = () => {
    if (positionRef) {
      positionRef.current.x = pos.current.x
      positionRef.current.z = pos.current.z
    }
  }

  const setWaypoints = (path: WalkPoint[]) => {
    const cleaned =
      path.length >= 2
        ? path
        : path.length === 1
          ? [{ x: pos.current.x, z: pos.current.z }, path[0]!]
          : [{ x: pos.current.x, z: pos.current.z }]
    let start = 0
    while (
      start < cleaned.length - 1 &&
      Math.hypot(cleaned[start]!.x - pos.current.x, cleaned[start]!.z - pos.current.z) < 0.06
    ) {
      start++
    }
    waypoints.current = cleaned.slice(start)
    wpIndex.current = 0
    trustPath.current = waypoints.current.length > 0
    const first = waypoints.current[0] ?? { x: pos.current.x, z: pos.current.z }
    goal.current.set(first.x, floorY, first.z)
  }

  const applyWalkGoal = (x: number, z: number, path?: WalkPoint[]): boolean => {
    const bounds = boundsRef.current
    const obstacles = obstaclesRef.current
    if (path && path.length > 0) {
      setWaypoints(path)
      return true
    }
    if (bounds && collide.current) {
      const planned = findPath(pos.current.x, pos.current.z, x, z, bounds, obstacles)
      if (!planned) {
        const clamped = clampWalkPoint(x, z, bounds, obstacles)
        const retry = findPath(
          pos.current.x,
          pos.current.z,
          clamped.x,
          clamped.z,
          bounds,
          obstacles,
        )
        if (!retry) return false
        setWaypoints(retry)
        return true
      }
      setWaypoints(planned)
      return true
    }
    setWaypoints([{ x: pos.current.x, z: pos.current.z }, { x, z }])
    return true
  }

  const beginWalk = () => {
    walkingRef.current = true
    queueMicrotask(() => {
      setWalking(true)
      setClip('walk')
    })
  }

  const finishFreeWalkIfNeeded = () => {
    if (!freeWalkActive.current) return
    freeWalkActive.current = false
    queueMicrotask(() => freeWalkDoneRef.current?.())
  }

  const onClipFinished = useCallback((finished: OperatorClip) => {
    if (finished === 'sit-down' && seatPhase.current === 'sit-blend') {
      sitBlend.current = 1
      seatPhase.current = 'seated'
      const st = sitTarget.current
      pos.current.set(st.x, floorY, st.z)
      collide.current = false
      queueMicrotask(() => {
        setSeated(true)
        setWalking(false)
        setClip('sit-idle')
        seatedRef.current?.()
      })
      return
    }
    if (finished === 'stand-up' && seatPhase.current === 'stand-blend') {
      sitBlend.current = 0
      seatPhase.current = 'none'
      collide.current = true
      const sd = standTarget.current
      pos.current.set(sd.x, floorY, sd.z)
      goal.current.set(sd.x, floorY, sd.z)
      queueMicrotask(() => {
        setClip('idle')
        stoodRef.current?.()
      })
    }
  }, [floorY])

  useEffect(() => {
    if (!target || ticket === 0) return
    if (
      seatPhase.current === 'seated' ||
      seatPhase.current === 'sit-blend' ||
      seatPhase.current === 'pre-stand-turn'
    ) {
      return
    }
    if (seatPhase.current === 'to-approach' || seatPhase.current === 'wait-chair') {
      seatPhase.current = 'none'
      sitBlend.current = 0
      collide.current = true
    }
    const spot = hotspots.find((h) => h.id === target)
    if (!spot) return
    finishFreeWalkIfNeeded()
    let ok = false
    if (spot.standPosition) {
      ok = applyWalkGoal(spot.standPosition[0], spot.standPosition[2])
    } else {
      const [x, , z] = spot.position
      ok = applyWalkGoal(x * 0.72, z * 0.72 + (z < 0 ? 0.45 : -0.15))
    }
    if (!ok) return
    pending.current = target
    beginWalk()
  }, [target, ticket, hotspots, floorY])

  useEffect(() => {
    if (!freeWalk || freeWalk.ticket === 0) return
    if (freeWalk.ticket === lastFreeTicket.current) return
    lastFreeTicket.current = freeWalk.ticket
    if (
      seatPhase.current === 'seated' ||
      seatPhase.current === 'sit-blend' ||
      seatPhase.current === 'pre-stand-turn'
    ) {
      return
    }
    if (seatPhase.current === 'to-approach' || seatPhase.current === 'wait-chair') {
      seatPhase.current = 'none'
      sitBlend.current = 0
      collide.current = true
    }
    pending.current = null
    if (!freeWalk.path?.length) return
    if (!applyWalkGoal(freeWalk.x, freeWalk.z, freeWalk.path)) return
    freeWalkActive.current = true
    beginWalk()
  }, [freeWalk, floorY])

  useEffect(() => {
    if (!sitCommand || sitCommand.ticket === 0) return
    if (sitCommand.ticket === lastSitTicket.current) return
    lastSitTicket.current = sitCommand.ticket
    if (seatPhase.current === 'seated' || seatPhase.current === 'sit-blend') return
    pending.current = null
    finishFreeWalkIfNeeded()
    // GLB sit clips keep feet on the floor — ignore procedural sitY lift.
    sitTarget.current = {
      x: sitCommand.sitX,
      y: floorY,
      z: sitCommand.sitZ,
      yaw: sitCommand.faceYaw,
    }
    collide.current = true
    seatPhase.current = 'to-approach'
    sitBlend.current = 0
    if (!applyWalkGoal(sitCommand.approachX, sitCommand.approachZ)) {
      seatPhase.current = 'none'
      return
    }
    beginWalk()
  }, [sitCommand, floorY])

  useEffect(() => {
    if (!standCommand || standCommand.ticket === 0) return
    if (standCommand.ticket === lastStandTicket.current) return
    lastStandTicket.current = standCommand.ticket
    pending.current = null
    standTarget.current = { x: standCommand.standX, z: standCommand.standZ }
    standExitYaw.current = standCommand.exitYaw ?? CHAIR_OUTWARD_YAW

    if (seatPhase.current === 'to-approach' || seatPhase.current === 'wait-chair') {
      seatPhase.current = 'none'
      sitBlend.current = 0
      collide.current = true
      walkingRef.current = false
      goal.current.set(pos.current.x, floorY, pos.current.z)
      queueMicrotask(() => {
        setWalking(false)
        setSeated(false)
        setClip('idle')
        stoodRef.current?.()
      })
      return
    }

    if (
      seatPhase.current !== 'seated' &&
      seatPhase.current !== 'sit-blend' &&
      seatPhase.current !== 'pre-stand-turn'
    ) {
      queueMicrotask(() => stoodRef.current?.())
      return
    }
    collide.current = false
    seatPhase.current = 'pre-stand-turn'
    if (sitBlend.current < 0.99) sitBlend.current = 1
    walkingRef.current = false
    queueMicrotask(() => {
      setWalking(false)
      setSeated(false)
      setClip('sit-idle')
    })
  }, [standCommand, floorY])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return

    const delta = Math.min(dt, 0.05)
    const phase = seatPhase.current

    if (
      phase === 'sit-blend' ||
      phase === 'stand-blend' ||
      phase === 'seated' ||
      phase === 'pre-stand-turn'
    ) {
      if (phase === 'sit-blend') {
        // XZ ease onto chair while Sit_Chair_Down plays (finish → seated).
        sitBlend.current = Math.min(1, sitBlend.current + delta * 1.35)
        const u = smoothstep01(sitBlend.current)
        const st = sitTarget.current
        const from = sitFrom.current
        pos.current.x = THREE.MathUtils.lerp(from.x, st.x, u)
        pos.current.z = THREE.MathUtils.lerp(from.z, st.z, u)
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, st.yaw, 8, delta)
        publishSeatYaw(g.rotation.y)
        g.position.set(pos.current.x, floorY, pos.current.z)
      } else if (phase === 'pre-stand-turn') {
        const st = sitTarget.current
        const exitYaw = standExitYaw.current
        pos.current.set(st.x, floorY, st.z)
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, exitYaw, 5.5, delta)
        st.yaw = g.rotation.y
        publishSeatYaw(g.rotation.y)
        g.position.set(st.x, floorY, st.z)
        if (Math.abs(angleDelta(g.rotation.y, exitYaw)) < 0.08) {
          g.rotation.y = exitYaw
          st.yaw = exitYaw
          publishSeatYaw(exitYaw)
          seatPhase.current = 'stand-blend'
          sitBlend.current = 1
          sitFrom.current = { x: st.x, z: st.z }
          queueMicrotask(() => setClip('stand-up'))
        }
      } else if (phase === 'stand-blend') {
        // Rise clip plays; ease XZ toward approach while standing up.
        sitBlend.current = Math.max(0, sitBlend.current - delta * 1.2)
        const u = smoothstep01(sitBlend.current)
        const st = sitTarget.current
        const sd = standTarget.current
        pos.current.x = THREE.MathUtils.lerp(sd.x, st.x, u)
        pos.current.z = THREE.MathUtils.lerp(sd.z, st.z, u)
        publishSeatYaw(g.rotation.y)
        g.position.set(pos.current.x, floorY, pos.current.z)
      } else {
        // Seated idle — yaw drives character + chair swivel together
        const st = sitTarget.current
        pos.current.set(st.x, floorY, st.z)
        let yaw = st.yaw
        const forced = seatTurnYawRef?.current
        if (forced != null) {
          yaw = forced
        } else if (lookAtId) {
          const spot = hotspots.find((h) => h.id === lookAtId)
          if (spot) {
            const dx = spot.position[0] - pos.current.x
            const dz = spot.position[2] - pos.current.z
            if (dx * dx + dz * dz > 1e-4) yaw = Math.atan2(dx, dz)
          }
        }
        st.yaw = yaw
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, yaw, 6, delta)
        publishSeatYaw(g.rotation.y)
        g.position.set(st.x, floorY, st.z)
      }

      const appearSit = Math.min(1, Math.max(0, (introRef.current - 0.15) / 0.4))
      const easedSit = 1 - Math.pow(1 - appearSit, 3)
      g.scale.setScalar(0.85 + 0.15 * easedSit)
      g.visible = easedSit > 0.05
      publishPos()

      if (marker.current) {
        const mat = marker.current.material as THREE.MeshBasicMaterial
        mat.opacity = seated || phase === 'seated' ? 0.08 : 0.18
        marker.current.scale.setScalar(1)
      }
      return
    }

    const xzDistToGoal = () =>
      Math.hypot(goal.current.x - pos.current.x, goal.current.z - pos.current.z)

    let dist = xzDistToGoal()
    while (dist <= 0.04 && wpIndex.current < waypoints.current.length - 1) {
      wpIndex.current += 1
      const next = waypoints.current[wpIndex.current]!
      goal.current.set(next.x, floorY, next.z)
      dist = xzDistToGoal()
    }
    const isWalking = dist > 0.04

    if (isWalking) {
      walkingRef.current = true
      const step = Math.min(WALK_SPEED * delta, dist)
      const t = step / dist
      const nextX = pos.current.x + (goal.current.x - pos.current.x) * t
      const nextZ = pos.current.z + (goal.current.z - pos.current.z) * t
      const bounds = boundsRef.current
      const obstacles = obstaclesRef.current
      let nx = nextX
      let nz = nextZ
      if (bounds && collide.current && !trustPath.current) {
        const resolved = resolveWalkStep(
          pos.current.x,
          pos.current.z,
          nextX,
          nextZ,
          bounds,
          obstacles,
        )
        nx = resolved.x
        nz = resolved.z
        const moved =
          (nx - pos.current.x) * (nx - pos.current.x) +
          (nz - pos.current.z) * (nz - pos.current.z)
        if (moved < 1e-8) {
          goal.current.set(pos.current.x, floorY, pos.current.z)
          waypoints.current = [{ x: pos.current.x, z: pos.current.z }]
          wpIndex.current = 0
          pending.current = null
          if (seatPhase.current === 'to-approach') {
            seatPhase.current = 'none'
          }
          finishFreeWalkIfNeeded()
        } else {
          pos.current.x = nx
          pos.current.z = nz
        }
      } else {
        pos.current.x = nx
        pos.current.z = nz
      }
      const dirX = goal.current.x - pos.current.x
      const dirZ = goal.current.z - pos.current.z
      if (dirX * dirX + dirZ * dirZ > 1e-6) {
        const angle = Math.atan2(dirX, dirZ)
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, angle, 12, delta)
      }
      stride.current += delta * 11.5
    } else {
      if (walkingRef.current) {
        walkingRef.current = false
        trustPath.current = false
        queueMicrotask(() => {
          setWalking(false)
          if (seatPhase.current === 'none') setClip('idle')
        })
        finishFreeWalkIfNeeded()
        if (seatPhase.current === 'to-approach') {
          collide.current = false
          if (chairOrientedRef && !chairOrientedRef.current) {
            seatPhase.current = 'wait-chair'
            queueMicrotask(() => setClip('idle'))
          } else {
            seatPhase.current = 'sit-blend'
            sitBlend.current = 0
            sitFrom.current = { x: pos.current.x, z: pos.current.z }
            queueMicrotask(() => setClip('sit-down'))
          }
        } else if (pending.current) {
          const arrived = pending.current
          pending.current = null
          arriveRef.current(arrived)
        }
      } else if (seatPhase.current === 'wait-chair') {
        const faceYaw = sitTarget.current.yaw
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, faceYaw, 8, delta)
        if (!chairOrientedRef || chairOrientedRef.current) {
          collide.current = false
          seatPhase.current = 'sit-blend'
          sitBlend.current = 0
          sitFrom.current = { x: pos.current.x, z: pos.current.z }
          queueMicrotask(() => setClip('sit-down'))
        }
      } else if (lookAtId) {
        const spot = hotspots.find((h) => h.id === lookAtId)
        if (spot) {
          const dx = spot.position[0] - pos.current.x
          const dz = spot.position[2] - pos.current.z
          if (dx * dx + dz * dz > 1e-4) {
            const angle = Math.atan2(dx, dz)
            g.rotation.y = THREE.MathUtils.damp(g.rotation.y, angle, 6, delta)
          }
        }
      }
    }

    const appear = Math.min(1, Math.max(0, (introRef.current - 0.15) / 0.4))
    const eased = 1 - Math.pow(1 - appear, 3)
    g.scale.setScalar(0.85 + 0.15 * eased)
    g.visible = eased > 0.05
    g.position.set(pos.current.x, floorY, pos.current.z)
    publishPos()

    if (marker.current) {
      const mat = marker.current.material as THREE.MeshBasicMaterial
      const base = hovered || walking ? 0.42 : 0.18
      mat.opacity = walking ? base + Math.sin(stride.current * 0.5) * 0.12 : base
      const pulse = walking ? 1 + Math.sin(stride.current * 0.5) * 0.12 : 1
      marker.current.scale.setScalar(pulse)
    }
  })

  return (
    <group
      ref={group}
      position={home}
      onClick={(e) => {
        e.stopPropagation()
        onTap()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <OperatorAvatar
        clip={clip}
        highlight={hovered || walking}
        onClipFinished={onClipFinished}
      />

      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.18, 0.28, 24]} />
        <meshBasicMaterial color={palette.accent} transparent opacity={0.14} depthWrite={false} />
      </mesh>

      {(hovered || walking || seated) && (
        <Html
          position={[0, seated ? 1.15 : 1.35, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div className={tipClassName}>
            {seated ? '就座中' : walking ? '巡航中' : '派遣巡视'}
          </div>
        </Html>
      )}
    </group>
  )
}
