import { useEffect, useRef, useState } from 'react';
import { remainingSeconds, TURN_TIME_LIMIT } from './timer';

/**
 * ターン制限タイマー。turnKey が変わるたび（=プレイヤーのターン開始）に60秒からリセット。
 * active=false の間（ゲーム終了など）は停止。時間切れで onTimeUp を1度だけ呼ぶ。
 */
export function useTurnTimer(turnKey: unknown, active: boolean, onTimeUp: () => void, limit = TURN_TIME_LIMIT) {
  const [left, setLeft] = useState(limit);
  const cb = useRef(onTimeUp);
  cb.current = onTimeUp;
  useEffect(() => {
    setLeft(limit);
    if (!active) return;
    const start = Date.now();
    let fired = false;
    const id = setInterval(() => {
      const r = remainingSeconds(start, Date.now(), limit);
      setLeft(r);
      if (r <= 0 && !fired) { fired = true; clearInterval(id); cb.current(); }
    }, 250);
    return () => clearInterval(id);
  }, [turnKey, active, limit]);
  return left;
}
