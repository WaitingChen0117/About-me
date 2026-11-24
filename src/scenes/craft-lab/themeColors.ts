import type { ThemeMode } from '../types'
import type { DeckPalette } from '../ops-deck/themeColors'

/** Craft Lab palette — harbor-slate + warm tool metal (aligned with shell tokens). */
export type LabPalette = DeckPalette & {
  canvas: string
  tape: string
}

export function labPalette(theme: ThemeMode): LabPalette {
  if (theme === 'bright') {
    return {
      // sky-mist / soft-cloud day bench
      bg: '#d8d8df', // cool-ash
      floor: '#e0e0e0', // line-ash
      desk: '#f8f8f8', // soft-cloud
      metal: '#8a8a9a', // muted-steel
      panel: '#f2f7f9', // sky-mist
      accent: '#184120', // forest-ink
      accent2: '#98a9b4', // silver-mist
      glow: '#f76b1c', // warn-amber
      ok: '#30d018', // signal-green
      screen: '#e0e7e0', // sage-wash
      screenDim: '#d8d8df',
      operatorSkin: '#c4beb4',
      operatorSuit: '#282828',
      operatorLeg: '#0f0f0f',
      rim: '#f2f7f9',
      wood: '#8a7a68',
      wall: '#f8f8f6', // paper-ash
      fabric: '#3a3a3e',
      lamp: '#ffdd44', // tip-yellow
      canvas: '#fffff2', // warm-paper
      tape: '#d71018', // alert-red (craft accent mark)
    }
  }

  return {
    // void-black / harbor-slate night workshop
    bg: '#0f0f0f', // void-black
    floor: '#1a1e22',
    desk: '#243844', // harbor-slate
    metal: '#8a8a9a', // muted-steel
    panel: '#282828', // charcoal-panel
    accent: '#f76b1c', // warn-amber (tool metal)
    accent2: '#98a9b4', // silver-mist
    glow: '#f76b1c',
    ok: '#30d018',
    screen: '#042529', // ink-teal
    screenDim: '#243844',
    operatorSkin: '#b8b2a8',
    operatorSuit: '#282828',
    operatorLeg: '#0f0f0f',
    rim: '#243844',
    wood: '#3a3630',
    wall: '#16181d',
    fabric: '#1c2226',
    lamp: '#f76b1c',
    canvas: '#282828',
    tape: '#d71018',
  }
}
