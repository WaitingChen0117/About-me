import { RoundedBox } from '@react-three/drei'
import type { ComponentProps, ReactNode } from 'react'

type SoftBoxProps = ComponentProps<typeof RoundedBox> & {
  /** Half-min-dimension safety: radius is clamped below. */
  radius?: number
  smoothness?: number
}

/**
 * Pages-friendly rounded solid — ExtrudeGeometry, no external assets.
 * Prefer SoftBox for furniture / bezels; keep large walls as plain boxes.
 */
export function SoftBox({
  args = [1, 1, 1],
  radius = 0.04,
  smoothness = 4,
  children,
  ...props
}: SoftBoxProps) {
  const [w = 1, h = 1, d = 1] = args
  const maxR = Math.min(w, h, d) * 0.45
  const r = Math.min(radius, maxR)
  return (
    <RoundedBox args={[w, h, d]} radius={r} smoothness={smoothness} {...props}>
      {children}
    </RoundedBox>
  )
}

type SoftMonitorProps = {
  width: number
  height: number
  depth?: number
  bezel?: number
  frameColor: string
  screenColor: string
  glow: string
  emissive: number
  metalRough?: number
  breathName?: string
  castShadow?: boolean
  receiveShadow?: boolean
  children?: ReactNode
}

/** Rounded bezel + inset emissive screen — shared by Ops / Craft / Skyline. */
export function SoftMonitor({
  width,
  height,
  depth = 0.07,
  bezel = 0.07,
  frameColor,
  screenColor,
  glow,
  emissive,
  metalRough = 0.42,
  breathName,
  castShadow = true,
  receiveShadow = true,
  children,
}: SoftMonitorProps) {
  return (
    <group>
      <SoftBox
        args={[width, height, depth]}
        radius={Math.min(0.045, width, height) * 0.08}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial color={frameColor} roughness={metalRough} metalness={0.42} />
      </SoftBox>
      <SoftBox
        name={breathName}
        args={[width - bezel, height - bezel, 0.022]}
        radius={0.028}
        position={[0, 0, depth * 0.55]}
      >
        <meshStandardMaterial
          color={screenColor}
          emissive={glow}
          emissiveIntensity={emissive}
          roughness={0.16}
          metalness={0.04}
        />
      </SoftBox>
      {children}
    </group>
  )
}

/** Thin metal column with a soft foot — workshop / terminal bays. */
export function SoftColumn({
  height,
  size = 0.26,
  color,
  castShadow = true,
}: {
  height: number
  size?: number
  color: string
  castShadow?: boolean
}) {
  return (
    <group>
      <SoftBox args={[size, height, size]} radius={0.035} castShadow={castShadow}>
        <meshStandardMaterial color={color} roughness={0.48} metalness={0.42} />
      </SoftBox>
      <mesh position={[0, -height / 2 + 0.03, 0]} castShadow={castShadow}>
        <cylinderGeometry args={[size * 0.72, size * 0.85, 0.06, 12]} />
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.48} />
      </mesh>
    </group>
  )
}
