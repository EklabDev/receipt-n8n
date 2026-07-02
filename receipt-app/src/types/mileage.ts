export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

export type TrackingMode = 'GPS' | 'Manual';

export interface MileageTripPayload {
  submittedAt: string;
  startTime: string;
  endTime: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  startLocation?: string;
  endLocation?: string;
  distanceKm: number;
  businessPurpose: string;
  trackingMode: TrackingMode;
  gpsPointCount?: number;
  vehicle?: string;
}

export interface MileageTripResult {
  distanceKm: number;
  deduction?: number;
  submittedAt: string;
}

export interface Trip {
  id: string;
  submittedAt: string;
  startTime: string;
  endTime: string;
  startLocation?: string;
  endLocation?: string;
  distanceKm: number;
  businessPurpose: string;
  trackingMode: TrackingMode;
  deduction?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  sheetSubmittedAt?: string;
}

export interface ActiveTripState {
  startedAt: string;
  points: GpsPoint[];
}
