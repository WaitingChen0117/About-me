/**
 * Named studio palette presets.
 * Built from design tokens (ink-teal, warm-paper, …) — no product labels.
 */

import type { DeckPalette } from '../scenes/ops-deck/themeColors'

export type PaletteId =
  | 'ink-monitor'
  | 'harbor-console'
  | 'void-signal'
  | 'warm-paper'
  | 'ash-daylight'
  | 'sage-atelier'

export type PaletteFamily = 'dark' | 'light'

/** UI chrome CSS custom properties (applied via data-theme). */
export type ChromeTokens = {
  bgDeep: string
  bgDeck: string
  bgPanelSolid: string
  bgElevated: string
  text: string
  textMuted: string
  textDim: string
  accent: string
  accent2: string
  accentWarm: string
  lineMix: string
  lineStrongMix: string
  glowMix: string
  scanMix: string
  shadow: string
}

export type LightRecipe = {
  keyIntensity: number
  fillIntensity: number
  lampIntensity: number
  screenFill: number
  windowGlow: number
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  hemiIntensityLite: number
  ambient: number
  ambientLite: number
  keyColor: string
  keyPosition: [number, number, number]
  fillColor: string
  windowColor: string
  ceilingColor: string
  ceilingIntensity: number
  fogNear: number
  fogNearLite: number
  fogFar: number
  fogFarLite: number
  exposure: number
  exposureLite: number
  wallEmissive: number
  windowEmissive: number
  coveEmissive: number
  dockHot: number
  dockIdle: number
}

export type PalettePreset = {
  id: PaletteId
  /** Short HUD label */
  label: string
  /** One-line description for title/tooltip */
  hint: string
  family: PaletteFamily
  /** Swatch shown in the switcher (accent chip) */
  swatch: string
  chrome: ChromeTokens
  deck: DeckPalette
  lights: LightRecipe
}

const FUNCTIONAL = {
  ok: '#30d018',
  alert: '#d71018',
  warn: '#f76b1c',
  tip: '#ffdd44',
} as const

const DARK_LIGHTS_BASE: Omit<
  LightRecipe,
  'keyColor' | 'fillColor' | 'windowColor' | 'ceilingColor' | 'hemiSky' | 'hemiGround'
> = {
  keyIntensity: 0.85,
  fillIntensity: 0.55,
  lampIntensity: 0.95,
  screenFill: 1.45,
  windowGlow: 0.4,
  hemiIntensity: 0.62,
  hemiIntensityLite: 0.72,
  ambient: 0.48,
  ambientLite: 0.55,
  keyPosition: [3.2, 9.0, 4.0],
  ceilingIntensity: 0.75,
  fogNear: 16,
  fogNearLite: 18,
  fogFar: 40,
  fogFarLite: 40,
  exposure: 1.18,
  exposureLite: 1.12,
  wallEmissive: 0.03,
  windowEmissive: 0.22,
  coveEmissive: 0.1,
  dockHot: 0.38,
  dockIdle: 0.12,
}

const LIGHT_LIGHTS_BASE: Omit<
  LightRecipe,
  'keyColor' | 'fillColor' | 'windowColor' | 'ceilingColor' | 'hemiSky' | 'hemiGround'
> = {
  keyIntensity: 0.95,
  fillIntensity: 0.32,
  lampIntensity: 1.35,
  screenFill: 0.22,
  windowGlow: 0.55,
  hemiIntensity: 0.62,
  hemiIntensityLite: 0.62,
  ambient: 0.38,
  ambientLite: 0.38,
  keyPosition: [-5.5, 9.5, 2.5],
  ceilingIntensity: 0.55,
  fogNear: 13,
  fogNearLite: 15,
  fogFar: 28,
  fogFarLite: 32,
  exposure: 1.06,
  exposureLite: 1.0,
  wallEmissive: 0.01,
  windowEmissive: 0.35,
  coveEmissive: 0.08,
  dockHot: 0.18,
  dockIdle: 0.05,
}

