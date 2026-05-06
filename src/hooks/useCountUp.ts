import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from 0 (or `from`) to `value` over `duration` ms.
 * Uses requestAnimationFrame with ease-out cubic.
 */
export function useCountUp(value: number, duration = 900, from = 0) {
  const [display, setDisplay] = useState(from);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(from);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const startVal = fromRef.current;
    const delta = value - startVal;
    if (delta === 0) {
      setDisplay(value);
      return;
    }

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startVal + delta * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return display;
}
