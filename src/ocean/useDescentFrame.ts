import { useLayoutEffect, useRef } from 'react';
import type { Descent, DescentSample } from './descent';

/**
 * Calls `onFrame` with a fresh sample on every animation frame while the
 * descent is moving, and once whenever it settles. Use it to write to the DOM
 * directly (via refs) instead of re-rendering React at 60 fps.
 */
export function useDescentFrame(descent: Descent, onFrame: (sample: DescentSample) => void): void {
  const callback = useRef(onFrame);
  useLayoutEffect(() => {
    callback.current = onFrame;
  });

  // Layout effect so the first sample is written before the browser paints.
  useLayoutEffect(() => {
    let frame = 0;

    const tick = () => {
      const sample = descent.sample();
      callback.current(sample);
      frame = sample.moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    tick();
    const unsubscribe = descent.subscribe(wake);
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [descent]);
}
