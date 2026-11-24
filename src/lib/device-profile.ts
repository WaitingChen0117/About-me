import { useEffect, useState } from 'react'

export type DeviceProfile = {
  lowPower: boolean
  isTouch: boolean
  isNarrow: boolean
}

export function readDeviceProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return { lowPower: false, isTouch: false, isNarrow: false }
  }
  const narrow = window.matchMedia('(max-width: 720px)').matches
  const touch = window.matchMedia('(pointer: coarse)').matches
  const lowCpu =
    typeof navigator !== 'undefined' &&
    navigator.hardwareConcurrency > 0 &&
    navigator.hardwareConcurrency <= 4
  const saveData =
    typeof navigator !== 'undefined' &&
    'connection' in navigator &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return {
    isNarrow: narrow,
    isTouch: touch,
    lowPower: narrow || touch || lowCpu || saveData || reduceMotion,
  }
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState(readDeviceProfile)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px), (pointer: coarse), (prefers-reduced-motion: reduce)')
    const sync = () => setProfile(readDeviceProfile())
    sync()
    mq.addEventListener('change', sync)
    window.addEventListener('resize', sync)
    return () => {
      mq.removeEventListener('change', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  return profile
}
