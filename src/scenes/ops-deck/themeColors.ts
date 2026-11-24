import type { ThemeMode } from '../types'

export type DeckPalette = {
  bg: string
  floor: string
  desk: string
  metal: string
  panel: string
  accent: string
  accent2: string
  glow: string
  ok: string
  screen: string
  screenDim: string
  operatorSkin: string
  operatorSuit: string
  operatorLeg: string
  /** Soft rim / fill used by secondary lights */
  rim: string
}

export function deckPalette(theme: ThemeMode): DeckPalette {
  if (theme === 'bright') {
    return {
      bg: '#c5cbd6',
      floor: '#d2d8e2',
      desk: '#e8ecf2',
      metal: '#7a8494',
      panel: '#f0f3f7',
      accent: '#0f766e',
      accent2: '#64748b',
      glow: '#5fb8ae',
      ok: '#3d8f6a',
      screen: '#d5e0e8',
      screenDim: '#b0bcc9',
      operatorSkin: '#c8c2ba',
      operatorSuit: '#3a4556',
      operatorLeg: '#2a3340',
      rim: '#9aa8b8',
    }
  }

  return {
    bg: '#080a0e',
    floor: '#121820',
    desk: '#1a2230',
    metal: '#323c50',
    panel: '#222b3a',
    accent: '#2dd4bf',
    accent2: '#94a3b8',
    glow: '#2dd4bf',
    ok: '#5cb88a',
    screen: '#0a1218',
    screenDim: '#101820',
    operatorSkin: '#b8b4ae',
    operatorSuit: '#3d4656',
    operatorLeg: '#1e2633',
    rim: '#1a2838',
  }
}
