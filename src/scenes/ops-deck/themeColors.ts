import { getPalette, type PaletteId } from '../../themes/palettes'

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

/** Scene A material map for the active named palette preset. */
export function deckPalette(theme: PaletteId): DeckPalette {
  return getPalette(theme).deck
}