export const PALETTE_PRESETS: readonly PalettePreset[] = [
  {
    id: 'ink-monitor',
    label: 'Ink Monitor',
    hint: 'ink-teal room · sparse acid-lime',
    family: 'dark',
    swatch: '#c1e704',
    chrome: {
      bgDeep: '#042529',
      bgDeck: '#0f0f0f',
      bgPanelSolid: '#282828',
      bgElevated: '#1c2226',
      text: '#e4e4e8',
      textMuted: '#98a9b4',
      textDim: '#8a8a9a',
      accent: '#c1e704',
      accent2: '#98a9b4',
      accentWarm: '#f76b1c',
      lineMix: 'color-mix(in srgb, #98a9b4 22%, transparent)',
      lineStrongMix: 'color-mix(in srgb, #c1e704 42%, transparent)',
      glowMix: 'color-mix(in srgb, #c1e704 12%, transparent)',
      scanMix: 'color-mix(in srgb, #98a9b4 3%, transparent)',
      shadow: '0 18px 56px rgba(0, 0, 0, 0.62)',
    },
    deck: {
      bg: '#042529',
      floor: '#0f0f0f',
      desk: '#2a322e',
      metal: '#8a8a9a',
      panel: '#282828',
      accent: '#c1e704',
      accent2: '#98a9b4',
      glow: '#c1e704',
      ok: FUNCTIONAL.ok,
      screen: '#042529',
      screenDim: '#243844',
      operatorSkin: '#b0aaa4',
      operatorSuit: '#282828',
      operatorLeg: '#0f0f0f',
      rim: '#243844',
      wood: '#3a3630',
      wall: '#243844',
      fabric: '#1c2226',
      lamp: '#98a9b4',
    },
    lights: {
      ...DARK_LIGHTS_BASE,
      hemiSky: '#98a9b4',
      hemiGround: '#0f0f0f',
      keyColor: '#c8d4dc',
      fillColor: '#243844',
      windowColor: '#98a9b4',
      ceilingColor: '#8a8a9a',
    },
  },
  {
    id: 'harbor-console',
    label: 'Harbor Console',
    hint: 'harbor-slate · silver-mist chrome',
    family: 'dark',
    swatch: '#98a9b4',
    chrome: {
      bgDeep: '#1a242c',
      bgDeck: '#0f0f0f',
      bgPanelSolid: '#243844',
      bgElevated: '#2a343c',
      text: '#e4e4e8',
      textMuted: '#98a9b4',
      textDim: '#8a8a9a',
      accent: '#98a9b4',
      accent2: '#e4e4e8',
      accentWarm: '#f76b1c',
      lineMix: 'color-mix(in srgb, #98a9b4 20%, transparent)',
      lineStrongMix: 'color-mix(in srgb, #98a9b4 48%, transparent)',
      glowMix: 'color-mix(in srgb, #98a9b4 14%, transparent)',
      scanMix: 'color-mix(in srgb, #98a9b4 4%, transparent)',
      shadow: '0 18px 56px rgba(0, 0, 0, 0.58)',
    },
    deck: {
      bg: '#1a242c',
      floor: '#0f0f0f',
      desk: '#2a343c',
      metal: '#98a9b4',
      panel: '#243844',
      accent: '#98a9b4',
      accent2: '#e4e4e8',
      glow: '#98a9b4',
      ok: FUNCTIONAL.ok,
      screen: '#042529',
      screenDim: '#243844',
      operatorSkin: '#b0aaa4',
      operatorSuit: '#282828',
      operatorLeg: '#0f0f0f',
      rim: '#243844',
      wood: '#3a4046',
      wall: '#243844',
      fabric: '#1c2226',
      lamp: '#e4e4e8',
    },
    lights: {
      ...DARK_LIGHTS_BASE,
      screenFill: 1.15,
      hemiSky: '#98a9b4',
      hemiGround: '#0f0f0f',
      keyColor: '#b8c8d2',
      fillColor: '#243844',
      windowColor: '#98a9b4',
      ceilingColor: '#98a9b4',
    },
  },
  {
    id: 'void-signal',
    label: 'Void Signal',
    hint: 'void-black · signal-green pulse',
    family: 'dark',
    swatch: '#30d018',
    chrome: {
      bgDeep: '#0f0f0f',
      bgDeck: '#0a0a0a',
      bgPanelSolid: '#282828',
      bgElevated: '#1a1a1c',
      text: '#e4e4e8',
      textMuted: '#8a8a9a',
      textDim: '#6a6a72',
      accent: '#30d018',
      accent2: '#8a8a9a',
      accentWarm: '#f76b1c',
      lineMix: 'color-mix(in srgb, #8a8a9a 20%, transparent)',
      lineStrongMix: 'color-mix(in srgb, #30d018 40%, transparent)',
      glowMix: 'color-mix(in srgb, #30d018 12%, transparent)',
      scanMix: 'color-mix(in srgb, #30d018 3%, transparent)',
      shadow: '0 18px 56px rgba(0, 0, 0, 0.68)',
    },
    deck: {
      bg: '#0f0f0f',
      floor: '#0a0a0a',
      desk: '#282828',
      metal: '#8a8a9a',
      panel: '#282828',
      accent: '#30d018',
      accent2: '#8a8a9a',
      glow: '#30d018',
      ok: FUNCTIONAL.ok,
      screen: '#042529',
      screenDim: '#1a2220',
      operatorSkin: '#b0aaa4',
      operatorSuit: '#282828',
      operatorLeg: '#0f0f0f',
      rim: '#1a2220',
      wood: '#2e2a26',
      wall: '#1c1c1e',
      fabric: '#141416',
      lamp: '#8a8a9a',
    },
    lights: {
      ...DARK_LIGHTS_BASE,
      screenFill: 1.55,
      hemiSky: '#8a8a9a',
      hemiGround: '#0a0a0a',
      keyColor: '#c0c0c8',
      fillColor: '#1a2220',
      windowColor: '#8a8a9a',
      ceilingColor: '#6a6a72',
    },
  },
  {
    id: 'warm-paper',
    label: 'Warm Paper',
    hint: 'warm-paper · forest-ink accent',
    family: 'light',
    swatch: '#184120',
    chrome: {
      bgDeep: '#f8f8f6',
      bgDeck: '#fffff2',
      bgPanelSolid: '#fffff2',
      bgElevated: '#f8f8f8',
      text: '#000000',
      textMuted: '#3a3a3e',
      textDim: '#6a6a70',
      accent: '#184120',
      accent2: '#8a8a9a',
      accentWarm: '#f76b1c',
      lineMix: 'color-mix(in srgb, #000000 12%, transparent)',
      lineStrongMix: 'color-mix(in srgb, #184120 35%, transparent)',
      glowMix: 'color-mix(in srgb, #184120 8%, transparent)',
      scanMix: 'color-mix(in srgb, #d8d8df 35%, transparent)',
      shadow: '0 16px 40px rgba(0, 0, 0, 0.1)',
    },
    deck: {
      bg: '#f8f8f6',
      floor: '#d8d8df',
      desk: '#6a645c',
      metal: '#8a8a9a',
      panel: '#fffff2',
      accent: '#184120',
      accent2: '#98a9b4',
      glow: '#f76b1c',
      ok: FUNCTIONAL.ok,
      screen: '#f2f7f9',
      screenDim: '#e0e0e0',
      operatorSkin: '#c8b8a8',
      operatorSuit: '#282828',
      operatorLeg: '#1a1a1a',
      rim: '#fffff2',
      wood: '#8a7a68',
      wall: '#fffff2',
      fabric: '#3a3a3e',
      lamp: '#ffdd44',
    },
    lights: {
      ...LIGHT_LIGHTS_BASE,
      hemiSky: '#fffff2',
      hemiGround: '#d8d8df',
      keyColor: '#fff8e8',
      fillColor: '#f2f7f9',
      windowColor: '#fff4d8',
      ceilingColor: '#fffff2',
    },
  },
  {
    id: 'ash-daylight',
    label: 'Ash Daylight',
    hint: 'paper-ash · sky-mist cool day',
    family: 'light',
    swatch: '#8a8a9a',
    chrome: {
      bgDeep: '#d8d8df',
      bgDeck: '#f8f8f6',
      bgPanelSolid: '#f2f7f9',
      bgElevated: '#f8f8f8',
      text: '#000000',
      textMuted: '#3a3a3e',
      textDim: '#6a6a70',
      accent: '#243844',
      accent2: '#8a8a9a',
      accentWarm: '#f76b1c',
      lineMix: 'color-mix(in srgb, #000000 11%, transparent)',
      lineStrongMix: 'color-mix(in srgb, #243844 36%, transparent)',
      glowMix: 'color-mix(in srgb, #243844 8%, transparent)',
      scanMix: 'color-mix(in srgb, #d8d8df 40%, transparent)',
      shadow: '0 16px 40px rgba(20, 24, 32, 0.12)',
    },
    deck: {
      bg: '#e8eaee',
      floor: '#d8d8df',
      desk: '#5a6068',
      metal: '#8a8a9a',
      panel: '#f2f7f9',
      accent: '#243844',
      accent2: '#98a9b4',
      glow: '#f76b1c',
      ok: FUNCTIONAL.ok,
      screen: '#f2f7f9',
      screenDim: '#e0e0e0',
      operatorSkin: '#c4beb4',
      operatorSuit: '#282828',
      operatorLeg: '#1a1a1a',
      rim: '#f2f7f9',
      wood: '#7a746c',
      wall: '#f8f8f6',
      fabric: '#3a3a3e',
      lamp: '#e4e4e8',
    },
    lights: {
      ...LIGHT_LIGHTS_BASE,
      keyIntensity: 0.9,
      lampIntensity: 1.1,
      hemiSky: '#f2f7f9',
      hemiGround: '#d8d8df',
      keyColor: '#eef2f6',
      fillColor: '#d8d8df',
      windowColor: '#e4e4e8',
      ceilingColor: '#f2f7f9',
    },
  },
  {
    id: 'sage-atelier',
    label: 'Sage Atelier',
    hint: 'sage-wash · forest-ink desk',
    family: 'light',
    swatch: '#184120',
    chrome: {
      bgDeep: '#e0e7e0',
      bgDeck: '#f8f8f6',
      bgPanelSolid: '#fffff2',
      bgElevated: '#e8eee8',
      text: '#000000',
      textMuted: '#3e4640',
      textDim: '#6a726c',
      accent: '#184120',
      accent2: '#8a8a9a',
      accentWarm: '#f76b1c',
      lineMix: 'color-mix(in srgb, #184120 14%, transparent)',
      lineStrongMix: 'color-mix(in srgb, #184120 38%, transparent)',
      glowMix: 'color-mix(in srgb, #184120 9%, transparent)',
      scanMix: 'color-mix(in srgb, #e0e7e0 45%, transparent)',
      shadow: '0 16px 40px rgba(24, 40, 28, 0.12)',
    },
    deck: {
      bg: '#e0e7e0',
      floor: '#d0d8d0',
      desk: '#5a6458',
      metal: '#8a8a9a',
      panel: '#fffff2',
      accent: '#184120',
      accent2: '#98a9b4',
      glow: '#ffdd44',
      ok: FUNCTIONAL.ok,
      screen: '#e0e7e0',
      screenDim: '#d0d8d0',
      operatorSkin: '#c8b8a8',
      operatorSuit: '#282828',
      operatorLeg: '#1a1a1a',
      rim: '#e0e7e0',
      wood: '#8a7a68',
      wall: '#f0f4f0',
      fabric: '#3a463e',
      lamp: '#ffdd44',
    },
    lights: {
      ...LIGHT_LIGHTS_BASE,
      hemiSky: '#e0e7e0',
      hemiGround: '#d0d8d0',
      keyColor: '#f4f8f0',
      fillColor: '#e0e7e0',
      windowColor: '#fff8e0',
      ceilingColor: '#fffff2',
    },
  },
] as const

