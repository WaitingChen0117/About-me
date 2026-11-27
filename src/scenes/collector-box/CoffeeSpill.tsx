/**
 * Coffee spill effect for collector box
 * Original implementation - not copied from kaanses
 */
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'

type Droplet = {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  age: number
  landed: boolean
  landPos?: THREE.Vector3
}

type CoffeeSpillProps = {
  cupPosition: THREE.Vector3
  spillVelocity: THREE.Vector3 | null
  onSpillComplete: () => void
}

export function CoffeeSpill({ cupPosition, spillVelocity, onSpillComplete }: CoffeeSpillProps) {
  const [droplets, setDroplets] = useState<Droplet[]>([])
  const dropletsRef = useRef<Droplet[]>([])
  const splashMarksRef = useRef<{ pos: THREE.Vector3; normal: THREE.Vector3 }[]>([])
  
  // Initialize droplets when spill starts
  useFrame((_, delta) => {
    if (spillVelocity && dropletsRef.current.length === 0) {
      // Create droplets flying in the spill direction
      const newDroplets: Droplet[] = []
      for (let i = 0; i < 15; i++) {
        const spread = 0.15
        newDroplets.push({
          id: Date.now() + i,
          position: cupPosition.clone(),
          velocity: new THREE.Vector3(
            spillVelocity.x + (Math.random() - 0.5) * spread,
            spillVelocity.y + (Math.random() - 0.5) * spread,
            spillVelocity.z + (Math.random() - 0.5) * spread,
          ),
          age: 0,
          landed: false,
        })
      }
      dropletsRef.current = newDroplets
      setDroplets(newDroplets)
    }
    
    // Update droplet physics
    if (dropletsRef.current.length > 0) {
      let allLanded = true
      dropletsRef.current = dropletsRef.current.map(d => {
        if (d.landed) return d
        
        const newPos = d.position.clone().add(d.velocity.clone().multiplyScalar(delta))
        const newVel = d.velocity.clone()
        newVel.y -= 9.8 * delta // Gravity
        
        // Check collision with floor (y = -1.2)
        if (newPos.y <= -1.15 && !d.landed) {
          newPos.y = -1.15
          splashMarksRef.current.push({
            pos: newPos.clone(),
            normal: new THREE.Vector3(0, 1, 0),
          })
          return { ...d, landed: true, landPos: newPos, age: d.age + delta }
        }
        
        // Check collision with walls
        const boxBounds = 1.1
        if (Math.abs(newPos.x) > boxBounds || Math.abs(newPos.z) > boxBounds) {
          const normal = new THREE.Vector3()
          if (Math.abs(newPos.x) > boxBounds) {
            newPos.x = Math.sign(newPos.x) * boxBounds
            normal.x = -Math.sign(newPos.x)
          }
          if (Math.abs(newPos.z) > boxBounds) {
            newPos.z = Math.sign(newPos.z) * boxBounds
            normal.z = -Math.sign(newPos.z)
          }
          splashMarksRef.current.push({ pos: newPos.clone(), normal })
          return { ...d, landed: true, landPos: newPos, age: d.age + delta }
        }
        
        allLanded = false
        return { ...d, position: newPos, velocity: newVel, age: d.age + delta }
      })
      
      setDroplets([...dropletsRef.current])
      
      // Clean up after animation
      if (allLanded) {
        setTimeout(() => {
          dropletsRef.current = []
          setDroplets([])
          onSpillComplete()
        }, 3000)
      }
    }
  })
  
  return (
    <group>
      {/* Flying droplets */}
      {droplets.filter(d => !d.landed).map(d => (
        <mesh key={d.id} position={d.position}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial color="#8B4513" />
        </mesh>
      ))}
      
      {/* Splash marks on surfaces */}
      {splashMarksRef.current.map((mark, i) => (
        <mesh
          key={`mark-${i}`}
          position={mark.pos}
          rotation={[
            mark.normal.y === 1 ? -Math.PI / 2 : 0,
            0,
            mark.normal.x !== 0 ? Math.PI / 2 : 0,
          ]}
        >
          <circleGeometry args={[0.025, 8]} />
          <meshBasicMaterial color="#6B3410" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}
