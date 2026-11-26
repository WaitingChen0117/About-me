import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThemeMode } from '../types'

type BoxFace = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

type WorkItem = {
  title: string
  href?: string
  githubHref: string
}

type CollectorBoxProps = {
  activeFace: BoxFace
  onFaceClick: (face: BoxFace) => void
  onWorkClick: (href?: string, githubHref?: string) => void
  onEnterStudio: () => void
  theme: ThemeMode
  lowPower: boolean
}

const WORKS: WorkItem[] = [
  {
    title: 'MiniCut',
    href: 'https://waitingchen0117.github.io/mini-cut/',
    githubHref: 'https://github.com/WaitingChen0117/mini-cut',
  },
  {
    title: 'Collab Table',
    githubHref: 'https://github.com/WaitingChen0117/collab-table-demo',
  },
  {
    title: 'agent-workbench',
    githubHref: 'https://github.com/WaitingChen0117/agent-workbench',
  },
  {
    title: 'Full-Stack Music',
    githubHref: 'https://github.com/WaitingChen0117/Full-Stack',
  },
  {
    title: 'Notes Garden',
    href: 'https://waitingchen0117.github.io/',
    githubHref: 'https://github.com/WaitingChen0117',
  },
]

export function CollectorBox({
  onFaceClick,
  onWorkClick,
  onEnterStudio,
  lowPower,
}: CollectorBoxProps) {
  const boxSize = 3.5

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(boxSize, boxSize, boxSize), [boxSize])

  const materials = useMemo(() => {
    const faceMaterial = (color: string, opacity = 1) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.1,
        transparent: opacity < 1,
        opacity,
      })

    return [
      faceMaterial('#e8d4c0', 0.3),
      faceMaterial('#e8d4c0', 0.3),
      faceMaterial('#e8d4c0'),
      faceMaterial('#d4c4b0'),
      faceMaterial('#e8d4c0', 0.3),
      faceMaterial('#e8d4c0', 0.3),
    ]
  }, [])

  return (
    <group>
      <mesh
        geometry={boxGeometry}
        material={materials}
        castShadow={!lowPower}
        receiveShadow={!lowPower}
      />

      <Html position={[0, 0, boxSize / 2 + 0.01]} center>
        <div
          className="box-face-label front"
          onClick={(e) => {
            e.stopPropagation()
            onFaceClick('front')
          }}
        >
          <div className="face-title">ABOUT</div>
          <div className="face-subtitle">关于我</div>
        </div>
      </Html>

      <Html position={[0, 0, -boxSize / 2 - 0.01]} center rotation={[0, Math.PI, 0]}>
        <div className="box-face-label back">
          <div className="face-title">COLLECTION</div>
          <div className="face-subtitle">作品收藏</div>
          <div className="works-shelf">
            {WORKS.map((work, idx) => (
              <button
                key={idx}
                className="work-item"
                onClick={(e) => {
                  e.stopPropagation()
                  onWorkClick(work.href, work.githubHref)
                }}
              >
                <span className="work-index">#{idx + 1}</span>
                <span className="work-title">{work.title}</span>
                {work.href ? (
                  <span className="work-badge live">LIVE</span>
                ) : (
                  <span className="work-badge gh">GH</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Html>

      <Html position={[-boxSize / 2 - 0.01, 0, 0]} center rotation={[0, -Math.PI / 2, 0]}>
        <div
          className="box-face-label left"
          onClick={(e) => {
            e.stopPropagation()
            onFaceClick('left')
          }}
        >
          <div className="face-title">WORKS</div>
          <div className="face-subtitle">作品集</div>
        </div>
      </Html>

      <Html position={[boxSize / 2 + 0.01, 0, 0]} center rotation={[0, Math.PI / 2, 0]}>
        <div
          className="box-face-label right"
          onClick={(e) => {
            e.stopPropagation()
            onEnterStudio()
          }}
        >
          <div className="face-title">STUDIO</div>
          <div className="face-subtitle">进入工作室</div>
          <div className="enter-arrow">→</div>
        </div>
      </Html>

      <Html position={[0, boxSize / 2 + 0.01, 0]} center rotation={[-Math.PI / 2, 0, 0]}>
        <div
          className="box-face-label top"
          onClick={(e) => {
            e.stopPropagation()
            onFaceClick('top')
          }}
        >
          <div className="face-title">WAITING CHEN</div>
        </div>
      </Html>

      <Html position={[0, -boxSize / 2 - 0.01, 0]} center rotation={[Math.PI / 2, 0, 0]}>
        <div
          className="box-face-label bottom"
          onClick={(e) => {
            e.stopPropagation()
            onFaceClick('bottom')
          }}
        >
          <div className="face-subtitle">Senior Frontend</div>
        </div>
      </Html>
    </group>
  )
}
