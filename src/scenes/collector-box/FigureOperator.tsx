import * as THREE from 'three'
import type { ThemeMode } from '../types'

type FigureOperatorProps = {
  position: [number, number, number]
  theme: ThemeMode
}

export function FigureOperator({ position }: FigureOperatorProps) {
  const headGeometry = new THREE.SphereGeometry(0.3, 16, 16)
  const torsoGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.3)
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8)
  const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8)

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: '#d7e7f7',
    roughness: 0.6,
  })

  const clothMaterial = new THREE.MeshStandardMaterial({
    color: '#5a7fa5',
    roughness: 0.5,
  })

  const darkMaterial = new THREE.MeshStandardMaterial({
    color: '#24344d',
    roughness: 0.7,
  })

  return (
    <group position={position}>
      <mesh
        geometry={headGeometry}
        material={skinMaterial}
        position={[0, 0.85, 0]}
        castShadow
        receiveShadow
      />

      <mesh
        geometry={torsoGeometry}
        material={clothMaterial}
        position={[0, 0.3, 0]}
        castShadow
        receiveShadow
      />

      <mesh
        geometry={legGeometry}
        material={darkMaterial}
        position={[-0.12, -0.2, 0]}
        rotation={[0.1, 0, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={legGeometry}
        material={darkMaterial}
        position={[0.12, -0.2, 0]}
        rotation={[-0.1, 0, 0]}
        castShadow
        receiveShadow
      />

      <mesh
        geometry={armGeometry}
        material={clothMaterial}
        position={[-0.28, 0.35, 0]}
        rotation={[0, 0, 0.3]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={armGeometry}
        material={clothMaterial}
        position={[0.28, 0.35, 0]}
        rotation={[0, 0, -0.3]}
        castShadow
        receiveShadow
      />
    </group>
  )
}
