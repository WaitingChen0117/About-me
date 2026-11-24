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
}

export function deckPalette(theme: ThemeMode): DeckPalette {
  if (theme === 'bright') {
    return {
      bg: '#c9d7ea',
      floor: '#dfe8f4',
      desk: '#eef3fa',
      metal: '#9aafc7',
      panel: '#f7fafc',
      accent: '#0f9e93',
      accent2: '#2a62d9',
      glow: '#7ad0c8',
      ok: '#2f9e6a',
      screen: '#d8ecf5',
      screenDim: '#b8cce0',
      operatorSkin: '#e8d5c4',
      operatorSuit: '#2a62d9',
      operatorLeg: '#3a4d66',
    }
  }

  return {
    bg: '#070b14',
    floor: '#0a1220',
    desk: '#121c2e',
    metal: '#1c2a40',
    panel: '#162338',
    accent: '#3ee0d5',
    accent2: '#4b8bff',
    glow: '#3ee0d5',
    ok: '#5ddea0',
    screen: '#0a1828',
    screenDim: '#0d2034',
    operatorSkin: '#d7e7f7',
    operatorSuit: '#4b8bff',
    operatorLeg: '#24344d',
  }
}
