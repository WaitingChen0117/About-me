import type { ThemeMode } from '../types'
import type { DeckPalette } from '../ops-deck/themeColors'

/** Studio palette — graphite + amber tool-metal (aligned with shell tokens). */
export type LabPalette = DeckPalette & {
  canvas: string
  tape: string
}

export function labPalette(theme: ThemeMode): LabPalette {
  if (theme === 'bright') {
    return {
      bg: '#c6c8ce',
      floor: '#bbbdc4',
      desk: '#e4e5e8',
      metal: '#7a8088',
      panel: '#f0f0ee',
      accent: '#9a6b3a',
      accent2: '#5a6674',
      glow: '#c4a078',
      ok: '#5a8a58',
      screen: '#e8e6e0',
      screenDim: '#cbc9c2',
      operatorSkin: '#c4beb4',
      operatorSuit: '#4a5560',
      operatorLeg: '#2e353e',
      rim: '#a8a9ae',
      wood: '#8a7a68',
      wall: '#e4e4e0',
      fabric: '#6a6660',
      lamp: '#e0b48a',
      canvas: '#f2f1ed',
      tape: '#a06040',
    }
  }

  return {
    bg: '#0c0d10',
    floor: '#181b22',
    desk: '#222830',
    metal: '#646b76',
    panel: '#2a3038',
    accent: '#d4a574',
    accent2: '#7d8b99',
    glow: '#d4a574',
    ok: '#6a9a68',
    screen: '#14181c',
    screenDim: '#1c2228',
    operatorSkin: '#b8b2a8',
    operatorSuit: '#3e4854',
    operatorLeg: '#1e242c',
    rim: '#2a3038',
    wood: '#4a4238',
    wall: '#16181d',
    fabric: '#2a2e34',
    lamp: '#d4a574',
    canvas: '#2a2e34',
    tape: '#a06040',
  }
}
