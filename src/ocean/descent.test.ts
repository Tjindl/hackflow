import { describe, expect, it } from 'vitest';
import { createDescent, travelDuration } from './descent';

describe('createDescent', () => {
  it('rests at its initial position', () => {
    expect(createDescent({ initial: 2 }).sample(0)).toEqual({ position: 2, velocity: 0, moving: false });
  });

  it('eases from one step to the next', () => {
    const descent = createDescent();
    const duration = descent.travelTo(1, 0);

    expect(duration).toBe(travelDuration(1));
    expect(descent.sample(0).position).toBe(0);
    expect(descent.sample(duration / 2).position).toBeCloseTo(0.5, 5);
    expect(descent.sample(duration / 2).velocity).toBeGreaterThan(0);
    expect(descent.sample(duration)).toEqual({ position: 1, velocity: 0, moving: false });
  });

  it('reports negative velocity while ascending', () => {
    const descent = createDescent({ initial: 3 });
    const duration = descent.travelTo(0, 0);
    expect(descent.sample(duration / 2).velocity).toBeLessThan(0);
  });

  it('continues from wherever it is when redirected mid-trip', () => {
    const descent = createDescent();
    const first = descent.travelTo(2, 0);
    const midway = descent.sample(first / 2).position;
    descent.travelTo(0, first / 2);
    expect(descent.sample(first / 2).position).toBeCloseTo(midway, 5);
  });

  it('jumps without animating when motion is reduced', () => {
    const descent = createDescent({ reducedMotion: true });
    expect(descent.travelTo(4, 0)).toBe(0);
    expect(descent.sample(0)).toEqual({ position: 4, velocity: 0, moving: false });
  });

  it('notifies subscribers when a trip starts', () => {
    const descent = createDescent();
    let calls = 0;
    const unsubscribe = descent.subscribe(() => calls++);
    descent.travelTo(1, 0);
    unsubscribe();
    descent.travelTo(2, 0);
    expect(calls).toBe(1);
  });
});

describe('travelDuration', () => {
  it('grows with distance up to a cap', () => {
    expect(travelDuration(0)).toBe(0);
    expect(travelDuration(2)).toBeGreaterThan(travelDuration(1));
    expect(travelDuration(50)).toBe(travelDuration(500));
  });
});
