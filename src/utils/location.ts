import type { GeoCoords } from './prayer-times'

export const DEFAULT_LOCATION: GeoCoords = {
  latitude: 21.4225, // مكة المكرمة
  longitude: 39.8262,
}

export const LOCATION_KEY = 'mushaf-al-huda:location'

export function isValidCoords(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export function readStoredLocation(): GeoCoords | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (raw === null) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }
    const candidate = parsed as Partial<GeoCoords>
    const latitude = Number(candidate.latitude)
    const longitude = Number(candidate.longitude)
    if (!isValidCoords(latitude, longitude)) {
      return null
    }
    return { latitude, longitude }
  } catch {
    return null
  }
}

export function writeStoredLocation(coords: GeoCoords): void {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(coords))
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

export function clearStoredLocation(): void {
  try {
    localStorage.removeItem(LOCATION_KEY)
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

export function getCurrentPosition(): Promise<GeoCoords> {
  return new Promise<GeoCoords>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('navigator.geolocation غير مدعوم في هذا المتصفح'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(new Error(error.message))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  })
}
