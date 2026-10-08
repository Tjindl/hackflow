/**
 * Water colour per renderer level (0 = surface … 5 = seafloor), at the top and
 * bottom of the frame. Red light is absorbed first, so the column shifts from
 * sunlit teal to deep blue to black. Shared by the shader and the CSS fallback.
 */
const TOP = ['#2c8fb5', '#0e5d86', '#072b48', '#04182e', '#030f1f', '#020a15'] as const;
const BOTTOM = ['#0a4467', '#06304f', '#03152a', '#020b18', '#01070f', '#01040a'] as const;

type Rgb = readonly [number, number, number];

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const toSrgb = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

function hexToLinear(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) =>
    toLinear(c / 255),
  ) as unknown as Rgb;
}

function linearToHex(rgb: Rgb): string {
  const channels = rgb.map((c) => Math.round(toSrgb(Math.min(1, Math.max(0, c))) * 255));
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const TOP_LINEAR = TOP.map(hexToLinear);
const BOTTOM_LINEAR = BOTTOM.map(hexToLinear);

/** Flattened linear RGB triplets, ready for `uniform3fv`. */
export const WATER_UNIFORMS = {
  top: new Float32Array(TOP_LINEAR.flat()),
  bottom: new Float32Array(BOTTOM_LINEAR.flat()),
};

function mixAt(stops: readonly Rgb[], level: number): Rgb {
  const clamped = Math.min(stops.length - 1, Math.max(0, level));
  const i = Math.min(stops.length - 2, Math.floor(clamped));
  const t = clamped - i;
  const [a, b] = [stops[i], stops[i + 1]];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** sRGB hex colours for a level, blended in linear light like the shader does. */
export function waterColorsAt(level: number): { top: string; bottom: string } {
  return { top: linearToHex(mixAt(TOP_LINEAR, level)), bottom: linearToHex(mixAt(BOTTOM_LINEAR, level)) };
}
