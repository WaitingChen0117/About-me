import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
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
  onClickAbout: () => void
  onClickWorks: () => void
  onClickStudio: () => void
  lowPower: boolean
}

const BOX_SIZE = 2.4
const WALL = 0.08

export function PackageBox({
  onPointerDown,
  onClickWork,
  onClickAbout,
  onClickWorks,
  onClickStudio,
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

  // Create window frame with rounded rect hole
  const createWindowFrame = (windowWidth: number, windowHeight: number) => {
    const shape = new THREE.Shape()
    const radius = 0.12
    
    // Outer rectangle (full face)
    shape.moveTo(-hs, -hs)
    shape.lineTo(-hs, hs)
    shape.lineTo(hs, hs)
    shape.lineTo(hs, -hs)
    shape.closePath()

    // Inner rounded rectangle (window hole)
    const w2 = windowWidth / 2
    const h2 = windowHeight / 2
    const hole = new THREE.Path()
    
    hole.moveTo(-w2 + radius, -h2)
    hole.lineTo(w2 - radius, -h2)
    hole.quadraticCurveTo(w2, -h2, w2, -h2 + radius)
    hole.lineTo(w2, h2 - radius)
    hole.quadraticCurveTo(w2, h2, w2 - radius, h2)
    hole.lineTo(-w2 + radius, h2)
    hole.quadraticCurveTo(-w2, h2, -w2, h2 - radius)
    hole.lineTo(-w2, -h2 + radius)
    hole.quadraticCurveTo(-w2, -h2, -w2 + radius, -h2)
    hole.closePath()
    
    shape.holes.push(hole)
    return shape
  }

  const frontFrameShape = useMemo(() => createWindowFrame(1.6, 1.8), [])
  const rightFrameShape = useMemo(() => createWindowFrame(1.3, 1.6), [])

  return (
    <group
      onPointerOver={() => {
        document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Front wall with window opening */}
      <group position={[0, 0, hs]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <extrudeGeometry args={[frontFrameShape, { depth: WALL, bevelEnabled: false }]} />
          <meshStandardMaterial map={textures.front} roughness={0.65} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Clickable areas for navigation - larger hit targets */}
        <mesh position={[-0.6, -0.9, WALL + 0.01]} onClick={(e) => { e.stopPropagation(); onClickAbout(); }}>
          <planeGeometry args={[0.5, 0.25]} />
          <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.9, WALL + 0.01]} onClick={(e) => { e.stopPropagation(); onClickWorks(); }}>
          <planeGeometry args={[0.5, 0.25]} />
          <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.65, -0.9, WALL + 0.01]} onClick={(e) => { e.stopPropagation(); onClickStudio(); }}>
          <planeGeometry args={[0.65, 0.25]} />
          <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Back wall (closed) with collection */}
      <group position={[0, 0, -hs]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.back} roughness={0.65} />
        </mesh>
        {/* Work card clickable areas - positioned outside and facing camera */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[0, 0.65 - i * 0.3, -WALL - 0.01]}
            rotation={[0, Math.PI, 0]}
            onClick={(e) => {
              e.stopPropagation()
              onClickWork(i)
            }}
          >
            <planeGeometry args={[2, 0.25]} />
            <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Left wall (closed) - About face */}
      <group position={[-hs, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.left} roughness={0.65} />
        </mesh>
      </group>

      {/* Right wall with window opening (profile view) */}
      <group position={[hs, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <extrudeGeometry args={[rightFrameShape, { depth: WALL, bevelEnabled: false }]} />
          <meshStandardMaterial map={textures.right} roughness={0.65} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Top with hang tab */}
      <group position={[0, hs, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.top} roughness={0.65} />
        </mesh>
        {/* Hang tab */}
        <mesh position={[0, 0, hs + WALL / 2 + 0.12]} castShadow>
          <boxGeometry args={[0.3, 0.3, WALL]} />
          <meshStandardMaterial color="#e8d8c8" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0, hs + WALL / 2 + 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, WALL, 16]} />
          <meshStandardMaterial color="#e8d8c8" roughness={0.65} />
        </mesh>
      </group>

      {/* Bottom */}
      <group position={[0, -hs, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow onPointerDown={onPointerDown}>
          <boxGeometry args={[BOX_SIZE, BOX_SIZE, WALL]} />
          <meshStandardMaterial map={textures.bottom} roughness={0.65} />
        </mesh>
      </group>

      {/* Interior floor - darker to show depth */}
      <mesh position={[0, -hs + WALL, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BOX_SIZE - WALL * 2, BOX_SIZE - WALL * 2]} />
        <meshStandardMaterial color="#2d2520" roughness={0.8} />
      </mesh>
      
      {/* Interior walls to show cavity depth */}
      <mesh position={[0, 0, -hs + WALL / 2]} receiveShadow>
        <planeGeometry args={[BOX_SIZE - WALL * 2, BOX_SIZE - WALL * 2]} />
        <meshStandardMaterial color="#3d3530" roughness={0.75} />
      </mesh>
      <mesh position={[-hs + WALL / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[BOX_SIZE - WALL * 2, BOX_SIZE - WALL * 2]} />
        <meshStandardMaterial color="#3d3530" roughness={0.75} />
      </mesh>
    </group>
  )
}
