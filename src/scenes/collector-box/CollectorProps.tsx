/**
 * Original props for the collector-box figure: coffee cup and laptop.
 * Waiting Chen palette — not copied from kaanses.
 */
import { forwardRef } from 'react'
import * as THREE from 'three'

type CoffeeCupProps = {
  position?: [number, number, number]
}

export const CoffeeCup = forwardRef<THREE.Group, CoffeeCupProps>(
  ({ position = [0, 0, 0] }, ref) => {
    return (
      <group ref={ref} position={position} scale={1.35}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.048, 0.042, 0.09, 24]} />
          <meshStandardMaterial color="#f7f4f0" roughness={0.28} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.032, 0]}>
          <cylinderGeometry args={[0.044, 0.043, 0.028, 24]} />
          <meshStandardMaterial color="#5c3418" roughness={0.45} metalness={0.0} />
        </mesh>
        {/* Rim */}
        <mesh position={[0, 0.046, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.047, 0.004, 8, 24]} />
          <meshStandardMaterial color="#ece8e2" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.028, 0.007, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#f7f4f0" roughness={0.28} metalness={0.08} />
        </mesh>
        {/* Tiny original monogram */}
        <mesh position={[0, 0.005, 0.047]}>
          <planeGeometry args={[0.03, 0.016]} />
          <meshBasicMaterial color="#3d5571" />
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
      <group ref={ref} position={position} rotation={rotation} scale={1.45}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.01, 0.1]} />
          <meshStandardMaterial color="#2a3038" roughness={0.4} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.002, 0.01]}>
          <planeGeometry args={[0.13, 0.07]} />
          <meshStandardMaterial color="#1a1f26" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.055, -0.042]} rotation={[-0.38, 0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.1, 0.008]} />
          <meshStandardMaterial color="#2a3038" roughness={0.4} metalness={0.25} />
        </mesh>
        {/* Screen — designed, original Waiting Chen slate */}
        <mesh position={[0, 0.055, -0.037]} rotation={[-0.38, 0, 0]}>
          <planeGeometry args={[0.136, 0.088]} />
          <meshBasicMaterial color="#1a2230" />
        </mesh>
        <mesh position={[0, 0.062, -0.036]} rotation={[-0.38, 0, 0]}>
          <planeGeometry args={[0.09, 0.012]} />
          <meshBasicMaterial color="#5a7fa5" />
        </mesh>
        <mesh position={[-0.02, 0.04, -0.036]} rotation={[-0.38, 0, 0]}>
          <planeGeometry args={[0.08, 0.03]} />
          <meshBasicMaterial color="#3d5571" />
        </mesh>
      </group>
    )
  },
)
