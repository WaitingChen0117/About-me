import type { ThemeMode } from '../types'
import type { DeckPalette } from '../ops-deck/themeColors'

/** Studio / craft palette — warm neutrals + tool-metal accents (distinct from Ops Deck cyan HUD). */
export type LabPalette = DeckPalette & {
  wood: string
  canvas: string
  tape: string
}

export function labPalette(theme: ThemeMode): LabPalette {
  if (theme === 'bright') {
    return {
      bg: '#d8d2c6',
      floor: '#cfc6b6',
      desk: '#e8e1d4',
      metal: '#8a8f96',
      panel: '#f2ebe0',
      accent: '#b86a2b',
      accent2: '#4a6b7a',
      glow: '#c9925a',
      ok: '#5f8a4e',
      screen: '#efe6d6',
      screenDim: '#d4cbb8',
      operatorSkin: '#e4d0ba',
      operatorSuit: '#5a6e78',
      operatorLeg: '#3d4550',
      rim: '#b8aea0',
      wood: '#a88968',
      canvas: '#f7f1e6',
      tape: '#c45a3a',
    }
  }

  // Dim studio / evening workshop
  return {
    bg: '#1a1814',
    floor: '#221e18',
    desk: '#2c261e',
    metal: '#6e737a',
    panel: '#353028',
    accent: '#d0894a',
    accent2: '#7a9aaa',
    glow: '#d0894a',
    ok: '#7aaa68',
    screen: '#1e221c',
    screenDim: '#2a2e28',
    operatorSkin: '#dcc8b0',
    operatorSuit: '#4a5c66',
    operatorLeg: '#2a3038',
    rim: '#4a4034',
    wood: '#6b5340',
    canvas: '#3a342c',
    tape: '#c45a3a',
  }
}