export const DEFAULT_PALETTE_ID: PaletteId = 'ink-monitor'

const BY_ID = Object.fromEntries(PALETTE_PRESETS.map((p) => [p.id, p])) as Record<
  PaletteId,
  PalettePreset
>

export function getPalette(id: PaletteId): PalettePreset {
  return BY_ID[id] ?? BY_ID[DEFAULT_PALETTE_ID]
}

export function isPaletteId(value: string): value is PaletteId {
  return value in BY_ID
}

export function nextPaletteId(current: PaletteId): PaletteId {
  const i = PALETTE_PRESETS.findIndex((p) => p.id === current)
  const next = PALETTE_PRESETS[(i + 1) % PALETTE_PRESETS.length]
  return next?.id ?? DEFAULT_PALETTE_ID
}

export function prevPaletteId(current: PaletteId): PaletteId {
  const i = PALETTE_PRESETS.findIndex((p) => p.id === current)
  const prev = PALETTE_PRESETS[(i - 1 + PALETTE_PRESETS.length) % PALETTE_PRESETS.length]
  return prev?.id ?? DEFAULT_PALETTE_ID
}

/** Persist preference without leaking PII. */
const STORAGE_KEY = 'about-me.palette'

export function readStoredPaletteId(): PaletteId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && isPaletteId(raw)) return raw
    // Migrate legacy day/night toggle
    if (raw === 'duty') return 'ink-monitor'
    if (raw === 'bright') return 'warm-paper'
  } catch {
    /* ignore */
  }
  return null
}

export function storePaletteId(id: PaletteId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}
