import { useRef } from 'react'
import type { ThemeMode } from '../types'
import { Operator3D } from '../ops-deck/Operator3D'

type FigureInBoxProps = {
  onPointerDown: (e: any) => void
  theme: ThemeMode
}

export function FigureInBox({ onPointerDown }: FigureInBoxProps) {
  const introRef = useRef(1)
  
  return (
    <group position={[0, -1.05, 0]} scale={0.85} onPointerDown={onPointerDown}>
      <Operator3D
        hotspots={[]}
        target={null}
        ticket={0}
        onArrive={() => {}}
        onTap={() => {}}
        palette={{ accent: '#5a7fa5', accentAlt: '#3d5571' } as any}
        introRef={introRef}
        home={[0, 0, 0]}
      />
    </group>
  )
}
