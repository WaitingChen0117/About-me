import * as THREE from 'three'
import { BOX, BRAND } from './boxLayout'

const FONT = '"IBM Plex Sans", "Helvetica Neue", sans-serif'
const MONO = '"IBM Plex Mono", ui-monospace, monospace'

function canvasFor(faceW: number, faceH: number, long = 1400) {
  const canvas = document.createElement('canvas')
  if (faceW >= faceH) {
    canvas.width = long
    canvas.height = Math.round(long * (faceH / faceW))
  } else {
    canvas.height = long
    canvas.width = Math.round(long * (faceW / faceH))
  }
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx, W: canvas.width, H: canvas.height }
}

function finish(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function paper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = BRAND.kraft
  ctx.fillRect(0, 0, w, h)
  // Subtle fibre / grain — original, not a copied pattern
  const image = ctx.getImageData(0, 0, w, h)
  const d = image.data
  for (let i = 0; i < d.length; i += 4) {
    const n = ((i * 13 + 97) % 23) - 11
    d[i] = Math.max(0, Math.min(255, d[i]! + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1]! + n - 1))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2]! + n - 2))
  }
  ctx.putImageData(image, 0, 0)
}

function headerBand(ctx: CanvasRenderingContext2D, w: number, bandH: number) {
  const g = ctx.createLinearGradient(0, 0, 0, bandH)
  g.addColorStop(0, BRAND.accent)
  g.addColorStop(1, BRAND.accentDark)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, bandH)
}

function editionBadge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = BRAND.cream
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y, r - 2.5, 0, Math.PI * 2)
  ctx.strokeStyle = BRAND.accentDark
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = BRAND.accentDeep
  ctx.font = `600 ${Math.round(r * 0.72)}px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('01', x, y + 1)
}

function enamelBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  filled: boolean,
) {
  const r = h / 2
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, r)
  if (filled) {
    ctx.fillStyle = BRAND.accentDark
    ctx.fill()
    ctx.fillStyle = BRAND.cream
  } else {
    ctx.fillStyle = BRAND.cream
    ctx.fill()
    ctx.strokeStyle = BRAND.accentDark
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = BRAND.accentDeep
  }
  ctx.font = `600 ${Math.round(h * 0.36)}px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.14em'
  ctx.fillText(label, x, y + 1)
  ctx.letterSpacing = '0'
}

function barcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  vertical: boolean,
  seed = 26,
) {
  let s = seed >>> 0
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
  ctx.fillStyle = BRAND.ink
  const bars = 42
  if (vertical) {
    const bw = w
    let yy = y
    for (let i = 0; i < bars; i++) {
      const t = 0.35 + rnd() * 2.4
      const gap = 0.7 + rnd() * 0.8
      ctx.fillRect(x, yy, bw, t)
      yy += t + gap
      if (yy > y + h) break
    }
  } else {
    let xx = x
    for (let i = 0; i < bars; i++) {
      const t = 0.5 + rnd() * 2.8
      const gap = 0.7 + rnd() * 0.9
      ctx.fillRect(xx, y, t, h)
      xx += t + gap
      if (xx > x + w) break
    }
  }
}

