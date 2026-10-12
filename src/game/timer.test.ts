import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isTimeUp, isWarning, remainingSeconds, TURN_TIME_LIMIT } from './timer';
import * as E from './engine';

describe('ターン制限タイマー', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('制限時間は60秒', () => expect(TURN_TIME_LIMIT).toBe(60));
  it('経過に応じて残り秒数が減り、0で止まる', () => {
    const t0 = Date.now();
    expect(remainingSeconds(t0, Date.now())).toBe(60);
    vi.advanceTimersByTime(50_500);
    expect(remainingSeconds(t0, Date.now())).toBe(10);
    vi.advanceTimersByTime(20_000);
    expect(remainingSeconds(t0, Date.now())).toBe(0);
  });
  it('10秒以下で警告、0で時間切れ', () => {
    expect(isWarning(11)).toBe(false);
    expect(isWarning(10)).toBe(true);
    expect(isTimeUp(1)).toBe(false);
    expect(isTimeUp(0)).toBe(true);
  });
  it('時間切れ時のターン終了で次のターンへ進む（残り行動は破棄）', () => {
    const s = E.newGame();
    const n = E.endTurn(s);
    expect(n.turn).toBe(s.turn + 1);
  });
});
