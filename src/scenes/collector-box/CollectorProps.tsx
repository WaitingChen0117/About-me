/**
 * Simple original props for collector-box figure: coffee cup and laptop
 * Not copied from kaanses - original design for Waiting Chen
 */
import { forwardRef } from 'react'
import * as THREE from 'three'

type CoffeeCupProps = {
  position?: [number, number, number]
}

export const CoffeeCup = forwardRef<THREE.Group, CoffeeCupProps>(
  ({ position = [0, 0, 0] }, ref) => {
    return (
      <group ref={ref} position={position}>
        {/* Cup body - simple cylinder in Waiting Chen blue accent */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.038, 0.08, 16]} />
          <meshStandardMaterial color="#f4f4f6" roughness={0.3} />
        </mesh>
        {/* Coffee inside */}
        <mesh position={[0, 0.025, 0]}>
          <cylinderGeometry args={[0.037, 0.035, 0.03, 16]} />
          <meshStandardMaterial color="#8B4513" roughness={0.4} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.025, 0.008, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#f4f4f6" roughness={0.3} />
        </mesh>
      </group>
    )
  },
)

type LaptopProps = {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export const Laptop = forwardRef<THREE.Group, LaptopProps>(
  ({ position = [0, 0, 0], rotation = [0, 0, 0] }, ref) => {
    return (
      <group ref={ref} position={position} rotation={rotation}>
        {/* Laptop base - keyboard */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.12, 0.01, 0.09]} />
          <meshStandardMaterial color="#2d3748" roughness={0.6} />
        </mesh>
        {/* Screen - Waiting Chen blue accent */}
        <mesh position={[0, 0.045, -0.04]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.008]} />
          <meshStandardMaterial color="#1a1f2e" roughness={0.5} />
        </mesh>
        {/* Screen content - glowing */}
        <mesh position={[0, 0.045, -0.0355]} rotation={[-0.3, 0, 0]}>
          <planeGeometry args={[0.11, 0.07]} />
          <meshBasicMaterial color="#5a7fa5" />
        </mesh>
      </group>
    )
  },
)
