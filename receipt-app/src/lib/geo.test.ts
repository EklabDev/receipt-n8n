import { describe, expect, it } from 'vitest';
import { haversineKm, sumPathDistanceKm } from './geo';
import type { GpsPoint } from '@/types/mileage';

describe('haversineKm', () => {
  it('returns ~1 km for two points 1 km apart at equator', () => {
    const d = haversineKm(0, 0, 0, 1 / 111.32);
    expect(d).toBeGreaterThan(0.99);
    expect(d).toBeLessThan(1.01);
  });

  it('returns 0 for identical points', () => {
    expect(haversineKm(43.65, -79.38, 43.65, -79.38)).toBe(0);
  });
});

describe('sumPathDistanceKm', () => {
  it('returns 0 for fewer than 2 points', () => {
    expect(sumPathDistanceKm([])).toBe(0);
    expect(sumPathDistanceKm([{ lat: 0, lng: 0, timestamp: 0 }])).toBe(0);
  });

  it('ignores GPS noise below 15 m threshold', () => {
    const points: GpsPoint[] = [
      { lat: 43.6532, lng: -79.3832, timestamp: 1 },
      { lat: 43.6532001, lng: -79.3832001, timestamp: 2 },
      { lat: 43.6622, lng: -79.3832, timestamp: 3 },
    ];
    const d = sumPathDistanceKm(points);
    expect(d).toBeGreaterThan(0.9);
    expect(d).toBeLessThan(1.1);
  });
});
