import { getPalette, type PaletteId } from '../../themes/palettes'
import type { DeckPalette } from '../ops-deck/themeColors'

/** Craft Lab palette — inherits accent family from the active preset. */
export type LabPalette = DeckPalette & {
  canvas: string
  tape: string
}

export function labPalette(theme: PaletteId): LabPalette {
  const preset = getPalette(theme)
  const d = preset.deck

  if (preset.family === 'light') {
    return {
      bg: d.bg,
      floor: '#e0e0e0',
      desk: '#f8f8f8',
      metal: d.metal,
      panel: d.panel,
      accent: d.accent,
      accent2: d.accent2,
      glow: d.glow,
      ok: d.ok,
      screen: d.screen,
      screenDim: d.screenDim,
      operatorSkin: d.operatorSkin,
      operatorSuit: d.operatorSuit,
      operatorLeg: d.operatorLeg,
      rim: d.rim,
      wood: d.wood,
      wall: d.wall,
      fabric: d.fabric,
      lamp: d.lamp,
      canvas: '#fffff2',
      tape: '#d71018',
    }
  }

  return {
    bg: d.bg === '#042529' ? '#0f0f0f' : d.bg,
    floor: '#1a1e22',
    desk: d.wall,
    metal: d.metal,
    panel: d.panel,
    accent: d.glow === d.accent ? '#f76b1c' : d.accent, // tool amber when lime/signal steal accent
    accent2: d.accent2,
    glow: '#f76b1c',
    ok: d.ok,
    screen: '#042529',
    screenDim: '#243844',
    operatorSkin: d.operatorSkin,
    operatorSuit: d.operatorSuit,
    operatorLeg: d.operatorLeg,
    rim: d.rim,
    wood: d.wood,
    wall: '#16181d',
    fabric: d.fabric,
    lamp: '#f76b1c',
    canvas: d.panel,
    tape: '#d71018',
  }
}
