export const TURN_TIME_LIMIT = 60;
export const TURN_WARNING_AT = 10;

/** 残り秒数（0未満にはならない） */
export function remainingSeconds(startedAt: number, now: number, limit = TURN_TIME_LIMIT): number {
  return Math.max(0, limit - Math.floor((now - startedAt) / 1000));
}
export const isWarning = (sec: number) => sec <= TURN_WARNING_AT;
export const isTimeUp = (sec: number) => sec <= 0;
