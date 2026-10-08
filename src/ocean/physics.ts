import type { Zone } from './zones';

/** Metres of seawater per atmosphere: 101.325 kPa / (1025 kg/m³ × 9.80665 m/s²). */
const METRES_PER_ATMOSPHERE = 10.08;

/** Absolute pressure in atmospheres (air above the surface included). */
export function pressureAtm(depth: number): number {
  return 1 + Math.max(0, depth) / METRES_PER_ATMOSPHERE;
}

/**
 * A representative temperature profile for the tropical western Pacific,
 * above the Mariana Trench: a warm mixed layer, a steep thermocline, and
 * near-freezing deep water that warms slightly under trench pressure.
 */
const TEMPERATURE_PROFILE: ReadonlyArray<readonly [depth: number, celsius: number]> = [
  [0, 28.5],
  [60, 28],
  [120, 25.5],
  [200, 17],
  [300, 11.5],
  [500, 7.5],
  [1_000, 4.4],
  [2_000, 2.4],
  [4_000, 1.5],
  [6_000, 1.6],
  [8_000, 2],
  [10_935, 2.5],
];

export function temperatureC(depth: number): number {
  return interpolate(TEMPERATURE_PROFILE, depth);
}

/** Diffuse attenuation for very clear ocean water: 1% of surface light remains at 200 m. */
const LIGHT_ATTENUATION = Math.log(100) / 200;

/** Share of surface sunlight remaining, in percent. */
export function sunlightPercent(depth: number): number {
  return 100 * Math.exp(-LIGHT_ATTENUATION * Math.max(0, depth));
}

/** Depth in metres for a fractional step position (e.g. 1.5 = halfway between steps 1 and 2). */
export function depthAt(position: number, stops: readonly Zone[]): number {
  return interpolate(
    stops.map((zone, i) => [i, zone.depth] as const),
    position,
  );
}

/** Renderer level (0 = surface … 5 = seafloor) for a fractional step position. */
export function levelAt(position: number, stops: readonly Zone[]): number {
  return interpolate(
    stops.map((zone, i) => [i, zone.level] as const),
    position,
  );
}

/** Piecewise-linear interpolation over points sorted by x, clamped at both ends. */
function interpolate(points: ReadonlyArray<readonly [number, number]>, x: number): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];

  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return last[1];
}
