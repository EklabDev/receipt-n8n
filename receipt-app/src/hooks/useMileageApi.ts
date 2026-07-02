import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  buildTripRecord,
  deleteMileageRecord,
  submitMileageTrip,
  type SubmitMileageResponse,
} from '@/lib/api';
import type { MileageTripPayload, Trip } from '@/types/mileage';

export function useMileageApi() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: MileageTripPayload): Promise<Trip> => {
    setIsSubmitting(true);
    setError(null);

    const id = uuidv4();

    try {
      const response: SubmitMileageResponse = await submitMileageTrip(payload);
      const result = buildTripRecord(id, 'success', payload, response.data);
      setLastResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit trip';
      setError(message);
      const failed = buildTripRecord(id, 'error', payload, undefined, message);
      setLastResult(failed);
      return failed;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const remove = useCallback(async (trip: Trip) => {
    const key = trip.sheetSubmittedAt ?? trip.submittedAt;
    if (key) {
      await deleteMileageRecord({ submittedAt: key });
    }
  }, []);

  const reset = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return { isSubmitting, lastResult, error, submit, remove, reset };
}
