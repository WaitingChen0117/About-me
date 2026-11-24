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
    bg: '#080a10',
    floor: '#1a1e28',
    desk: '#3a322a',
    metal: '#4a5464',
    panel: '#242a36',
    accent: '#3de0c8',
    accent2: '#8a9ab0',
    glow: '#4aecd4',
    ok: '#4ecf8a',
    screen: '#071018',
    screenDim: '#0c1420',
    operatorSkin: '#b0aaa4',
    operatorSuit: '#2e343c',
    operatorLeg: '#1a1e24',
    rim: '#1a2838',
    wood: '#4a3e34',
    wall: '#222830',
    fabric: '#343a44',
    lamp: '#7aa8c0',
  }
}
