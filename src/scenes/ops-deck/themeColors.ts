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
  /** Warm wood / furniture tone */
  wood: string
  /** Soft wall plaster / paint */
  wall: string
  /** Fabric (chair, rug) */
  fabric: string
  /** Desk-lamp / warm practical light color */
  lamp: string
}

/**
 * bright = day / work — warm desk-lamp temperature
 * duty  = night — near-black tech studio, cool screen glow OK
 */
export function deckPalette(theme: ThemeMode): DeckPalette {
  if (theme === 'bright') {
    return {
      bg: '#d8cfc3',
      floor: '#c4b5a0',
      desk: '#8b6f52',
      metal: '#7a736a',
      panel: '#efe6da',
      accent: '#b86b2e',
      accent2: '#6b635a',
      glow: '#e8a060',
      ok: '#5a8f6a',
      screen: '#e8eef2',
      screenDim: '#c8d0d8',
      operatorSkin: '#c8b8a8',
      operatorSuit: '#4a4540',
      operatorLeg: '#35302c',
      rim: '#f0dcc0',
      wood: '#a07850',
      wall: '#ebe4d8',
      fabric: '#5c5348',
      lamp: '#ffb060',
    }
  }

  return {
    bg: '#050608',
    floor: '#0c0e12',
    desk: '#1a1614',
    metal: '#2a3038',
    panel: '#12161c',
    accent: '#3de0c8',
    accent2: '#6b7c94',
    glow: '#3de0c8',
    ok: '#4ecf8a',
    screen: '#060a10',
    screenDim: '#0a1018',
    operatorSkin: '#b0aaa4',
    operatorSuit: '#2e343c',
    operatorLeg: '#1a1e24',
    rim: '#142028',
    wood: '#2a221c',
    wall: '#0e1014',
    fabric: '#1c2028',
    lamp: '#5a8aaa',
  }
}
