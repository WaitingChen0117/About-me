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
 * Scene A (programmer studio) material colors.
 * bright = day — warm-paper / paper-ash studio, charcoal-ink type
 * duty  = night — ink-teal / void-black room, silver-mist, sparse acid-lime
 */
export function deckPalette(theme: ThemeMode): DeckPalette {
  if (theme === 'bright') {
    return {
      // warm-paper #FFFFF2 · paper-ash #F8F8F6 · soft-cloud #F8F8F8
      bg: '#f8f8f6',
      floor: '#d8d8df', // cool-ash
      desk: '#6a645c',
      metal: '#8a8a9a', // muted-steel
      panel: '#fffff2', // warm-paper
      accent: '#184120', // forest-ink (restrained)
      accent2: '#98a9b4', // silver-mist
      glow: '#f76b1c', // warn-amber (practical lamp spill)
      ok: '#30d018', // signal-green
      screen: '#f2f7f9', // sky-mist
      screenDim: '#e0e0e0', // line-ash
      operatorSkin: '#c8b8a8',
      operatorSuit: '#282828', // charcoal-panel
      operatorLeg: '#1a1a1a',
      rim: '#fffff2', // warm-paper bounce
      wood: '#8a7a68',
      wall: '#fffff2', // warm-paper
      fabric: '#3a3a3e',
      lamp: '#ffdd44', // tip-yellow warmth
    }
  }

  return {
    // ink-teal #042529 · void-black #0F0F0F · harbor-slate #243844
    bg: '#042529', // ink-teal
    floor: '#0f0f0f', // void-black
    desk: '#2a322e',
    metal: '#8a8a9a', // muted-steel
    panel: '#282828', // charcoal-panel
    accent: '#c1e704', // acid-lime
    accent2: '#98a9b4', // silver-mist
    glow: '#c1e704', // acid-lime screen spill
    ok: '#30d018', // signal-green
    screen: '#042529', // ink-teal glass
    screenDim: '#243844', // harbor-slate
    operatorSkin: '#b0aaa4',
    operatorSuit: '#282828', // charcoal-panel
    operatorLeg: '#0f0f0f',
    rim: '#243844', // harbor-slate
    wood: '#3a3630',
    wall: '#243844', // harbor-slate
    fabric: '#1c2226',
    lamp: '#98a9b4', // silver-mist practical
  }
}
