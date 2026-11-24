import type { ComponentType } from 'react'
import type { SectionId } from '../content/sections'

import type { PaletteId } from '../themes/palettes'

export type SceneId = 'ops-deck' | 'craft-lab' | 'skyline-terminal'

/** Active named palette preset (replaces binary day/night). */
export type ThemeMode = PaletteId

/** Programmatic camera goal — spherical offset around `target`. */
export type CameraView = {
  target: [number, number, number]
  radius: number
  /** Azimuth around Y (radians), atan2(x, z) convention */
  theta: number
  /** Polar from +Y (radians) */
  phi: number
}

export type HotspotDef = {
  id: SectionId
  label: string
  hint: string
  /** Legacy 2D percentage position (HUD / fallback layouts) */
  x: number
  y: number
  /** World-space floor position for true-3D scenes [x, y, z] */
  position: [number, number, number]
  /** Optional focus framing; missing → derived from position */
  view?: CameraView
  /** World-space label height above floor (defaults ~1.05) */
  labelY?: number
}

/** Camera command issued by the shell state machine. */
export type CameraCommand = {
  /** Bumps to restart the same goal */
  ticket: number
  /** null → fly home; SectionId → fly to that hotspot view */
  focusId: SectionId | null
}

export type SceneProps = {
  theme: ThemeMode
  activeSection: SectionId | null
  /** @deprecated Prefer onFocusThenOpen — kept for gradual migration */
  onOpenSection: (id: SectionId) => void
  /** Unified select: camera focus then open panel */
  onFocusThenOpen: (id: SectionId) => void
  /** Send the operator walking; panel opens via focusThenOpen on arrive */
  onSendOperator: (id: SectionId) => void
  avatarOpen: boolean
  onToggleAvatar: () => void
  operatorTarget: SectionId | null
  /** Bumps when the same target is re-requested so the walk restarts */
  operatorTicket: number
  onOperatorArrive: (id: SectionId) => void
  /** Active camera focus (look-at + orbit lock while panel/focus) */
  focusId: SectionId | null
  cameraCommand: CameraCommand
  onCameraArrive: () => void
  /** Hide world labels while panel is open */
  labelsAway: boolean
}

export type SceneModule = {
  id: SceneId
  label: string
  description: string
  Component: ComponentType<SceneProps>
  hotspots: HotspotDef[]
}