export function createFrontTexture(): THREE.CanvasTexture {
  const { canvas, ctx, W, H } = canvasFor(BOX.w, BOX.h)
  paper(ctx, W, H)

  const topPx = (BOX.topFrame / BOX.h) * H
  const botPx = (BOX.bottomFrame / BOX.h) * H
  headerBand(ctx, W, topPx)

  // Lockup in the header
  editionBadge(ctx, topPx * 0.62, topPx * 0.52, topPx * 0.32)
  ctx.fillStyle = BRAND.light
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${Math.round(topPx * 0.28)}px ${FONT}`
  ctx.letterSpacing = '0.22em'
  ctx.fillText('WAITING  CHEN', W * 0.54, topPx * 0.44)
  ctx.letterSpacing = '0.18em'
  ctx.font = `500 ${Math.round(topPx * 0.13)}px ${MONO}`
  ctx.fillStyle = 'rgba(244,236,227,0.78)'
  ctx.fillText('COLLECTOR  EDITION', W * 0.54, topPx * 0.72)
  ctx.letterSpacing = '0'

  // Bottom panel — product name + navigation cues
  ctx.fillStyle = BRAND.ink
  ctx.font = `600 ${Math.round(botPx * 0.26)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.16em'
  ctx.fillText('WAITING CHEN', W / 2, H - botPx + botPx * 0.28)
  ctx.letterSpacing = '0.12em'
  ctx.font = `500 ${Math.round(botPx * 0.12)}px ${MONO}`
  ctx.fillStyle = BRAND.inkSoft
  ctx.fillText('SENIOR FRONTEND  ·  PRODUCT UI  ·  AGENT SYSTEMS', W / 2, H - botPx + botPx * 0.5)
  ctx.letterSpacing = '0'

  const badgeY = H - botPx * 0.28
  const badgeH = botPx * 0.28
  const gap = W * 0.22
  enamelBadge(ctx, W / 2 - gap, badgeY, W * 0.18, badgeH, 'ABOUT', false)
  enamelBadge(ctx, W / 2, badgeY, W * 0.18, badgeH, 'WORKS', false)
  enamelBadge(ctx, W / 2 + gap, badgeY, W * 0.2, badgeH, 'STUDIO', true)

  ctx.font = `400 ${Math.round(botPx * 0.075)}px ${MONO}`
  ctx.fillStyle = 'rgba(28,26,25,0.4)'
  ctx.fillText('VINYL FIGURE  ·  2026  ·  #01', W / 2, H - botPx * 0.07)

  return finish(canvas)
}

export function createBackTexture(): THREE.CanvasTexture {
  const { canvas, ctx, W, H } = canvasFor(BOX.w, BOX.h)
  paper(ctx, W, H)
  const topPx = Math.round(H * 0.14)
  headerBand(ctx, W, topPx)
  ctx.fillStyle = BRAND.light
  ctx.font = `600 ${Math.round(topPx * 0.36)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.28em'
  ctx.fillText('WORKS', W / 2, topPx * 0.52)
  ctx.letterSpacing = '0'

  const works = [
    { title: 'MiniCut', subtitle: 'Browser video editor', badge: 'LIVE' },
    { title: 'Collab Table', subtitle: 'Yjs realtime spreadsheet', badge: 'GH' },
    { title: 'agent-workbench', subtitle: 'Next.js agent runtime', badge: 'GH' },
    { title: 'Full-Stack Music', subtitle: 'React · Express · Prisma', badge: 'GH' },
    { title: 'Notes Garden', subtitle: 'Digital garden', badge: 'LIVE' },
  ]

  const listTop = topPx + H * 0.06
  const rowH = (H - listTop - H * 0.08) / works.length
  works.forEach((work, i) => {
    const y = listTop + i * rowH + rowH / 2
    const x = W * 0.08
    const ww = W * 0.84
    const hh = rowH * 0.78
    ctx.fillStyle = 'rgba(61, 85, 113, 0.1)'
    ctx.strokeStyle = 'rgba(61, 85, 113, 0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(x, y - hh / 2, ww, hh, 8)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = BRAND.ink
    ctx.font = `600 ${Math.round(hh * 0.32)}px ${FONT}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.letterSpacing = '0'
    ctx.fillText(work.title, x + 22, y - hh * 0.14)
    ctx.font = `400 ${Math.round(hh * 0.22)}px ${FONT}`
    ctx.fillStyle = BRAND.inkSoft
    ctx.fillText(work.subtitle, x + 22, y + hh * 0.22)

    const badgeW = 64
    const badgeH = hh * 0.36
    ctx.fillStyle = work.badge === 'LIVE' ? '#3d6b55' : BRAND.accentDark
    ctx.beginPath()
    ctx.roundRect(x + ww - badgeW - 16, y - badgeH / 2, badgeW, badgeH, badgeH / 2)
    ctx.fill()
    ctx.fillStyle = BRAND.cream
    ctx.font = `600 ${Math.round(badgeH * 0.48)}px ${MONO}`
    ctx.textAlign = 'center'
    ctx.fillText(work.badge, x + ww - badgeW / 2 - 16, y + 1)
  })

  ctx.font = `400 ${Math.round(H * 0.018)}px ${MONO}`
  ctx.fillStyle = 'rgba(28,26,25,0.45)'
  ctx.textAlign = 'center'
  ctx.fillText('CLICK A TITLE  ·  waitingchen0117.github.io', W / 2, H * 0.975)
  return finish(canvas)
}

