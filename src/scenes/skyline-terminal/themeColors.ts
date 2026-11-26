import { getPalette, type PaletteId } from '../../themes/palettes'
import type { DeckPalette } from '../ops-deck/themeColors'

/** Skyline Terminal palette — city-glass + console accents from the active preset. */
export type SkylinePalette = DeckPalette & {
  glass: string
  sky: string
  building: string
  buildingLit: string
  ledge: string
}

export function skylinePalette(theme: PaletteId): SkylinePalette {
  const preset = getPalette(theme)
  const d = preset.deck

  if (preset.family === 'light') {
    return {
      bg: '#d8e2ea',
      floor: '#c8d0d8',
      desk: '#e8eef2',
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
      rim: '#b8c8d4',
      wood: d.wood,
      wall: '#eef2f4',
      fabric: d.fabric,
      lamp: d.lamp,
      glass: '#9eb8c8',
      sky: '#c5d6e4',
      building: '#6a7884',
      buildingLit: '#fffff2',
      ledge: '#a8b4bc',
    }
  }

  return {
    bg: d.bg === '#042529' ? '#08141c' : d.bg,
    floor: '#161c24',
    desk: '#222a34',
    metal: d.metal,
    panel: d.panel,
    accent: d.accent,
    accent2: d.accent2,
    glow: d.glow,
    ok: d.ok,
    screen: '#042529',
    screenDim: '#1a2830',
    operatorSkin: d.operatorSkin,
    operatorSuit: d.operatorSuit,
    operatorLeg: d.operatorLeg,
    rim: '#2a4050',
    wood: d.wood,
    wall: '#141a22',
    fabric: d.fabric,
    lamp: d.lamp,
    glass: '#243848',
    sky: '#0a121c',
    building: '#121820',
    buildingLit: d.accent2,
    ledge: '#24303a',
  }
}
