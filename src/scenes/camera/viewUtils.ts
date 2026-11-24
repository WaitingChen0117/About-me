import * as THREE from 'three'
import type { CameraView, HotspotDef } from '../types'

const _offset = new THREE.Vector3()
const _spherical = new THREE.Spherical()

/** Convert camera world position + look target into a CameraView. */
export function viewFromPose(
  cameraPos: [number, number, number],
  target: [number, number, number],
): CameraView {
  _offset.set(
    cameraPos[0] - target[0],
    cameraPos[1] - target[1],
    cameraPos[2] - target[2],
  )
  _spherical.setFromVector3(_offset)
  return {
    target: [...target],
    radius: _spherical.radius,
    theta: _spherical.theta,
    phi: _spherical.phi,
  }
}

/** Spherical view → world camera position. */
export function positionFromView(view: CameraView, out = new THREE.Vector3()): THREE.Vector3 {
  _spherical.set(view.radius, view.phi, view.theta)
  out.setFromSpherical(_spherical)
  out.x += view.target[0]
  out.y += view.target[1]
  out.z += view.target[2]
  return out
}

/**
 * Derive a focus framing when HotspotDef.view is missing.
 * Pulls in closer and aims at the object center; theta biases by wall side.
 */
export function defaultViewForHotspot(
  spot: HotspotDef,
  home: CameraView,
): CameraView {
  if (spot.view) return spot.view

  const [x, y, z] = spot.position
  const labelY = spot.labelY ?? 1.05
  const target: [number, number, number] = [x, Math.max(y + 0.55, labelY * 0.55), z]

  const lateral = Math.hypot(x, z)
  const radius = THREE.MathUtils.clamp(2.85 + lateral * 0.12, 2.7, 4.4)

  // Face the object from outside the desk; keep home-ish elevation.
  let theta = Math.atan2(x, z + 0.001)
  if (z < -0.8) {
    // Back-wall props: approach from front (positive z side)
    theta = Math.atan2(x * 0.35, 1.2)
  } else if (x < -1.5) {
    theta = -0.55 + z * 0.05
  } else if (x > 1.5) {
    theta = 0.55 + z * 0.05
  } else {
    theta = home.theta * 0.55 + Math.atan2(x, Math.max(1.2, z + 1.4)) * 0.45
  }

  const phi = THREE.MathUtils.clamp(home.phi * 0.92, 0.72, 1.15)

  return { target, radius, theta, phi }
}

export function resolveHotspotView(spot: HotspotDef, home: CameraView): CameraView {
  return spot.view ?? defaultViewForHotspot(spot, home)
}
