import * as THREE from 'three'

// Waiting Chen brand colors - not kaanses lime
const BRAND = {
  accent: '#5a7fa5', // blue accent
  accentDark: '#3d5571',
  bg: '#0d1117',
  text: '#1a1a1c', // darker for better contrast on kraft
  textDim: '#4a4a4c',
  textLight: '#f4f4f6',
  cardboard: '#e8d8c8',
}

export function createFrontTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = BRAND.cardboard
  ctx.fillRect(0, 0, 1024, 1024)

  // Header bar
  ctx.fillStyle = BRAND.accent
  ctx.fillRect(0, 0, 1024, 140)

  // Brand name in header
  ctx.fillStyle = BRAND.textLight
  ctx.font = 'bold 72px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('WAITING CHEN', 512, 70)

  // Edition number top right
  ctx.font = 'bold 48px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('#01', 980, 70)

  // Window area label (above actual window)
  ctx.fillStyle = BRAND.text
  ctx.font = 'bold 60px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('SENIOR FRONTEND', 512, 240)

  // Subtitle
  ctx.font = '36px Arial, sans-serif'
  ctx.fillStyle = BRAND.textDim
  ctx.fillText('Product UI · Agent Systems', 512, 290)

  // Stickers for navigation (bottom area)
  // ABOUT sticker
  drawSticker(ctx, 200, 850, 180, 100, BRAND.accent, 'ABOUT')
  
  // WORKS sticker
  drawSticker(ctx, 512, 850, 180, 100, BRAND.accent, 'WORKS')
  
  // ENTER STUDIO sticker
  drawSticker(ctx, 824, 850, 240, 100, BRAND.accentDark, 'STUDIO →')

  // Microprint at bottom
  ctx.font = '18px monospace'
  ctx.fillStyle = BRAND.textDim
  ctx.textAlign = 'center'
  ctx.fillText('COLLECTOR EDITION · VINYL FIGURE · 2026', 512, 1000)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = BRAND.cardboard
  ctx.fillRect(0, 0, 1024, 1024)

  // Header
  ctx.fillStyle = BRAND.accent
  ctx.fillRect(0, 0, 1024, 120)
  ctx.fillStyle = BRAND.textLight
  ctx.font = 'bold 56px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('COLLECTION', 512, 70)

  // Subtitle
  ctx.font = '32px Arial, sans-serif'
  ctx.fillStyle = BRAND.text
  ctx.fillText('作品收藏 · Public Works', 512, 170)

  // Work cards
  const works = [
    { title: 'MiniCut', subtitle: 'Browser Video Editor', badge: 'LIVE' },
    { title: 'Collab Table', subtitle: 'Yjs Realtime Spreadsheet', badge: 'GH' },
    { title: 'agent-workbench', subtitle: 'Next.js Agent Runtime', badge: 'GH' },
    { title: 'Full-Stack Music', subtitle: 'React + Express + Prisma', badge: 'GH' },
    { title: 'Notes Garden', subtitle: 'Digital Garden', badge: 'LIVE' },
  ]

  works.forEach((work, i) => {
    const y = 240 + i * 140
    drawWorkCard(ctx, 512, y, 900, 120, work.title, work.subtitle, work.badge)
  })

  // Footer
  ctx.font = '20px monospace'
  ctx.fillStyle = BRAND.textDim
  ctx.textAlign = 'center'
  ctx.fillText('Click to open · waitingchen0117.github.io', 512, 1000)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createLeftTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = BRAND.cardboard
  ctx.fillRect(0, 0, 1024, 1024)

  // Header
  ctx.fillStyle = BRAND.accent
  ctx.fillRect(0, 0, 1024, 120)
  ctx.fillStyle = BRAND.textLight
  ctx.font = 'bold 56px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ABOUT', 512, 70)

  // Bio content
  ctx.fillStyle = BRAND.text
  ctx.font = 'bold 36px Arial, sans-serif'
  ctx.textAlign = 'left'
  
  const bio = [
    'Waiting Chen · Senior Frontend',
    '',
    'React + TypeScript · Cloud Console',
    'Subscription & Billing · Inference UI',
    'Micro-frontends · Component Systems',
    '',
    'Next focus: Agent Workflow',
    'RAG · MCP · Human Approval Gates',
  ]

  bio.forEach((line, i) => {
    ctx.fillText(line, 80, 200 + i * 50)
  })

  // Tech tags
  ctx.font = '24px monospace'
  ctx.fillStyle = BRAND.textDim
  const tags = ['React', 'TypeScript', 'Next.js', 'Agent', 'RAG', 'MCP']
  tags.forEach((tag, i) => {
    const x = 80 + (i % 3) * 280
    const y = 650 + Math.floor(i / 3) * 60
    ctx.fillText(`· ${tag}`, x, y)
  })

  // Footer
  ctx.font = '20px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('github.com/WaitingChen0117', 512, 1000)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createRightTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = BRAND.cardboard
  ctx.fillRect(0, 0, 1024, 1024)

  // Top edition marker
  ctx.fillStyle = BRAND.accent
  ctx.fillRect(0, 0, 1024, 100)
  ctx.fillStyle = BRAND.textLight
  ctx.font = 'bold 60px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('#01', 512, 60)

  // Lower frame label (not center where window is)
  ctx.fillStyle = BRAND.text
  ctx.font = 'bold 32px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('PROFILE VIEW', 512, 850)

  // Barcode at bottom frame
  for (let i = 0; i < 40; i++) {
    const w = Math.random() > 0.5 ? 12 : 6
    ctx.fillStyle = i % 2 === 0 ? BRAND.text : BRAND.cardboard
    ctx.fillRect(200 + i * 16, 900, w, 90)
  }

  ctx.fillStyle = BRAND.text
  ctx.font = '24px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('0 26 FRONTEND 2026 1', 512, 1000)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createTopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = BRAND.cardboard
  ctx.fillRect(0, 0, 1024, 1024)

  ctx.fillStyle = BRAND.text
  ctx.font = 'bold 72px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('WAITING CHEN', 512, 512)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createBottomTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = BRAND.cardboard
  ctx.fillRect(0, 0, 1024, 1024)

  ctx.fillStyle = BRAND.textDim
  ctx.font = 'bold 48px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SENIOR FRONTEND', 512, 512)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  text: string,
) {
  // Background
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 12)
  ctx.fill()

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 4
  ctx.stroke()

  // Text
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 40px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

function drawWorkCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  subtitle: string,
  badge: string,
) {
  // Card background
  ctx.fillStyle = 'rgba(90, 127, 165, 0.12)'
  ctx.strokeStyle = BRAND.accent
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 8)
  ctx.fill()
  ctx.stroke()

  // Title
  ctx.fillStyle = BRAND.text
  ctx.font = 'bold 40px Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(title, x - w / 2 + 30, y - h / 2 + 20)

  // Subtitle
  ctx.font = '28px Arial, sans-serif'
  ctx.fillStyle = BRAND.textDim
  ctx.fillText(subtitle, x - w / 2 + 30, y - h / 2 + 68)

  // Badge
  const badgeColor = badge === 'LIVE' ? '#48bb78' : '#718096'
  ctx.fillStyle = badgeColor
  ctx.beginPath()
  ctx.roundRect(x + w / 2 - 110, y - h / 2 + 30, 90, 45, 6)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 24px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(badge, x + w / 2 - 65, y - h / 2 + 52)
}