export function createLeftTexture(): THREE.CanvasTexture {
  const { canvas, ctx, W, H } = canvasFor(BOX.d, BOX.h)
  paper(ctx, W, H)
  const topPx = Math.round(H * 0.14)
  headerBand(ctx, W, topPx)
  ctx.fillStyle = BRAND.light
  ctx.font = `600 ${Math.round(topPx * 0.36)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.28em'
  ctx.fillText('ABOUT', W / 2, topPx * 0.52)
  ctx.letterSpacing = '0'

  const pad = W * 0.1
  let y = topPx + H * 0.08
  ctx.textAlign = 'left'
  ctx.fillStyle = BRAND.ink
  ctx.font = `600 ${Math.round(H * 0.038)}px ${FONT}`
  ctx.fillText('Waiting Chen', pad, y)
  y += H * 0.04
  ctx.font = `500 ${Math.round(H * 0.022)}px ${MONO}`
  ctx.fillStyle = BRAND.accentDark
  ctx.letterSpacing = '0.08em'
  ctx.fillText('SENIOR FRONTEND', pad, y)
  ctx.letterSpacing = '0'

  y += H * 0.07
  const lines = [
    'Cloud console & billing surfaces.',
    'Inference UI, micro-frontends,',
    'and component systems.',
    '',
    'Next: agent workflows, RAG,',
    'MCP, and human approval gates.',
  ]
  ctx.fillStyle = BRAND.inkSoft
  ctx.font = `400 ${Math.round(H * 0.024)}px ${FONT}`
  lines.forEach((line) => {
    ctx.fillText(line, pad, y)
    y += H * 0.036
  })

  y += H * 0.03
  const tags = ['React', 'TypeScript', 'Next.js', 'RAG', 'MCP']
  let tx = pad
  const tagH = H * 0.032
  ctx.font = `500 ${Math.round(tagH * 0.55)}px ${MONO}`
  tags.forEach((tag) => {
    const tw = ctx.measureText(tag).width + 20
    if (tx + tw > W - pad) {
      tx = pad
      y += tagH + 10
    }
    ctx.beginPath()
    ctx.roundRect(tx, y - tagH / 2, tw, tagH, tagH / 2)
    ctx.fillStyle = 'rgba(61, 85, 113, 0.12)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(61, 85, 113, 0.45)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = BRAND.accentDeep
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(tag, tx + tw / 2, y + 1)
    ctx.textAlign = 'left'
    tx += tw + 8
  })

  ctx.font = `400 ${Math.round(H * 0.018)}px ${MONO}`
  ctx.fillStyle = 'rgba(28,26,25,0.45)'
  ctx.textAlign = 'center'
  ctx.fillText('github.com/WaitingChen0117', W / 2, H * 0.955)
  return finish(canvas)
}

export function createRightTexture(): THREE.CanvasTexture {
  const { canvas, ctx, W, H } = canvasFor(BOX.d, BOX.h)
  paper(ctx, W, H)
  const topPx = (BOX.topFrame / BOX.h) * H
  headerBand(ctx, W, topPx)
  editionBadge(ctx, W * 0.28, topPx * 0.52, topPx * 0.3)
  ctx.fillStyle = BRAND.light
  ctx.font = `600 ${Math.round(topPx * 0.22)}px ${MONO}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.16em'
  ctx.fillText('#01', W * 0.5, topPx * 0.52)
  ctx.letterSpacing = '0'

  // Vertical barcode along the trailing (back) edge — visible in the hero sliver
  const barX = W * 0.08
  const barW = W * 0.18
  const barY = topPx + H * 0.08
  const barH = H * 0.7
  barcode(ctx, barX, barY, barW, barH, true, 2026)

  ctx.save()
  ctx.translate(barX + barW / 2, H * 0.9)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = BRAND.ink
  ctx.font = `500 ${Math.round(W * 0.055)}px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.12em'
  ctx.fillText('0 26  FRONTEND  01', 0, 0)
  ctx.restore()

  return finish(canvas)
}

export function createTopTexture(): THREE.CanvasTexture {
  const { canvas, ctx, W, H } = canvasFor(BOX.w, BOX.d)
  paper(ctx, W, H)
  ctx.fillStyle = BRAND.inkSoft
  ctx.font = `500 ${Math.round(H * 0.1)}px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.42em'
  ctx.fillText('COLLECTOR SERIES', W / 2, H / 2)
  ctx.letterSpacing = '0'
  return finish(canvas)
}

export function createBottomTexture(): THREE.CanvasTexture {
  const { canvas, ctx, W, H } = canvasFor(BOX.w, BOX.d)
  paper(ctx, W, H)
  ctx.fillStyle = 'rgba(28,26,25,0.55)'
  ctx.font = `500 ${Math.round(H * 0.08)}px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.2em'
  ctx.fillText('WAITING CHEN  ·  #01  ·  2026', W / 2, H / 2)
  ctx.letterSpacing = '0'
  return finish(canvas)
}

/** Pixel positions of front badges, for 3D hit targets (normalized 0–1, origin top-left). */
export function frontBadgeLayout() {
  const bot = BOX.bottomFrame / BOX.h
  return {
    y: 1 - bot * 0.28,
    h: bot * 0.28,
    aboutX: 0.5 - 0.22,
    worksX: 0.5,
    studioX: 0.5 + 0.22,
    badgeW: 0.2,
  }
}

