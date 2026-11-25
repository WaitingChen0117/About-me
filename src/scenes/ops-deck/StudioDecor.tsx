import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThemeMode } from '../types'
import { getPalette } from '../../themes/palettes'
import type { DeckPalette } from './themeColors'

type Props = {
  palette: DeckPalette
  theme: ThemeMode
  lowPower: boolean
}

/**
 * Non-interactive fill — desk clutter, wall shelves, plant, speakers —
 * so the room reads as a lived-in studio rather than empty hotspots.
 */
export function StudioDecor({ palette, theme, lowPower }: Props) {
  const dark = getPalette(theme).family === 'dark'

  return (
    <group>
      <BackWallShelves palette={palette} />
      <DeskClutter palette={palette} dark={dark} />
      <CornerPlant palette={palette} />
      <WallClock palette={palette} dark={dark} />
      <FloorSpeaker palette={palette} />
      {!lowPower && <DustMotes palette={palette} dark={dark} />}
    </group>
  )
}

/** High shelves on the back wall — books + small objects. */
function BackWallShelves({ palette }: { palette: DeckPalette }) {
  const shelfYs = [2.35, 2.85]
  const shelfItems: { x: number; y: number; w: number; h: number; d: number; kind: 'book' | 'box' | 'frame' }[] =
    [
      { x: -2.8, y: 2.5, w: 0.08, h: 0.28, d: 0.18, kind: 'book' },
      { x: -2.68, y: 2.52, w: 0.07, h: 0.32, d: 0.16, kind: 'book' },
      { x: -2.56, y: 2.48, w: 0.09, h: 0.24, d: 0.2, kind: 'book' },
      { x: -2.4, y: 2.5, w: 0.06, h: 0.3, d: 0.16, kind: 'book' },
      { x: -1.9, y: 2.48, w: 0.22, h: 0.16, d: 0.16, kind: 'box' },
      { x: -1.2, y: 2.5, w: 0.08, h: 0.28, d: 0.18, kind: 'book' },
      { x: -1.08, y: 2.52, w: 0.07, h: 0.32, d: 0.16, kind: 'book' },
      { x: -0.4, y: 2.48, w: 0.28, h: 0.2, d: 0.04, kind: 'frame' },
      { x: 0.5, y: 2.5, w: 0.08, h: 0.26, d: 0.18, kind: 'book' },
      { x: 0.62, y: 2.52, w: 0.07, h: 0.3, d: 0.16, kind: 'book' },
      { x: 0.74, y: 2.48, w: 0.09, h: 0.24, d: 0.2, kind: 'book' },
      { x: 1.4, y: 2.48, w: 0.2, h: 0.14, d: 0.14, kind: 'box' },
      { x: 2.2, y: 2.5, w: 0.08, h: 0.28, d: 0.18, kind: 'book' },
      { x: 2.32, y: 2.52, w: 0.06, h: 0.32, d: 0.16, kind: 'book' },
      { x: 2.44, y: 2.48, w: 0.09, h: 0.24, d: 0.2, kind: 'book' },
      // Upper shelf
      { x: -2.5, y: 3.0, w: 0.08, h: 0.22, d: 0.16, kind: 'book' },
      { x: -2.38, y: 3.02, w: 0.07, h: 0.26, d: 0.14, kind: 'book' },
      { x: -1.6, y: 3.0, w: 0.24, h: 0.14, d: 0.14, kind: 'box' },
      { x: -0.6, y: 3.0, w: 0.08, h: 0.24, d: 0.16, kind: 'book' },
      { x: -0.48, y: 3.02, w: 0.07, h: 0.28, d: 0.14, kind: 'book' },
      { x: 0.3, y: 3.0, w: 0.26, h: 0.18, d: 0.04, kind: 'frame' },
      { x: 1.2, y: 3.0, w: 0.08, h: 0.22, d: 0.16, kind: 'book' },
      { x: 1.32, y: 3.02, w: 0.09, h: 0.26, d: 0.14, kind: 'book' },
      { x: 2.1, y: 3.0, w: 0.2, h: 0.12, d: 0.14, kind: 'box' },
    ]

  return (
    <group>
      {shelfYs.map((y) => (
        <mesh key={y} position={[0, y, -4.05]} castShadow receiveShadow>
          <boxGeometry args={[7.2, 0.06, 0.28]} />
          <meshStandardMaterial color={palette.wood} roughness={0.72} metalness={0.05} />
        </mesh>
      ))}
      {shelfItems.map((item, i) => {
        const color =
          item.kind === 'frame'
            ? palette.panel
            : item.kind === 'box'
              ? i % 2
                ? palette.accent2
                : palette.desk
              : i % 3 === 0
                ? palette.accent
                : i % 3 === 1
                  ? palette.panel
                  : palette.metal
        return (
          <mesh key={i} position={[item.x, item.y, -3.95]} castShadow>
            <boxGeometry args={[item.w, item.h, item.d]} />
            <meshStandardMaterial
              color={color}
              emissive={item.kind === 'book' && i % 4 === 0 ? palette.accent : '#000000'}
              emissiveIntensity={item.kind === 'book' && i % 4 === 0 ? 0.12 : 0}
              roughness={item.kind === 'frame' ? 0.45 : 0.7}
              metalness={item.kind === 'box' ? 0.15 : 0.06}
            />
          </mesh>
        )
      })}
    </group>
  )
}

