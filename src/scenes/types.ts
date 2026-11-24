import type { ComponentType } from 'react'
import type { SectionId } from '../content/sections'

export type SceneId = 'ops-deck' | 'craft-lab' | 'skyline-terminal'

export type ThemeMode = 'duty' | 'bright'

export type HotspotDef = {
  id: SectionId
  label: string
  hint: string
  /** Legacy 2D percentage position (HUD / fallback layouts) */
  x: number
  y: number
  /** World-space floor position for true-3D scenes [x, y, z] */
  position: [number, number, number]
}

export type SceneProps = {
  theme: ThemeMode
  activeSection: SectionId | null
  onOpenSection: (id: SectionId) => void
  /** Send the operator walking; panel opens on arrive */
  onSendOperator: (id: SectionId) => void
  avatarOpen: boolean
  onToggleAvatar: () => void
  operatorTarget: SectionId | null
  /** Bumps when the same target is re-requested so the walk restarts */
  operatorTicket: number
  onOperatorArrive: (id: SectionId) => void
}

export type SceneModule = {
  id: SceneId
  label: string
  description: string
  Component: ComponentType<SceneProps>
  hotspots: HotspotDef[]
}
