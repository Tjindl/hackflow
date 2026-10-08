/**
 * The camera's position in the water column, measured in steps (0 = first
 * question). Consumers sample it once per animation frame, so the WebGL
 * renderer, the depth gauge and the telemetry stay in lockstep without React
 * re-rendering every frame.
 */
export interface DescentSample {
  position: number;
  /** Steps per second; positive while descending. */
  velocity: number;
  moving: boolean;
}

export interface Descent {
  sample(now?: number): DescentSample;
  /** Starts travelling to `target` and returns the duration of the trip in ms. */
  travelTo(target: number, now?: number): number;
  setReducedMotion(reduced: boolean): void;
  subscribe(listener: () => void): () => void;
}

const BASE_DURATION_MS = 1_400;
const EXTRA_STEP_MS = 420;
const MAX_DURATION_MS = 3_200;

export function travelDuration(distance: number): number {
  if (distance <= 0) return 0;
  return Math.min(MAX_DURATION_MS, BASE_DURATION_MS + EXTRA_STEP_MS * (Math.max(1, distance) - 1));
}

// easeInOutCubic and its derivative, matching cubic-bezier(0.65, 0, 0.35, 1) in CSS.
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const easeSlope = (t: number) => (t < 0.5 ? 12 * t ** 2 : 3 * (-2 * t + 2) ** 2);

export function createDescent(options: { initial?: number; reducedMotion?: boolean } = {}): Descent {
  let from = options.initial ?? 0;
  let to = from;
  let start = 0;
  let duration = 0;
  let reducedMotion = options.reducedMotion ?? false;
  const listeners = new Set<() => void>();

  function sample(now = performance.now()): DescentSample {
    const elapsed = now - start;
    if (duration === 0 || elapsed >= duration) return { position: to, velocity: 0, moving: false };

    const t = Math.max(0, elapsed) / duration;
    return {
      position: from + (to - from) * ease(t),
      velocity: ((to - from) * easeSlope(t)) / (duration / 1_000),
      moving: true,
    };
  }

  return {
    sample,
    travelTo(target, now = performance.now()) {
      const current = sample(now).position;
      if (target === to && current === target) return 0;

      from = current;
      to = target;
      start = now;
      duration = reducedMotion ? 0 : travelDuration(Math.abs(target - current));
      listeners.forEach((listener) => listener());
      return duration;
    },
    setReducedMotion(reduced) {
      reducedMotion = reduced;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
