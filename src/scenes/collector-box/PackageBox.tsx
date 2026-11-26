import { useEffect, useMemo } from 'react'
import {
  createBackTexture,
  createBottomTexture,
  createFrontTexture,
  createLeftTexture,
  createRightTexture,
  createTopTexture,
} from './textures'

type PackageBoxProps = {
  onPointerDown: (e: any) => void
  onClickWork: (index: number) => void
  lowPower: boolean
}

const BOX_SIZE = 2.4
const WALL = 0.06

export function PackageBox({
  onPointerDown,
  onClickWork,
}: PackageBoxProps) {
  const textures = useMemo(
    () => ({
      front: createFrontTexture(),
      back: createBackTexture(),
      left: createLeftTexture(),
      right: createRightTexture(),
      top: createTopTexture(),
      bottom: createBottomTexture(),
    }),
    [],
  )

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((t) => t.dispose())
    }
  }, [textures])

  const hs = BOX_SIZE / 2

  return (
    <group>
      <group position={[0, 0, hs]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.front} roughness={0.65} />
        </mesh>
      </group>

      <group position={[0, 0, -hs]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.back} roughness={0.65} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[0, 0.65 - i * 0.3, 0.001]}
            onClick={(e) => {
              e.stopPropagation()
              onClickWork(i)
            }}
          >
            <planeGeometry args={[2, 0.25]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        ))}
      </group>

      <group position={[-hs, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.left} roughness={0.65} />
        </mesh>
      </group>

      <group position={[hs, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.right} roughness={0.65} />
        </mesh>
      </group>

      <group position={[0, hs, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.top} roughness={0.65} />
        </mesh>
      </group>

      <group position={[0, -hs, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.bottom} roughness={0.65} />
        </mesh>
      </group>

      <mesh position={[0, -hs + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BOX_SIZE - WALL * 2, BOX_SIZE - WALL * 2]} />
        <meshStandardMaterial color="#d8c8b8" roughness={0.7} />
      </mesh>
    </group>
  )
}
