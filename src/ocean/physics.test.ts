import { describe, expect, it } from 'vitest';
import { depthAt, levelAt, pressureAtm, sunlightPercent, temperatureC } from './physics';
import { CHALLENGER_DEEP_DEPTH, zoneAtDepth, zonesForSteps } from './zones';

describe('pressureAtm', () => {
  it('is one atmosphere at the surface and gains about one every 10 m', () => {
    expect(pressureAtm(0)).toBe(1);
    expect(pressureAtm(10.08)).toBeCloseTo(2, 5);
  });

  it('is a little over 1,000 atmospheres in the Challenger Deep', () => {
    expect(pressureAtm(CHALLENGER_DEEP_DEPTH)).toBeGreaterThan(1_050);
    expect(pressureAtm(CHALLENGER_DEEP_DEPTH)).toBeLessThan(1_110);
  });
});

describe('sunlightPercent', () => {
  it('leaves 1% of surface light at 200 m', () => {
    expect(sunlightPercent(0)).toBe(100);
    expect(sunlightPercent(200)).toBeCloseTo(1, 5);
  });
});

describe('temperatureC', () => {
  it('interpolates between profile points and clamps beyond them', () => {
    expect(temperatureC(0)).toBe(28.5);
    expect(temperatureC(1_500)).toBeCloseTo((4.4 + 2.4) / 2, 5);
    expect(temperatureC(20_000)).toBe(2.5);
  });

  it('is colder in the deep than at the surface', () => {
    expect(temperatureC(4_000)).toBeLessThan(temperatureC(200));
  });
});

describe('step positions', () => {
  const stops = zonesForSteps(5);

  it('maps each step to its zone and interpolates between them', () => {
    expect(depthAt(0, stops)).toBe(0);
    expect(depthAt(2, stops)).toBe(1_000);
    expect(depthAt(1.5, stops)).toBe(600);
    expect(depthAt(5, stops)).toBe(CHALLENGER_DEEP_DEPTH);
    expect(levelAt(2.25, stops)).toBe(2.25);
  });

  it('keeps sinking when there are more questions than zones', () => {
    const many = zonesForSteps(8);
    const depths = many.map((zone) => zone.depth);
    expect(depths).toEqual([...depths].sort((a, b) => a - b));
    expect(many.at(-1)?.id).toBe('seafloor');
  });
});

describe('zoneAtDepth', () => {
  it('names the zone a depth actually falls in', () => {
    const stops = zonesForSteps(5);
    expect(zoneAtDepth(193, stops).name).toBe('Sunlight zone');
    expect(zoneAtDepth(200, stops).name).toBe('Twilight zone');
    expect(zoneAtDepth(CHALLENGER_DEEP_DEPTH, stops).id).toBe('seafloor');
  });
});
