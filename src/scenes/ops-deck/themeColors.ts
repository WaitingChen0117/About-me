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
      bg: '#c4d2e6',
      floor: '#d5e0ef',
      desk: '#eef3fa',
      metal: '#8ea4bc',
      panel: '#f4f7fb',
      accent: '#0d8f85',
      accent2: '#2458c9',
      glow: '#6ec4bc',
      ok: '#2a9460',
      screen: '#cfe4f0',
      screenDim: '#a9bfd6',
      operatorSkin: '#e6d2bf',
      operatorSuit: '#1e4fad',
      operatorLeg: '#2c3d52',
      rim: '#9eb6d4',
    }
  }

  return {
    bg: '#060a12',
    floor: '#080f1c',
    desk: '#101a2c',
    metal: '#1a2740',
    panel: '#152336',
    accent: '#3ad4c9',
    accent2: '#4a86f5',
    glow: '#3ad4c9',
    ok: '#54d498',
    screen: '#081520',
    screenDim: '#0b1c2e',
    operatorSkin: '#dce8f6',
    operatorSuit: '#3d7aef',
    operatorLeg: '#1a283c',
    rim: '#1e3a5c',
  }
}
