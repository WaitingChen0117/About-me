import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
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

export type CollectorPose = {
  headTiltX: number
  headTiltY: number
  leftArmRaise: number
  rightArmRaise: number
  leftFootLift: number
  rightFootLift: number
}

export type CollectorHandles = {
  head: THREE.Group | null
  handL: THREE.Group | null
  handR: THREE.Group | null
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
  /** Collector-box mode: disable studio UI (hover labels, tooltips). */
  collectorMode?: boolean
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
  /** Collector-box part pose — applied each frame after idle limb damping. */
  collectorPoseRef?: MutableRefObject<CollectorPose>
  /** Live head / hand groups so the box can attach cup and laptop to the hands. */
  collectorHandlesRef?: MutableRefObject<CollectorHandles>
}

/** Shortest signed angle from `from` to `to` in (−π, π]. */
function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

const WALK_SPEED = 2.55

/**
 * Chibi sole bottoms sit ~0.13 below the group origin; lift standing height
 * so feet rest on the floor after bob damps out (avoids post-walk sink).
 */
const STAND_Y_LIFT = 0.14

/** Hermite smoothstep — softer sit/stand than raw linear or quadratic. */
function smoothstep01(t: number) {
  const x = THREE.MathUtils.clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

/** Standing knee offset along the thigh (local −Y). */
const CALF_Y_STAND = -0.2
/**
 * Seated knee further along the thigh so the knee clears the seat front
 * (~0.34 half-depth) and calves can hang in open air.
 */
const CALF_Y_SIT = -0.36

/** Blind-box / Pop-Mart palette from the turnaround sheet (stable across day/night). */
const FIG = {
  skin: '#e8d4c4',
  skinShade: '#d9c0ae',
  hair: '#b08a68',
  hairDeep: '#8f6d4f',
  eye: '#3a2418',
  glasses: '#1a1a1c',
  hoodie: '#141416',
  hoodieSoft: '#1e1e22',
  pants: '#161618',
  logo: '#f4f4f6',
  sole: '#f2f2f4',
  sneakerRed: '#c4282e',
  sneakerBlue: '#2a4f9a',
  lace: '#ececef',
} as const

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
  collectorMode = false,
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
  collectorPoseRef,
  collectorHandlesRef,
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
  const stride = useRef(0)
  const bob = useRef(0)

  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const calfL = useRef<THREE.Group>(null)
  const calfR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const handL = useRef<THREE.Group>(null)
  const handR = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Mesh>(null)
  const marker = useRef<THREE.Mesh>(null)
  /** 0 = standing legs, 1 = explicit L-sit leg meshes */
  const sitAmountRef = useRef(0)

  const publishSeatYaw = (yaw: number) => {
    if (seatYawRef) seatYawRef.current = yaw
  }

  const resetLimbPose = () => {
    if (legL.current) legL.current.rotation.x = 0
    if (legR.current) legR.current.rotation.x = 0
    if (calfL.current) {
      calfL.current.rotation.x = 0
      calfL.current.position.set(0, CALF_Y_STAND, 0)
    }
    if (calfR.current) {
      calfR.current.rotation.x = 0
      calfR.current.position.set(0, CALF_Y_STAND, 0)
    }
    if (armL.current) armL.current.rotation.x = 0
    if (armR.current) armR.current.rotation.x = 0
  }

  const vinyl = collectorMode
  const materials = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({
        color: FIG.skin,
        roughness: vinyl ? 0.42 : 0.82,
        metalness: vinyl ? 0.05 : 0.02,
      }),
      hair: new THREE.MeshStandardMaterial({
        color: FIG.hair,
        roughness: vinyl ? 0.68 : 0.92,
        metalness: 0.0,
      }),
      hairDeep: new THREE.MeshStandardMaterial({
        color: FIG.hairDeep,
        roughness: vinyl ? 0.7 : 0.94,
        metalness: 0.0,
      }),
      hoodie: new THREE.MeshStandardMaterial({
        color: FIG.hoodie,
        roughness: vinyl ? 0.52 : 0.88,
        metalness: vinyl ? 0.06 : 0.04,
        emissive: new THREE.Color(FIG.hoodieSoft),
        emissiveIntensity: vinyl ? 0.04 : 0.02,
      }),
      pants: new THREE.MeshStandardMaterial({
        color: FIG.pants,
        roughness: 0.9,
        metalness: 0.02,
      }),
      glasses: new THREE.MeshStandardMaterial({
        color: FIG.glasses,
        roughness: 0.35,
        metalness: 0.15,
      }),
      logo: new THREE.MeshStandardMaterial({
        color: FIG.logo,
        roughness: 0.55,
        metalness: 0.05,
      }),
      sole: new THREE.MeshStandardMaterial({
        color: FIG.sole,
        roughness: 0.7,
        metalness: 0.05,
      }),
      red: new THREE.MeshStandardMaterial({
        color: FIG.sneakerRed,
        roughness: 0.55,
        metalness: 0.08,
      }),
      blue: new THREE.MeshStandardMaterial({
        color: FIG.sneakerBlue,
        roughness: 0.58,
        metalness: 0.1,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: FIG.eye,
        roughness: 0.4,
        metalness: 0.05,
      }),
      eyeWhite: new THREE.MeshStandardMaterial({
        color: '#f7f4f0',
        roughness: vinyl ? 0.32 : 0.45,
        metalness: 0.02,
      }),
    }),
    [vinyl],
  )

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

  // Walk / idle plane follows home Y so scenes can raise or lower the floor
  // without rewriting bob math (ops-deck home Y is 0; craft-lab stays on floor).
  const floorY = home[1] + STAND_Y_LIFT

  useEffect(() => {
    const g = group.current
    if (!g || !collectorMode) return
    // Invisible part hit boxes in FigureInBox own pointer events in the box.
    g.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.raycast = () => {}
      }
    })
  }, [collectorMode])

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
    // Skip a leading point we're already standing on.
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

  /**
   * Plan a route around furniture. Returns false when the goal is unreachable
   * (caller should abort — no walk). Precomputed `path` skips A*.
   */
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
        // Fallback: if goal itself is walkable after soft-clamp (patrol), try clamped.
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
    queueMicrotask(() => setWalking(true))
  }

  const finishFreeWalkIfNeeded = () => {
    if (!freeWalkActive.current) return
    freeWalkActive.current = false
    queueMicrotask(() => freeWalkDoneRef.current?.())
  }

  useEffect(() => {
    if (!target || ticket === 0) return
    // Section patrol cancels an in-flight sit approach (stand path owns that).
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
    // Free walk cancels an in-flight section patrol so we don't open a panel later.
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
    sitTarget.current = {
      x: sitCommand.sitX,
      y: sitCommand.sitY,
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
      // Abort walk-to-sit; pending after-stand owns the next goal.
      seatPhase.current = 'none'
      sitBlend.current = 0
      collide.current = true
      walkingRef.current = false
      goal.current.set(pos.current.x, floorY, pos.current.z)
      queueMicrotask(() => {
        setWalking(false)
        setSeated(false)
        stoodRef.current?.()
      })
      return
    }

    if (
      seatPhase.current !== 'seated' &&
      seatPhase.current !== 'sit-blend' &&
      seatPhase.current !== 'pre-stand-turn'
    ) {
      // Already standing — still ack so pending actions can run.
      queueMicrotask(() => stoodRef.current?.())
      return
    }
    // Chair + body turn aisle-outward FIRST; stand-blend waits until aligned.
    collide.current = false
    seatPhase.current = 'pre-stand-turn'
    if (sitBlend.current < 0.99) sitBlend.current = 1
    walkingRef.current = false
    queueMicrotask(() => {
      setWalking(false)
      setSeated(false)
    })
  }, [standCommand, floorY])

  const applyCollectorPose = () => {
    if (collectorHandlesRef) {
      collectorHandlesRef.current.head = head.current
      collectorHandlesRef.current.handL = handL.current
      collectorHandlesRef.current.handR = handR.current
    }
    const pose = collectorPoseRef?.current
    if (!collectorMode || !pose) return
    if (head.current) {
      head.current.rotation.x = pose.headTiltX
      head.current.rotation.y = pose.headTiltY
    }
    if (armL.current) armL.current.rotation.x = -pose.leftArmRaise
    if (armR.current) armR.current.rotation.x = -pose.rightArmRaise
    if (legL.current) legL.current.rotation.x = -pose.leftFootLift
    if (legR.current) legR.current.rotation.x = -pose.rightFootLift
  }

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return

    const delta = Math.min(dt, 0.05)
    const phase = seatPhase.current

    // —— Sit / stand blends (skip normal walk locomotion) ——
    if (
      phase === 'sit-blend' ||
      phase === 'stand-blend' ||
      phase === 'seated' ||
      phase === 'pre-stand-turn'
    ) {
      bob.current = THREE.MathUtils.damp(bob.current, 0, 10, delta)

      if (phase === 'sit-blend') {
        // Chair already faces the character — ease body onto the seat.
        sitBlend.current = Math.min(1, sitBlend.current + delta * 1.45)
        const u = smoothstep01(sitBlend.current)
        const st = sitTarget.current
        const from = sitFrom.current
        pos.current.x = THREE.MathUtils.lerp(from.x, st.x, u)
        pos.current.z = THREE.MathUtils.lerp(from.z, st.z, u)
        const y = THREE.MathUtils.lerp(floorY, st.y, u)
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, st.yaw, 8, delta)
        publishSeatYaw(g.rotation.y)
        sitAmountRef.current = u
        applySitPose(legL, legR, calfL, calfR, armL, armR, u)
        g.position.set(pos.current.x, y, pos.current.z)
        if (sitBlend.current >= 1) {
          seatPhase.current = 'seated'
          pos.current.set(st.x, st.y, st.z)
          collide.current = false
          queueMicrotask(() => {
            setSeated(true)
            setWalking(false)
            seatedRef.current?.()
          })
        }
      } else if (phase === 'pre-stand-turn') {
        // Rotate chair+body to aisle FIRST; only then rise (no backrest clip).
        const st = sitTarget.current
        const exitYaw = standExitYaw.current
        pos.current.set(st.x, st.y, st.z)
        sitAmountRef.current = Math.max(sitAmountRef.current, sitBlend.current)
        applySitPose(legL, legR, calfL, calfR, armL, armR, sitAmountRef.current)
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, exitYaw, 5.5, delta)
        st.yaw = g.rotation.y
        publishSeatYaw(g.rotation.y)
        g.position.set(st.x, st.y, st.z)
        if (Math.abs(angleDelta(g.rotation.y, exitYaw)) < 0.08) {
          g.rotation.y = exitYaw
          st.yaw = exitYaw
          publishSeatYaw(exitYaw)
          seatPhase.current = 'stand-blend'
          if (sitBlend.current < 0.99) sitBlend.current = 1
        }
      } else if (phase === 'stand-blend') {
        // Chair already aisle-facing — rise and step to approach.
        sitBlend.current = Math.max(0, sitBlend.current - delta * 1.55)
        const u = smoothstep01(sitBlend.current)
        const st = sitTarget.current
        const sd = standTarget.current
        pos.current.x = THREE.MathUtils.lerp(sd.x, st.x, u)
        pos.current.z = THREE.MathUtils.lerp(sd.z, st.z, u)
        const y = THREE.MathUtils.lerp(floorY, st.y, u)
        sitAmountRef.current = u
        applySitPose(legL, legR, calfL, calfR, armL, armR, u)
        publishSeatYaw(g.rotation.y)
        g.position.set(pos.current.x, y, pos.current.z)
        if (sitBlend.current <= 0.001) {
          sitBlend.current = 0
          sitAmountRef.current = 0
          seatPhase.current = 'none'
          collide.current = true
          pos.current.set(sd.x, floorY, sd.z)
          goal.current.set(sd.x, floorY, sd.z)
          resetLimbPose()
          g.position.set(sd.x, floorY, sd.z)
          queueMicrotask(() => stoodRef.current?.())
        }
      } else {
        // Seated idle — hold pose; yaw drives character + chair swivel together
        const st = sitTarget.current
        pos.current.set(st.x, st.y, st.z)
        sitAmountRef.current = 1
        applySitPose(legL, legR, calfL, calfR, armL, armR, 1)
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
        // Persist yaw so stand-blend / re-sit keep the last facing
        st.yaw = yaw
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, yaw, 6, delta)
        publishSeatYaw(g.rotation.y)
        g.position.set(st.x, st.y, st.z)
      }

      const appearSit = Math.min(1, Math.max(0, (introRef.current - 0.15) / 0.4))
      const easedSit = 1 - Math.pow(1 - appearSit, 3)
      g.scale.setScalar(0.7 + 0.3 * easedSit)
      g.visible = easedSit > 0.05
      publishPos()

      if (marker.current) {
        const mat = marker.current.material as THREE.MeshBasicMaterial
        mat.opacity = seated || phase === 'seated' ? 0.08 : 0.18
        marker.current.scale.setScalar(1)
      }
      if (torso.current) {
        const mat = torso.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.03
      }
      applyCollectorPose()
      return
    }

    sitAmountRef.current = 0

    // XZ-only distance — pos.y stays at home/sit while floorY is lifted for
    // sole clearance; Vector3.distanceTo would never drop below STAND_Y_LIFT.
    const xzDistToGoal = () =>
      Math.hypot(goal.current.x - pos.current.x, goal.current.z - pos.current.z)

    // Advance along polyline waypoints before testing arrival.
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
      // Planned A* polylines are already clear — don't re-collide or we stop short
      // of corners where grid cells sit flush against inflated furniture.
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
        // Blocked mid-path — stop rather than jitter.
        const moved =
          (nx - pos.current.x) * (nx - pos.current.x) +
          (nz - pos.current.z) * (nz - pos.current.z)
        if (moved < 1e-8) {
          goal.current.set(pos.current.x, floorY, pos.current.z)
          waypoints.current = [{ x: pos.current.x, z: pos.current.z }]
          wpIndex.current = 0
          // Drop pending so we don't open a panel after bouncing off a desk.
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
      bob.current = Math.abs(Math.sin(stride.current)) * 0.045
      const swing = Math.sin(stride.current) * 0.62
      const armSwing = Math.sin(stride.current) * 0.55
      if (legL.current) legL.current.rotation.x = swing
      if (legR.current) legR.current.rotation.x = -swing
      if (armL.current) armL.current.rotation.x = -armSwing
      if (armR.current) armR.current.rotation.x = armSwing
    } else {
      // Snap bob out quickly so soles don't hang mid-sink after arrival.
      bob.current = THREE.MathUtils.damp(bob.current, 0, 14, delta)
      if (walkingRef.current) {
        walkingRef.current = false
        trustPath.current = false
        bob.current = 0
        queueMicrotask(() => setWalking(false))
        resetLimbPose()
        finishFreeWalkIfNeeded()
        if (seatPhase.current === 'to-approach') {
          // Reached approach — wait until chair faces the character, then sit.
          collide.current = false
          if (chairOrientedRef && !chairOrientedRef.current) {
            seatPhase.current = 'wait-chair'
          } else {
            seatPhase.current = 'sit-blend'
            sitBlend.current = 0
            sitFrom.current = { x: pos.current.x, z: pos.current.z }
          }
        } else if (pending.current) {
          const arrived = pending.current
          pending.current = null
          arriveRef.current(arrived)
        }
      } else if (seatPhase.current === 'wait-chair') {
        // Stand at approach until the chair finishes rotating toward us.
        const faceYaw = sitTarget.current.yaw
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, faceYaw, 8, delta)
        if (!chairOrientedRef || chairOrientedRef.current) {
          collide.current = false
          seatPhase.current = 'sit-blend'
          sitBlend.current = 0
          sitFrom.current = { x: pos.current.x, z: pos.current.z }
        }
      } else {
        if (legL.current) legL.current.rotation.x = THREE.MathUtils.damp(legL.current.rotation.x, 0, 10, delta)
        if (legR.current) legR.current.rotation.x = THREE.MathUtils.damp(legR.current.rotation.x, 0, 10, delta)
        if (calfL.current) {
          calfL.current.rotation.x = THREE.MathUtils.damp(calfL.current.rotation.x, 0, 10, delta)
          calfL.current.position.y = THREE.MathUtils.damp(calfL.current.position.y, CALF_Y_STAND, 10, delta)
          calfL.current.position.z = THREE.MathUtils.damp(calfL.current.position.z, 0, 10, delta)
        }
        if (calfR.current) {
          calfR.current.rotation.x = THREE.MathUtils.damp(calfR.current.rotation.x, 0, 10, delta)
          calfR.current.position.y = THREE.MathUtils.damp(calfR.current.position.y, CALF_Y_STAND, 10, delta)
          calfR.current.position.z = THREE.MathUtils.damp(calfR.current.position.z, 0, 10, delta)
        }
        if (armL.current) armL.current.rotation.x = THREE.MathUtils.damp(armL.current.rotation.x, 0, 10, delta)
        if (armR.current) armR.current.rotation.x = THREE.MathUtils.damp(armR.current.rotation.x, 0, 10, delta)

        // Idle: face the focused hotspot (atan2 look-at)
        if (lookAtId) {
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
    }

    const appear = Math.min(1, Math.max(0, (introRef.current - 0.15) / 0.4))
    const eased = 1 - Math.pow(1 - appear, 3)
    g.scale.setScalar(0.7 + 0.3 * eased)
    g.visible = eased > 0.05
    g.position.set(pos.current.x, floorY + bob.current, pos.current.z)
    publishPos()

    if (marker.current) {
      const mat = marker.current.material as THREE.MeshBasicMaterial
      const base = hovered || walking ? 0.42 : 0.18
      mat.opacity = walking ? base + Math.sin(stride.current * 0.5) * 0.12 : base
      const pulse = walking ? 1 + Math.sin(stride.current * 0.5) * 0.12 : 1
      marker.current.scale.setScalar(pulse)
    }

    if (torso.current) {
      const mat = torso.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = hovered || walking ? 0.08 : 0.02
    }

    applyCollectorPose()
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
        if (!collectorMode) {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }
      }}
      onPointerOut={() => {
        if (!collectorMode) {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }
      }}
    >
      {/* Pop-Mart / blind-box operator from turnaround sheet */}
      <ChibiFigure
        materials={materials}
        torsoRef={torso}
        headRef={head}
        armL={armL}
        armR={armR}
        handL={handL}
        handR={handR}
        legL={legL}
        legR={legR}
        calfL={calfL}
        calfR={calfR}
        sitAmountRef={sitAmountRef}
      />

      {!collectorMode && (
        <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[0.18, 0.28, 24]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.14} depthWrite={false} />
        </mesh>
      )}

      {!collectorMode && (hovered || walking || seated) && (
        <Html position={[0, seated ? 1.28 : 1.42, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className={tipClassName}>
            {seated ? '就座中' : walking ? '巡航中' : '派遣巡视'}
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * True chair sit: thighs ≈ horizontal on the cushion, knees at the front
 * edge, calves hanging down, feet near the pedestal — not folded under.
 *
 * Three.js +X rotation takes −Y toward −Z; sit uses the opposite signs
 * (neg thigh → lap toward local +Z / front, pos calf → shin down).
 */
function applySitPose(
  legL: RefObject<THREE.Group | null>,
  legR: RefObject<THREE.Group | null>,
  calfL: RefObject<THREE.Group | null>,
  calfR: RefObject<THREE.Group | null>,
  armL: RefObject<THREE.Group | null>,
  armR: RefObject<THREE.Group | null>,
  amount: number,
) {
  const a = THREE.MathUtils.clamp(amount, 0, 1)
  const thigh = a * -1.52 // ~87° → lap
  const shin = a * 1.48 // ~85° knee → calf nearly vertical
  const calfY = THREE.MathUtils.lerp(CALF_Y_STAND, CALF_Y_SIT, a)
  if (legL.current) legL.current.rotation.x = thigh
  if (legR.current) legR.current.rotation.x = thigh
  if (calfL.current) {
    calfL.current.rotation.x = shin
    calfL.current.position.set(0, calfY, a * 0.02)
  }
  if (calfR.current) {
    calfR.current.rotation.x = shin
    calfR.current.position.set(0, calfY, a * 0.02)
  }
  if (armL.current) armL.current.rotation.x = a * -0.35
  if (armR.current) armR.current.rotation.x = a * -0.28
}

type FigMats = {
  skin: THREE.MeshStandardMaterial
  hair: THREE.MeshStandardMaterial
  hairDeep: THREE.MeshStandardMaterial
  hoodie: THREE.MeshStandardMaterial
  pants: THREE.MeshStandardMaterial
  glasses: THREE.MeshStandardMaterial
  logo: THREE.MeshStandardMaterial
  sole: THREE.MeshStandardMaterial
  red: THREE.MeshStandardMaterial
  blue: THREE.MeshStandardMaterial
  eye: THREE.MeshStandardMaterial
  eyeWhite: THREE.MeshStandardMaterial
}

function ChibiFigure({
  materials: m,
  torsoRef,
  headRef,
  armL,
  armR,
  handL,
  handR,
  legL,
  legR,
  calfL,
  calfR,
  sitAmountRef,
}: {
  materials: FigMats
  torsoRef: RefObject<THREE.Mesh | null>
  headRef: RefObject<THREE.Group | null>
  armL: RefObject<THREE.Group | null>
  armR: RefObject<THREE.Group | null>
  handL: RefObject<THREE.Group | null>
  handR: RefObject<THREE.Group | null>
  legL: RefObject<THREE.Group | null>
  legR: RefObject<THREE.Group | null>
  calfL: RefObject<THREE.Group | null>
  calfR: RefObject<THREE.Group | null>
  sitAmountRef: MutableRefObject<number>
}) {
  const standLegs = useRef<THREE.Group>(null)
  const sitLegs = useRef<THREE.Group>(null)

  useFrame(() => {
    const a = THREE.MathUtils.clamp(sitAmountRef.current, 0, 1)
    if (standLegs.current) {
      standLegs.current.visible = a < 0.98
      standLegs.current.scale.setScalar(1 - a * 0.85)
    }
    if (sitLegs.current) {
      sitLegs.current.visible = a > 0.02
      sitLegs.current.scale.setScalar(0.15 + 0.85 * a)
    }
  })

  return (
    <group>
      {/* —— Head (oversized vinyl ball) —— */}
      <group ref={headRef} position={[0, 0.94, 0]}>
        <mesh castShadow material={m.skin}>
          <sphereGeometry args={[0.24, 28, 22]} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.225, 0.015, -0.02]} castShadow material={m.skin}>
          <sphereGeometry args={[0.042, 12, 10]} />
        </mesh>
        <mesh position={[0.225, 0.015, -0.02]} castShadow material={m.skin}>
          <sphereGeometry args={[0.042, 12, 10]} />
        </mesh>

        {/* Eyes — kept clear of bangs so round glasses read */}
        <mesh position={[-0.078, 0.01, 0.2]} material={m.eyeWhite}>
          <sphereGeometry args={[0.042, 12, 10]} />
        </mesh>
        <mesh position={[0.078, 0.01, 0.2]} material={m.eyeWhite}>
          <sphereGeometry args={[0.042, 12, 10]} />
        </mesh>
        <mesh position={[-0.078, 0.006, 0.232]} material={m.eye}>
          <sphereGeometry args={[0.026, 12, 10]} />
        </mesh>
        <mesh position={[0.078, 0.006, 0.232]} material={m.eye}>
          <sphereGeometry args={[0.026, 12, 10]} />
        </mesh>
        <mesh position={[-0.066, 0.018, 0.25]}>
          <sphereGeometry args={[0.007, 8, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.09, 0.018, 0.25]}>
          <sphereGeometry args={[0.007, 8, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Tiny mouth */}
        <mesh position={[0, -0.06, 0.225]} material={m.glasses}>
          <sphereGeometry args={[0.012, 8, 6]} />
        </mesh>

        <Glasses materials={m} />
        <Hair materials={m} />
      </group>

      {/* —— Oversized black hoodie torso —— */}
      <mesh ref={torsoRef} position={[0, 0.52, 0]} castShadow material={m.hoodie}>
        <capsuleGeometry args={[0.2, 0.22, 8, 16]} />
      </mesh>
      {/* Extra bulk for oversized silhouette */}
      <mesh position={[0, 0.58, 0.02]} castShadow material={m.hoodie}>
        <sphereGeometry args={[0.24, 20, 16]} />
      </mesh>
      {/* Hoodie hem rib */}
      <mesh position={[0, 0.34, 0]} castShadow material={m.hoodie}>
        <cylinderGeometry args={[0.21, 0.2, 0.06, 20]} />
      </mesh>
      {/* Kangaroo pocket */}
      <mesh position={[0, 0.46, 0.17]} castShadow material={m.hoodie}>
        <boxGeometry args={[0.22, 0.12, 0.06]} />
      </mesh>
      {/* Hood on back */}
      <mesh position={[0, 0.7, -0.12]} castShadow material={m.hoodie}>
        <sphereGeometry args={[0.14, 16, 12]} />
      </mesh>

      {/* White rabbit chest logo (wearer's left = +X when facing +Z) */}
      <group position={[0.1, 0.62, 0.22]}>
        <mesh material={m.logo}>
          <sphereGeometry args={[0.028, 12, 10]} />
        </mesh>
        <mesh position={[-0.016, 0.038, 0]} rotation={[0, 0, 0.35]} material={m.logo}>
          <capsuleGeometry args={[0.008, 0.03, 4, 8]} />
        </mesh>
        <mesh position={[0.016, 0.038, 0]} rotation={[0, 0, -0.35]} material={m.logo}>
          <capsuleGeometry args={[0.008, 0.03, 4, 8]} />
        </mesh>
      </group>

      {/* —— Arms (short, chunky hoodie sleeves) —— */}
      <group ref={armL} position={[-0.26, 0.58, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow material={m.hoodie}>
          <capsuleGeometry args={[0.07, 0.14, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.24, 0]} castShadow material={m.hoodie}>
          <cylinderGeometry args={[0.065, 0.06, 0.05, 12]} />
        </mesh>
        <mesh position={[0, -0.28, 0.01]} castShadow material={m.skin}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
        <group ref={handL} position={[0, -0.28, 0.06]} />
      </group>
      <group ref={armR} position={[0.26, 0.58, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow material={m.hoodie}>
          <capsuleGeometry args={[0.07, 0.14, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.24, 0]} castShadow material={m.hoodie}>
          <cylinderGeometry args={[0.065, 0.06, 0.05, 12]} />
        </mesh>
        <mesh position={[0, -0.28, 0.01]} castShadow material={m.skin}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
        <group ref={handR} position={[0, -0.28, 0.06]} />
      </group>

      {/* —— Standing / walk legs (hidden when fully seated) —— */}
      <group ref={standLegs}>
        <group ref={legL} position={[-0.09, 0.32, 0]}>
          <mesh position={[0, -0.1, 0]} castShadow material={m.pants}>
            <capsuleGeometry args={[0.075, 0.12, 6, 12]} />
          </mesh>
          <group ref={calfL} position={[0, CALF_Y_STAND, 0]}>
            <mesh position={[0, -0.08, 0]} castShadow material={m.pants}>
              <capsuleGeometry args={[0.068, 0.06, 6, 12]} />
            </mesh>
            <mesh position={[0, -0.14, 0]} castShadow material={m.pants}>
              <cylinderGeometry args={[0.062, 0.052, 0.04, 12]} />
            </mesh>
            <Sneaker materials={m} yOffset={-0.2} />
          </group>
        </group>
        <group ref={legR} position={[0.09, 0.32, 0]}>
          <mesh position={[0, -0.1, 0]} castShadow material={m.pants}>
            <capsuleGeometry args={[0.075, 0.12, 6, 12]} />
          </mesh>
          <group ref={calfR} position={[0, CALF_Y_STAND, 0]}>
            <mesh position={[0, -0.08, 0]} castShadow material={m.pants}>
              <capsuleGeometry args={[0.068, 0.06, 6, 12]} />
            </mesh>
            <mesh position={[0, -0.14, 0]} castShadow material={m.pants}>
              <cylinderGeometry args={[0.062, 0.052, 0.04, 12]} />
            </mesh>
            <Sneaker materials={m} yOffset={-0.2} />
          </group>
        </group>
      </group>

      {/*
        Explicit L-sit legs in character space (no nested Euler):
        hip → horizontal thigh along +Z (front) → knee at seat edge →
        vertical calf down −Y → feet near floor / pedestal.
      */}
      <group ref={sitLegs} visible={false}>
        <SitLeg materials={m} side={-1} />
        <SitLeg materials={m} side={1} />
      </group>
    </group>
  )
}

/** One L-shaped sit leg; `side` is −1 left / +1 right. */
function SitLeg({ materials: m, side }: { materials: FigMats; side: number }) {
  const x = side * 0.1
  // Character-local L: hip on cushion → thigh along +Z → calf down −Y to near floor.
  // Seat top ≈ 0.46 world; with CHAIR_SIT.y=0.15, hipY 0.30 → world ≈ 0.45.
  const hipY = 0.3
  const thighLen = 0.36
  const kneeZ = thighLen
  const kneeY = hipY
  // With CHAIR_SIT.y ≈ 0.15, footY -0.10 → world ≈ 0.05 (pedestal / floor).
  const footY = -0.1
  const calfLen = kneeY - footY
  return (
    <group>
      {/* Thigh — capsule default along Y, rotate onto +Z (lap on seat) */}
      <mesh
        position={[x, hipY, kneeZ * 0.5]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        material={m.pants}
      >
        <capsuleGeometry args={[0.08, thighLen * 0.62, 6, 12]} />
      </mesh>
      {/* Calf hanging straight down from the seat front edge */}
      <mesh
        position={[x, kneeY - calfLen * 0.5, kneeZ]}
        castShadow
        material={m.pants}
      >
        <capsuleGeometry args={[0.072, calfLen * 0.55, 6, 12]} />
      </mesh>
      <mesh position={[x, footY + 0.08, kneeZ]} castShadow material={m.pants}>
        <cylinderGeometry args={[0.065, 0.055, 0.045, 12]} />
      </mesh>
      {/* Sneakers by the pedestal / floor, past the seat front */}
      <group position={[x, footY, kneeZ + 0.04]} scale={[1.2, 1.15, 1.25]}>
        <mesh position={[0, 0.0, 0.02]} castShadow material={m.sole}>
          <boxGeometry args={[0.13, 0.04, 0.22]} />
        </mesh>
        <mesh position={[0.055, 0.035, 0.0]} castShadow material={m.blue}>
          <boxGeometry args={[0.04, 0.07, 0.16]} />
        </mesh>
        <mesh position={[-0.055, 0.035, 0.0]} castShadow material={m.blue}>
          <boxGeometry args={[0.04, 0.07, 0.16]} />
        </mesh>
        <mesh position={[0, 0.03, 0.1]} castShadow material={m.red}>
          <boxGeometry args={[0.12, 0.055, 0.07]} />
        </mesh>
        <mesh position={[0, 0.05, -0.085]} castShadow material={m.red}>
          <boxGeometry args={[0.12, 0.09, 0.055]} />
        </mesh>
      </group>
    </group>
  )
}

function Glasses({ materials: m }: { materials: FigMats }) {
  // Torus defaults to XY plane (faces +Z) — do not tilt flat or rims read as a mustache
  const r = 0.062
  const tube = 0.015
  const z = 0.238
  const y = 0.012
  return (
    <group>
      <mesh position={[-0.078, y, z]} material={m.glasses}>
        <torusGeometry args={[r, tube, 12, 32]} />
      </mesh>
      <mesh position={[0.078, y, z]} material={m.glasses}>
        <torusGeometry args={[r, tube, 12, 32]} />
      </mesh>
      <mesh position={[0, y + 0.006, z]} material={m.glasses}>
        <boxGeometry args={[0.032, 0.012, 0.012]} />
      </mesh>
      <mesh position={[-0.14, y, 0.1]} rotation={[0, 0.22, 0]} material={m.glasses}>
        <boxGeometry args={[0.014, 0.012, 0.2]} />
      </mesh>
      <mesh position={[0.14, y, 0.1]} rotation={[0, -0.22, 0]} material={m.glasses}>
        <boxGeometry args={[0.014, 0.012, 0.2]} />
      </mesh>
    </group>
  )
}

function Hair({ materials: m }: { materials: FigMats }) {
  // Crown + side waves only — keep forehead / glasses clear (no heavy bangs)
  const locks: Array<[number, number, number, number]> = [
    [0, 0.2, -0.04, 0.2],
    [0, 0.16, -0.14, 0.175],
    [-0.13, 0.16, -0.06, 0.145],
    [0.13, 0.16, -0.06, 0.145],
    [-0.17, 0.1, 0.0, 0.115],
    [0.17, 0.1, 0.0, 0.115],
    [-0.12, 0.14, 0.08, 0.1],
    [0.12, 0.14, 0.08, 0.1],
    [0, 0.18, 0.06, 0.12],
    [-0.21, 0.02, -0.02, 0.1],
    [0.21, 0.02, -0.02, 0.1],
    [-0.19, -0.04, -0.1, 0.09],
    [0.19, -0.04, -0.1, 0.09],
    [-0.16, 0.08, 0.1, 0.08],
    [0.16, 0.08, 0.1, 0.08],
    // Soft high fringe — sits above glasses, not over lenses
    [-0.07, 0.14, 0.16, 0.06],
    [0.07, 0.14, 0.16, 0.06],
    [0, 0.15, 0.17, 0.055],
  ]

  return (
    <group>
      {locks.map(([x, y, z, r], i) => (
        <mesh
          key={i}
          position={[x, y, z]}
          castShadow
          material={i % 3 === 0 ? m.hairDeep : m.hair}
          scale={i < 4 ? [1.12, 0.88, 1.05] : [1, 1, 1]}
        >
          <sphereGeometry args={[r, 14, 12]} />
        </mesh>
      ))}
    </group>
  )
}

function Sneaker({ materials: m, yOffset = -0.26 }: { materials: FigMats; yOffset?: number }) {
  // Chunkier high-tops so red / white / blue read at room scale
  return (
    <group position={[0, yOffset, 0.03]} scale={[1.15, 1.1, 1.2]}>
      <mesh position={[0, -0.01, 0.02]} castShadow material={m.sole}>
        <boxGeometry args={[0.13, 0.04, 0.22]} />
      </mesh>
      <mesh position={[0.055, 0.03, 0.0]} castShadow material={m.blue}>
        <boxGeometry args={[0.04, 0.07, 0.16]} />
      </mesh>
      <mesh position={[-0.055, 0.03, 0.0]} castShadow material={m.blue}>
        <boxGeometry args={[0.04, 0.07, 0.16]} />
      </mesh>
      <mesh position={[0, 0.025, 0.1]} castShadow material={m.red}>
        <boxGeometry args={[0.12, 0.055, 0.07]} />
      </mesh>
      <mesh position={[0, 0.045, -0.085]} castShadow material={m.red}>
        <boxGeometry args={[0.12, 0.09, 0.055]} />
      </mesh>
      <mesh position={[0, 0.06, 0.02]} material={m.sole}>
        <boxGeometry args={[0.055, 0.022, 0.11]} />
      </mesh>
      <mesh position={[0, 0.02, 0.125]} material={m.red}>
        <sphereGeometry args={[0.048, 10, 8]} />
      </mesh>
    </group>
  )
}
