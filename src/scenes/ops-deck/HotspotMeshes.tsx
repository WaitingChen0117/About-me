import { useState } from 'react'
import type { SectionId } from '../../content/sections'
import type { HotspotDef } from '../types'
import type { DeckPalette } from './themeColors'

type Props = {
  spot: HotspotDef
  palette: DeckPalette
  active: boolean
  targeted: boolean
  onOpen: (id: SectionId) => void
}

export function HotspotMesh({ spot, palette, active, targeted, onOpen }: Props) {
  const [hovered, setHovered] = useState(false)
  const highlight = active || targeted || hovered
  const emissive = highlight ? 0.55 : 0.18

  return (
    <group
      position={spot.position}
      onClick={(e) => {
        e.stopPropagation()
        onOpen(spot.id)
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
      <HotspotShape id={spot.id} palette={palette} emissive={emissive} />
      {targeted && (
        <mesh position={[0, 0.02, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.38, 24]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}

function HotspotShape({
  id,
  palette,
  emissive,
}: {
  id: SectionId
  palette: DeckPalette
  emissive: number
}) {
  switch (id) {
    case 'about':
      return (
        <group>
          <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 1.7, 0.12]} />
            <meshStandardMaterial color={palette.metal} roughness={0.55} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.98, 0.07]}>
            <boxGeometry args={[2.15, 1.4, 0.04]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent}
              emissiveIntensity={emissive}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0.08, 0.15]} castShadow>
            <boxGeometry args={[2.5, 0.16, 0.55]} />
            <meshStandardMaterial color={palette.panel} roughness={0.4} metalness={0.2} />
          </mesh>
        </group>
      )
    case 'experience':
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[1.6, 0.12, 0.45]} />
            <meshStandardMaterial color={palette.panel} roughness={0.4} />
          </mesh>
          {[-0.5, -0.15, 0.2, 0.55].map((x, i) => (
            <mesh key={x} position={[x, 0.48, 0]}>
              <boxGeometry args={[0.22, 0.18, 0.08]} />
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.accent2}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive}
              />
            </mesh>
          ))}
        </group>
      )
    case 'works':
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[1.1, 0.85, 0.1]} />
            <meshStandardMaterial color={palette.metal} roughness={0.55} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.55, 0.06]}>
            <boxGeometry args={[0.95, 0.68, 0.03]} />
            <meshStandardMaterial
              color={palette.screen}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0, 0.08, 0.05]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 0.16, 12]} />
            <meshStandardMaterial color={palette.panel} />
          </mesh>
        </group>
      )
    case 'projects':
      return (
        <group>
          <mesh position={[0, 0.85, 0]} castShadow>
            <boxGeometry args={[0.7, 1.7, 0.55]} />
            <meshStandardMaterial color={palette.metal} roughness={0.55} metalness={0.35} />
          </mesh>
          {[0.35, 0.7, 1.05, 1.4].map((y, i) => (
            <mesh key={y} position={[0.36, y, 0]}>
              <boxGeometry args={[0.04, 0.12, 0.35]} />
              <meshStandardMaterial
                color={i % 2 ? palette.accent : palette.accent2}
                emissive={i % 2 ? palette.accent : palette.accent2}
                emissiveIntensity={emissive}
              />
            </mesh>
          ))}
        </group>
      )
    case 'articles':
      return (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.7]} />
            <meshStandardMaterial color={palette.panel} />
          </mesh>
          {[0.2, 0.4, 0.6].map((y) => (
            <mesh key={y} position={[0, y, 0.36]}>
              <boxGeometry args={[0.82, 0.08, 0.04]} />
              <meshStandardMaterial color={palette.metal} />
            </mesh>
          ))}
        </group>
      )
    case 'hobbies':
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.7, 0.5, 0.55]} />
            <meshStandardMaterial color={palette.panel} />
          </mesh>
          <mesh position={[-0.15, 0.58, 0.05]} castShadow>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial
              color={palette.accent2}
              emissive={palette.accent2}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0.18, 0.55, -0.05]} castShadow>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
        </group>
      )
    case 'contact':
      return (
        <group>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 0.3, 12]} />
            <meshStandardMaterial color={palette.metal} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
            <meshStandardMaterial
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={emissive}
            />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial
              color={palette.accent2}
              emissive={palette.accent2}
              emissiveIntensity={emissive + 0.2}
            />
          </mesh>
        </group>
      )
    default:
      return null
  }
}
