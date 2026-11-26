import { useAnimations, useGLTF } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

/** Optimized KayKit Rogue — CC0, see `public/models/ATTRIBUTION.md`. */
export const OPERATOR_MODEL_URL = `${import.meta.env.BASE_URL}models/operator-kaykit-rogue.glb`

/** Draco decoder (drei / three examples CDN). */
const DRACO_DECODER =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

/**
 * Room was tuned for a ~1.1-unit figure. KayKit Rogue is ~2.19 m tall;
 * this scale keeps desk / chair / pathfinding proportions readable.
 */
export const OPERATOR_MODEL_SCALE = 0.52

export type OperatorClip =
  | 'idle'
  | 'walk'
  | 'sit-down'
  | 'sit-idle'
  | 'stand-up'

const CLIP_NAME: Record<OperatorClip, string> = {
  idle: 'Idle',
  walk: 'Walking_A',
  'sit-down': 'Sit_Chair_Down',
  'sit-idle': 'Sit_Chair_Idle',
  'stand-up': 'Sit_Chair_StandUp',
}

type Props = {
  clip: OperatorClip
  /** Soft emissive boost while hovered / walking. */
  highlight?: boolean
  onClipFinished?: (clip: OperatorClip) => void
}

/**
 * KayKit Rogue avatar — skinned GLB with Idle / Walk / Sit chair clips.
 * Parent group owns world XZ / yaw; this component only owns mesh + mixer.
 */
export function OperatorAvatar({ clip, highlight = false, onClipFinished }: Props) {
  const root = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(OPERATOR_MODEL_URL, DRACO_DECODER)
  const model = useMemo(() => cloneSkeleton(scene), [scene])
  const { actions, mixer } = useAnimations(animations, root)
  const current = useRef<OperatorClip | null>(null)
  const finishRef = useRef(onClipFinished)
  finishRef.current = onClipFinished

  useLayoutEffect(() => {
    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      obj.castShadow = true
      obj.receiveShadow = true
    })
  }, [model])

  useEffect(() => {
    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of mats) {
        if (!mat || !('emissiveIntensity' in mat)) continue
        ;(mat as THREE.MeshStandardMaterial).emissiveIntensity = highlight ? 0.08 : 0.02
      }
    })
  }, [model, highlight])

  useEffect(() => {
    const name = CLIP_NAME[clip]
    const next = actions[name]
    if (!next) return

    const prevClip = current.current
    const prev = prevClip ? actions[CLIP_NAME[prevClip]] : null
    const oneshot = clip === 'sit-down' || clip === 'stand-up'
    const fade = 0.2

    next.reset()
    if (oneshot) {
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity)
      next.clampWhenFinished = false
    }

    if (prev && prev !== next) {
      prev.fadeOut(fade)
      next.fadeIn(fade).play()
    } else {
      next.fadeIn(prev ? fade : 0.1).play()
    }

    current.current = clip

    const onFinished = (e: { action: THREE.AnimationAction }) => {
      if (e.action.getClip().name !== name) return
      finishRef.current?.(clip)
    }
    mixer.addEventListener('finished', onFinished)
    return () => {
      mixer.removeEventListener('finished', onFinished)
    }
  }, [actions, clip, mixer])

  return (
    <group ref={root} scale={OPERATOR_MODEL_SCALE} dispose={null}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(OPERATOR_MODEL_URL, DRACO_DECODER)
