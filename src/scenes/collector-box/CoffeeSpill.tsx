/**
 * Coffee spill effect for collector box
 * Original implementation — not copied from kaanses
 */
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { BOX, FRONT_WINDOW, NICHE_FLOOR_Y, RIGHT_WINDOW } from './boxLayout'

type Droplet = {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  age: number
  landed: boolean
}

type Stain = {
  id: number
  pos: THREE.Vector3
  rot: [number, number, number]
  radius: number
}

export type SpillBurst = {
  id: number
  origin: THREE.Vector3
  velocity: THREE.Vector3
}

type CoffeeSpillProps = {
  burst: SpillBurst | null
}


const FLOOR_Y = NICHE_FLOOR_Y + 0.004
const CEIL_Y = BOX.h / 2 - BOX.wall
const WALL_X = BOX.w / 2 - BOX.wall / 2
const WALL_Z = BOX.d / 2 - BOX.wall / 2
const FRONT_WIN_X = FRONT_WINDOW.w / 2
const FRONT_WIN_Y = FRONT_WINDOW.h / 2
const RIGHT_WIN_Z = RIGHT_WINDOW.w / 2
const RIGHT_WIN_Y = RIGHT_WINDOW.h / 2

function wallRotation(nx: number, ny: number, _nz: number): [number, number, number] {
  if (ny > 0.5) return [-Math.PI / 2, 0, 0]
  if (ny < -0.5) return [Math.PI / 2, 0, 0]
  if (nx !== 0) return [0, Math.PI / 2, 0]
  return [0, 0, 0]
}

function inFrontWindow(pos: THREE.Vector3) {
  return Math.abs(pos.x) < FRONT_WIN_X && Math.abs(pos.y) < FRONT_WIN_Y
}

function inRightWindow(pos: THREE.Vector3) {
  return Math.abs(pos.z) < RIGHT_WIN_Z && Math.abs(pos.y) < RIGHT_WIN_Y
}

export function CoffeeSpill({ burst }: CoffeeSpillProps) {
  const dropletsRef = useRef<Droplet[]>([])
  const dropletMeshes = useRef<Map<number, THREE.Mesh>>(new Map())
  const [stains, setStains] = useState<Stain[]>([])
  const [flying, setFlying] = useState<Droplet[]>([])
  const lastBurstId = useRef<number | null>(null)
  const nextId = useRef(1)

  useEffect(() => {
    if (!burst || burst.id === lastBurstId.current) return
    lastBurstId.current = burst.id

    const spawned: Droplet[] = []
    for (let i = 0; i < 28; i++) {
      const spread = 0.55
      const speedJitter = 0.65 + Math.random() * 0.55
      spawned.push({
        id: nextId.current++,
        position: burst.origin.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.04,
            0.02 + Math.random() * 0.03,
            (Math.random() - 0.5) * 0.04,
          ),
        ),
        velocity: new THREE.Vector3(
          burst.velocity.x * speedJitter + (Math.random() - 0.5) * spread,
          burst.velocity.y * speedJitter + (Math.random() - 0.4) * spread,
          burst.velocity.z * speedJitter + (Math.random() - 0.5) * spread,
        ),
        age: 0,
        landed: false,
      })
    }
    dropletsRef.current = [...dropletsRef.current.filter((d) => !d.landed), ...spawned]
    setFlying(dropletsRef.current.filter((d) => !d.landed))
  }, [burst])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (dropletsRef.current.length === 0) return

    const newStains: Stain[] = []
    let changed = false

    dropletsRef.current = dropletsRef.current.map((d) => {
      if (d.landed) return d

      const vel = d.velocity
      vel.y -= 9.8 * dt
      const pos = d.position.clone().add(vel.clone().multiplyScalar(dt))
      const age = d.age + dt

      const land = (nx: number, ny: number, nz: number, radius: number) => {
        newStains.push({
          id: nextId.current++,
          pos: pos.clone(),
          rot: wallRotation(nx, ny, nz),
          radius,
        })
        changed = true
        return { ...d, position: pos, velocity: vel, age, landed: true }
      }

      if (pos.y <= FLOOR_Y) {
        pos.y = FLOOR_Y + 0.004
        return land(0, 1, 0, 0.06 + Math.random() * 0.08)
      }
      if (pos.y >= CEIL_Y) {
        pos.y = CEIL_Y - 0.004
        return land(0, -1, 0, 0.05 + Math.random() * 0.05)
      }
      if (pos.x <= -WALL_X) {
        pos.x = -WALL_X + 0.004
        return land(1, 0, 0, 0.05 + Math.random() * 0.07)
      }
      if (pos.x >= WALL_X) {
        if (inRightWindow(pos)) {
          // Flew out the right window — just drop the droplet.
          changed = true
          return { ...d, position: pos, velocity: vel, age, landed: true }
        }
        pos.x = WALL_X - 0.004
        return land(-1, 0, 0, 0.05 + Math.random() * 0.07)
      }
      if (pos.z <= -WALL_Z) {
        pos.z = -WALL_Z + 0.004
        return land(0, 0, 1, 0.05 + Math.random() * 0.07)
      }
      if (pos.z >= WALL_Z) {
        if (inFrontWindow(pos)) {
          changed = true
          return { ...d, position: pos, velocity: vel, age, landed: true }
        }
        pos.z = WALL_Z - 0.004
        return land(0, 0, -1, 0.05 + Math.random() * 0.07)
      }

      if (age > 3.5) {
        changed = true
        return { ...d, position: pos, velocity: vel, age, landed: true }
      }

      d.position.copy(pos)
      d.velocity.copy(vel)
      d.age = age
      const mesh = dropletMeshes.current.get(d.id)
      if (mesh) mesh.position.copy(pos)
      return d
    })

    if (newStains.length) {
      setStains((prev) => [...prev, ...newStains].slice(-80))
    }
    if (changed) {
      setFlying(dropletsRef.current.filter((d) => !d.landed))
    }
  })

  return (
    <group>
      {flying.map((d) => (
        <mesh
          key={d.id}
          ref={(m) => {
            if (m) dropletMeshes.current.set(d.id, m)
            else dropletMeshes.current.delete(d.id)
          }}
          position={d.position}
          castShadow={false}
        >
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial color="#6B3A1E" />
        </mesh>
      ))}

      {stains.map((mark) => (
        <mesh
          key={mark.id}
          position={mark.pos}
          rotation={mark.rot}
          renderOrder={2}
        >
          <circleGeometry args={[mark.radius, 12]} />
          <meshBasicMaterial
            color="#5A3016"
            transparent
            opacity={0.88}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}