/** Mug, notebook, cable tray, desk organizer on the main desk. */
function DeskClutter({ palette, dark }: { palette: DeckPalette; dark: boolean }) {
  return (
    <group>
      {/* Ceramic mug near left of keyboard zone */}
      <mesh position={[-1.55, 0.84, 0.15]} castShadow>
        <cylinderGeometry args={[0.07, 0.06, 0.14, 12]} />
        <meshStandardMaterial color={palette.panel} roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[-1.55, 0.92, 0.15]}>
        <torusGeometry args={[0.05, 0.012, 6, 12, Math.PI]} />
        <meshStandardMaterial color={palette.panel} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Spiral notebook */}
      <mesh position={[-1.85, 0.78, 0.35]} rotation={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.28, 0.03, 0.36]} />
        <meshStandardMaterial color={palette.accent2} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[-1.98, 0.79, 0.35]} rotation={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.34, 6]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Cable tray / hub under monitor stand */}
      <mesh position={[-0.55, 0.78, -0.55]} castShadow>
        <boxGeometry args={[0.55, 0.05, 0.18]} />
        <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
      </mesh>
      {[
        [-0.7, 0.55, -0.4],
        [-0.55, 0.5, -0.35],
        [-0.4, 0.52, -0.45],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.4 + i * 0.1, 0.2, 0.15 * i]}>
          <cylinderGeometry args={[0.01, 0.01, 0.4, 5]} />
          <meshStandardMaterial color={palette.metal} roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* Desk organizer / sticky pad */}
      <mesh position={[1.55, 0.8, -0.15]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.22]} />
        <meshStandardMaterial color={palette.desk} roughness={0.7} metalness={0.06} />
      </mesh>
      <mesh position={[1.55, 0.88, -0.15]}>
        <boxGeometry args={[0.2, 0.04, 0.16]} />
        <meshStandardMaterial
          color={dark ? palette.accent : palette.lamp}
          emissive={dark ? palette.accent : palette.lamp}
          emissiveIntensity={dark ? 0.2 : 0.08}
          roughness={0.55}
        />
      </mesh>

      {/* Small desk plant */}
      <mesh position={[1.85, 0.82, -0.55]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 10]} />
        <meshStandardMaterial color={palette.accent2} roughness={0.7} />
      </mesh>
      <mesh position={[1.85, 0.94, -0.55]}>
        <sphereGeometry args={[0.08, 9, 9]} />
        <meshStandardMaterial color={palette.ok} roughness={0.88} emissive={palette.ok} emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}

/** Tall floor plant in the front-left corner. */
function CornerPlant({ palette }: { palette: DeckPalette }) {
  return (
    <group position={[-4.4, 0, 2.9]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.4, 12]} />
        <meshStandardMaterial color={palette.wood} roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={palette.ok} roughness={0.9} emissive={palette.ok} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0.12, 0.78, 0.05]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={palette.ok} roughness={0.92} />
      </mesh>
      <mesh position={[-0.1, 0.72, -0.08]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color={palette.ok} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Simple wall clock on left wall for lived-in density. */
function WallClock({ palette, dark }: { palette: DeckPalette; dark: boolean }) {
  return (
    <group position={[-5.28, 2.4, 1.6]}>
      {/* Thin disk facing into the room (+X) */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.05, 24]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0.03, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.18, 24]} />
        <meshStandardMaterial
          color={dark ? palette.panel : palette.screen}
          emissive={dark ? palette.accent2 : '#000000'}
          emissiveIntensity={dark ? 0.08 : 0}
          roughness={0.55}
        />
      </mesh>
      {/* Hands in YZ plane */}
      <mesh position={[0.04, 0.04, 0.02]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.01, 0.1, 0.02]} />
        <meshStandardMaterial color={palette.accent} roughness={0.4} />
      </mesh>
      <mesh position={[0.04, 0.02, -0.03]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.01, 0.07, 0.015]} />
        <meshStandardMaterial color={palette.metal} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** Compact speaker on the rear ledge. */
function FloorSpeaker({ palette }: { palette: DeckPalette }) {
  return (
    <group position={[-3.2, 0.7, -3.85]}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.4, 0.24]} />
        <meshStandardMaterial color={palette.metal} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.05, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 14]} />
        <meshStandardMaterial color={palette.panel} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.1, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
        <meshStandardMaterial color={palette.panel} roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  )
}

/** Lightweight dust motes drifting in the volume — atmosphere without particles library. */
function DustMotes({ palette, dark }: { palette: DeckPalette; dark: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 48

  const { positions, speeds } = useMemo(() => {
    // Deterministic layout — avoids impure Math.random during render.
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const u = ((i * 17 + 3) % 48) / 48
      const v = ((i * 29 + 11) % 48) / 48
      const w = ((i * 41 + 7) % 48) / 48
      positions[i * 3] = (u - 0.5) * 9
      positions[i * 3 + 1] = 0.4 + v * 2.6
      positions[i * 3 + 2] = (w - 0.5) * 7
      speeds[i] = 0.08 + ((i * 13) % 12) * 0.01
    }
    return { positions, speeds }
  }, [])

  useFrame((_, dt) => {
    const pts = pointsRef.current
    if (!pts) return
    const attr = pts.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1]! += speeds[i]! * dt
      arr[i * 3]! += Math.sin(arr[i * 3 + 1]! * 0.8 + i) * dt * 0.04
      if (arr[i * 3 + 1]! > 3.1) {
        const u = ((i * 17 + Math.floor(arr[i * 3 + 1]! * 10)) % 48) / 48
        const w = ((i * 41 + Math.floor(arr[i * 3]! * 10)) % 48) / 48
        arr[i * 3 + 1] = 0.35
        arr[i * 3] = (u - 0.5) * 9
        arr[i * 3 + 2] = (w - 0.5) * 7
      }
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={dark ? palette.accent : palette.lamp}
        size={dark ? 0.035 : 0.028}
        transparent
        opacity={dark ? 0.35 : 0.22}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
