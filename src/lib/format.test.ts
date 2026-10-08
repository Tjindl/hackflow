import { describe, expect, it } from 'vitest';
import { formatDepth, formatPressure, formatSunlight, formatTemperature, padStep } from './format';

describe('formatters', () => {
  it('formats readings with sensible precision', () => {
    expect(formatDepth(10_935.4)).toBe('10,935 m');
    expect(formatPressure(21.04)).toBe('21.0 atm');
    expect(formatPressure(1_085.8)).toBe('1,086 atm');
    expect(formatTemperature(4.44)).toBe('4.4 °C');
    expect(padStep(3)).toBe('03');
  });

  it('shows faint sunlight honestly instead of rounding it to zero', () => {
    expect(formatSunlight(100)).toBe('100%');
    expect(formatSunlight(1)).toBe('1.0%');
    expect(formatSunlight(0.05)).toBe('0.05%');
    expect(formatSunlight(0.001)).toBe('<0.01%');
    expect(formatSunlight(1e-9)).toBe('0%');
  });
});
