import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActiveTripState, GpsPoint } from '@/types/mileage';
import { sumPathDistanceKm } from '@/lib/geo';

const STORAGE_KEY = 'active-mileage-trip';

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 15000,
};

function loadStoredTrip(): ActiveTripState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveTripState;
    if (!parsed.startedAt || !Array.isArray(parsed.points)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveTrip(state: ActiveTripState | null) {
  if (!state) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useGpsTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const distanceKm = sumPathDistanceKm(points);

  const persist = useCallback((nextPoints: GpsPoint[], nextStartedAt: string) => {
    saveTrip({ startedAt: nextStartedAt, points: nextPoints });
  }, []);

  const stopWatcher = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startTrip = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device');
      return;
    }

    setError(null);
    const now = new Date().toISOString();
    setStartedAt(now);
    setPoints([]);
    setIsTracking(true);
    persist([], now);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const point: GpsPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
        };
        setPoints((prev) => {
          const next = [...prev, point];
          persist(next, now);
          return next;
        });
      },
      (err) => {
        setError(err.message || 'Failed to get GPS location');
      },
      WATCH_OPTIONS
    );
  }, [persist]);

  const stopTrip = useCallback(() => {
    stopWatcher();
    setIsTracking(false);
    saveTrip(null);
  }, [stopWatcher]);

  const resumeTrip = useCallback(() => {
    const stored = loadStoredTrip();
    if (!stored) return false;

    setStartedAt(stored.startedAt);
    setPoints(stored.points);
    setIsTracking(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const point: GpsPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
        };
        setPoints((prev) => {
          const next = [...prev, point];
          persist(next, stored.startedAt);
          return next;
        });
      },
      (err) => {
        setError(err.message || 'Failed to get GPS location');
      },
      WATCH_OPTIONS
    );
    return true;
  }, [persist]);

  const clearTrip = useCallback(() => {
    stopWatcher();
    setIsTracking(false);
    setPoints([]);
    setStartedAt(null);
    setError(null);
    saveTrip(null);
  }, [stopWatcher]);

  useEffect(() => {
    const stored = loadStoredTrip();
    if (stored) {
      setStartedAt(stored.startedAt);
      setPoints(stored.points);
    }
    return () => stopWatcher();
  }, [stopWatcher]);

  return {
    isTracking,
    points,
    startedAt,
    distanceKm,
    error,
    startTrip,
    stopTrip,
    resumeTrip,
    clearTrip,
  };
}
