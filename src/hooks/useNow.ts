import { useEffect, useState } from 'react';

/** Re-renders every `intervalMs` while `active`, returning the current epoch ms. */
export function useNow(intervalMs = 1000, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const update = () => setNow(Date.now());
    const first = window.setTimeout(update, 0); // refresh a stale value right after (re)activation
    const id = window.setInterval(update, intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [intervalMs, active]);
  return now;
}
