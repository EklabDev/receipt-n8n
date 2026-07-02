import type { GpsPoint } from '@/types/mileage';

const EARTH_RADIUS_KM = 6371;
const MIN_SEGMENT_METERS = 15;

/** Haversine distance between two coordinates in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Sum path distance along GPS breadcrumbs, ignoring noise below threshold. */
export function sumPathDistanceKm(points: GpsPoint[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segmentKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
    if (segmentKm * 1000 >= MIN_SEGMENT_METERS) {
      total += segmentKm;
    }
  }
  return Math.round(total * 100) / 100;
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}
