export const KAABA: GeoCoords = { latitude: 21.4225, longitude: 39.8262 }

export interface GeoCoords {
  latitude: number
  longitude: number
}

export function qiblaBearing(from: GeoCoords): number {
  const phi1 = (from.latitude * Math.PI) / 180
  const phi2 = (KAABA.latitude * Math.PI) / 180
  const deltaLambda = ((KAABA.longitude - from.longitude) * Math.PI) / 180
  const y = Math.sin(deltaLambda)
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda)
  const theta = (Math.atan2(y, x) * 180) / Math.PI
  return (theta + 360) % 360
}

export function roundBearing(value: number): number {
  return Math.round(value)
}

export function cardinalLabel(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360
  if (normalized < 22.5 || normalized >= 337.5) {
    return 'شمال'
  }
  if (normalized < 67.5) {
    return 'شمال شرق'
  }
  if (normalized < 112.5) {
    return 'شرق'
  }
  if (normalized < 157.5) {
    return 'جنوب شرق'
  }
  if (normalized < 202.5) {
    return 'جنوب'
  }
  if (normalized < 247.5) {
    return 'جنوب غرب'
  }
  if (normalized < 292.5) {
    return 'غرب'
  }
  return 'شمال غرب'
}
