/** Backoff delays (ms) before each retry of a failed async load.
 *  `retrySchedule(n)` = delay before attempt n (0-indexed); -1 = give up. */
export const RETRY_DELAYS = [600, 2000, 6000] as const;
export const MAX_RETRIES = RETRY_DELAYS.length;

export function retrySchedule(attempt: number): number {
  return RETRY_DELAYS[attempt] ?? -1;
}
