/**
 * Shared layout for the collector package: a shallow display niche,
 * not a warehouse cube. Units are world meters.
 */
export const BOX = {
  w: 2.18,
  h: 2.5,
  d: 1.14,
  wall: 0.07,
  topFrame: 0.4,
  bottomFrame: 0.44,
  sideFrame: 0.17,
} as const

export const FRONT_WINDOW = {
  w: BOX.w - BOX.sideFrame * 2,
  h: BOX.h - BOX.topFrame - BOX.bottomFrame,
  y: (BOX.bottomFrame - BOX.topFrame) / 2,
} as const

export const RIGHT_WINDOW = {
  w: BOX.d - 0.4,
  h: BOX.h - BOX.topFrame - BOX.bottomFrame - 0.04,
  y: (BOX.bottomFrame - BOX.topFrame) / 2,
  /** Shift toward the front so the back rail can hold a barcode. */
  x: 0.08,
} as const

/** Raised display floor at the window sill — a shallow shelf, not the box bottom. */
export const NICHE_FLOOR_Y = -BOX.h / 2 + BOX.bottomFrame + 0.012

/**
 * Operator3D soles sit ~0.01 above the group origin after STAND_Y_LIFT.
 * Scale chosen so the vinyl nearly fills the front window.
 */
const CHAR_SOLE = 0.01
const CHAR_HEIGHT = 1.24
export const FIGURE = {
  scale: 1.15,
  y: NICHE_FLOOR_Y - 0.01 * 1.15,
  z: BOX.d / 2 - 0.32,
  charSole: CHAR_SOLE,
  charHeight: CHAR_HEIGHT,
} as const

/** Designed product-shot camera: front window + a thin sliver of the right face. */
export const HERO_CAMERA = {
  position: [1.85, 0.55, 7.65] as [number, number, number],
  fov: 26,
  lookAt: [0, 0.2, 0] as [number, number, number],
}

/** Rest / ↻ FRONT pose — slight pitch so the hang tab and top lip read. */
export const FRONT_ROTATION = { x: 0.05, y: 0 }

export const BRAND = {
  accent: '#5a7fa5',
  accentDark: '#3d5571',
  accentDeep: '#2c3f56',
  kraft: '#e8d8c8',
  kraftShadow: '#d4c4b0',
  cream: '#f4ece3',
  ink: '#1c1a19',
  inkSoft: '#3a3530',
  paper: '#f7f1ea',
  field: '#0d1117',
  light: '#f4f4f6',
} as const
