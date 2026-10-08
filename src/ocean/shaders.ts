export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/**
 * The whole scene in one full-screen pass. Positions are in frame heights
 * (y = 0 bottom, 1 top; x runs to the aspect ratio). Lighting is accumulated
 * in linear RGB and encoded to sRGB with dithering to avoid banding in the
 * deep blues.
 */
export const FRAGMENT_SHADER = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uLevel;     // 0 = surface ... 5 = seafloor
uniform float uTravel;    // camera position in steps; drives parallax
uniform float uSpeed;     // steps per second, positive while descending
uniform float uSiltAge;   // seconds since touching the seafloor
uniform vec3 uTop[6];     // linear water colour at the top of the frame, per level
uniform vec3 uBottom[6];  // ...and at the bottom

varying vec2 vUv;

const float TAU = 6.2831853;

// ------------------------------------------------------------------ utilities

float hash(vec2 p) {
  p = mod(p, 289.0);
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amplitude * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    amplitude *= 0.5;
  }
  return sum;
}

// 1 below a, 0 above b (a < b). smoothstep with reversed edges is undefined in GLSL.
float falloff(float a, float b, float x) {
  return 1.0 - smoothstep(a, b, x);
}

// Approximate signed distance to an axis-aligned ellipse with radii r.
float ellipse(vec2 p, vec2 r) {
  return (length(p / r) - 1.0) * min(r.x, r.y);
}

float smoothUnion(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

// ------------------------------------------------------------------ sunlit water

vec3 waterColor(float level, float y) {
  vec3 top = uTop[0];
  vec3 bottom = uBottom[0];
  for (int i = 1; i < 6; i++) {
    float w = clamp(level - float(i - 1), 0.0, 1.0);
    top = mix(top, uTop[i], w);
    bottom = mix(bottom, uBottom[i], w);
  }
  return mix(bottom, top, smoothstep(-0.15, 1.05, y));
}

// The underside of the surface: a bright, slowly heaving band with glints.
vec3 surfaceGlare(vec2 p, float level, float t) {
  float below = 1.0 + level * 1.8 - p.y;
  if (below > 1.5) return vec3(0.0);
  float swell = fbm(vec2(p.x * 2.6 + t * 0.05, t * 0.08));
  float glints = noise(vec2(p.x * 18.0 - t * 0.5, p.y * 6.0 + t * 0.7));
  float glare = exp(-below * 6.5) * (0.35 + 0.65 * swell) + exp(-below * 22.0) * glints * 0.6;
  return vec3(0.42, 0.78, 0.98) * glare;
}

// Shafts of sunlight fanning down from a point on the surface above the frame.
float lightShafts(vec2 p, float aspect, float level, float t) {
  vec2 source = vec2(aspect * 0.64, 2.1 + level * 0.6);
  vec2 d = p - source;
  float angle = atan(d.x, -d.y);
  float s = noise(vec2(angle * 24.0, t * 0.07)) * 0.6 + noise(vec2(angle * 57.0 + 4.0, t * 0.11)) * 0.4;
  return smoothstep(0.45, 0.95, s) * exp(-max(0.0, source.y - p.y - 1.1) * 1.3);
}

// A distant school of small fish, backlit by the surface. x: silhouette, y: glint.
vec2 fishSchool(vec2 p, float aspect, float level, float t) {
  float visibility = falloff(0.2, 0.85, level);
  vec2 center = vec2(
    mix(aspect + 0.6, -0.6, fract(t * 0.009 + 0.42)),
    0.78 + 0.025 * sin(t * 0.23) + level * 1.4
  );
  vec2 rel = p - center;
  float shape = length(rel * vec2(1.0, 2.4)) + 0.07 * (noise(p * 5.0 + t * 0.12) - 0.5);
  float density = falloff(0.04, 0.3, shape) * visibility;
  if (density <= 0.0) return vec2(0.0);

  vec2 q = rel * 75.0;
  vec2 id = floor(q);
  float h = hash(id + 7.0);
  if (h > density * 0.55) return vec2(0.0);

  vec2 f = fract(q) - 0.5;
  f -= 0.16 * vec2(sin(t * 1.6 + h * 40.0), cos(t * 1.2 + h * 23.0));
  float body = falloff(0.15, 0.25, length((f - vec2(-0.04, 0.0)) * vec2(1.0, 3.2)));
  float tail = falloff(0.0, 0.03, abs(f.y) - (f.x - 0.13) * 0.6) * step(0.15, f.x) * falloff(0.27, 0.3, f.x);
  float fish = max(body, tail);
  return vec2(fish, fish * pow(max(0.0, sin(t * 2.3 + h * 50.0)), 24.0));
}

// ------------------------------------------------------------------ below the photic zone

// Floodlights on the submersible, aimed down and ahead.
float lampCone(vec2 p, float aspect) {
  vec2 d = p - vec2(aspect * 0.5, 1.3);
  float beam = falloff(0.12, 0.9, abs(atan(d.x, -d.y)));
  return beam / (1.0 + dot(d, d) * 1.4);
}

// One parallax layer of marine snow. Flakes streak while the camera moves.
float snowLayer(vec2 p, float cells, float parallax, float size, float density, float focus, float seed, float t) {
  vec2 q = p * cells;
  q.y -= uTravel * parallax * cells;
  q.y += t * 0.22;
  q.x += sin(t * 0.17 + seed * 1.7) * 0.4;
  float trail = clamp(uSpeed * parallax * cells / 28.0, -1.6, 1.6);

  vec2 base = floor(q);
  float total = 0.0;
  for (int k = -2; k <= 2; k++) {
    vec2 id = base + vec2(0.0, float(k));
    float h = hash(id + seed * 37.0);
    if (h > density) continue;
    vec2 center = id + 0.2 + 0.6 * vec2(hash(id + seed * 37.0 + 11.3), hash(id + seed * 37.0 + 27.1));
    float radius = size * (0.5 + hash(id + seed * 37.0 + 5.7));
    float d = segmentDistance(q, center, center - vec2(0.0, trail));
    float flake = falloff(radius * focus, radius, d);
    float shimmer = 0.75 + 0.25 * sin(t * (0.6 + h * 2.0) + h * 50.0);
    total += flake * shimmer * radius / (radius + abs(trail) * 0.2);
  }
  return total;
}

float marineSnow(vec2 p, float t) {
  return snowLayer(p, 6.0, 3.0, 0.075, 0.26, 0.0, 1.0, t) * 0.9
       + snowLayer(p, 11.0, 2.0, 0.065, 0.36, 0.35, 2.0, t) * 0.75
       + snowLayer(p, 19.0, 1.35, 0.06, 0.44, 0.5, 3.0, t) * 0.5
       + snowLayer(p, 31.0, 0.85, 0.055, 0.5, 0.55, 4.0, t) * 0.32;
}

// Lanternfish in the twilight zone. Their bodies are hidden by counter-illumination;
// only the curved rows of photophores along their bellies give them away.
vec3 lanternfish(vec2 p, float level, float t) {
  float visibility = falloff(0.3, 0.75, abs(level - 1.0));
  if (visibility <= 0.0) return vec3(0.0);

  vec2 q = p * 6.0;
  q.y -= uTravel * 1.8 * 6.0;
  q.x -= t * 0.12;
  vec2 id = floor(q);
  if (hash(id + 41.0) > 0.12) return vec3(0.0);

  float size = 0.6 + 0.6 * hash(id + 5.0);
  float tilt = (hash(id + 6.0) - 0.5) * 0.7;
  vec2 f = fract(q) - 0.5;
  f -= 0.12 * vec2(sin(t * 0.4 + hash(id + 2.0) * TAU), cos(t * 0.3 + hash(id + 3.0) * TAU));
  f = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * f / size;

  float count = 4.0 + floor(hash(id + 7.0) * 3.0);
  float light = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    if (fi >= count) break;
    float x = -0.08 + fi * 0.032;
    vec2 spot = f - vec2(x, 2.2 * x * x - 0.035);
    float d2 = dot(spot, spot);
    light += exp(-d2 * 9000.0) + exp(-d2 * 900.0) * 0.1;
  }
  return vec3(0.25, 0.62, 1.0) * light * (0.4 + 0.6 * hash(id + 8.0)) * visibility;
}

// Sparse blue-green flashes, more of them when the camera disturbs the water.
vec3 bioluminescence(vec2 p, float level, float t) {
  float presence = smoothstep(1.15, 1.9, level) * (1.0 - 0.55 * smoothstep(3.6, 5.0, level));
  if (presence <= 0.0) return vec3(0.0);
  float stirred = clamp(abs(uSpeed) * 0.8, 0.0, 1.0);

  vec3 total = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float fl = float(layer);
    float cells = 4.5 + fl * 4.0;
    vec2 q = p * cells;
    q.y -= uTravel * (2.4 - fl * 0.9) * cells;
    q.y += t * 0.05;
    vec2 id = floor(q);
    if (hash(id + 91.0 + fl * 13.0) > 0.32) continue;

    vec2 d = q - id - (0.3 + 0.4 * vec2(hash(id + 3.1 + fl), hash(id + 7.7 + fl)));
    float d2 = dot(d, d);
    float blink = pow(max(0.0, sin(t * (0.18 + 0.4 * hash(id + 5.3)) + hash(id + 9.1) * TAU)), 40.0);
    float energy = max(blink, stirred * step(0.45, hash(id + 2.2)) * 0.85);
    vec3 tint = mix(vec3(0.08, 0.5, 1.0), vec3(0.06, 0.95, 0.78), hash(id + 4.4));
    total += tint * (exp(-d2 * 1400.0) + exp(-d2 * 110.0) * 0.28) * energy * (1.0 - fl * 0.35);
  }
  return total * presence;
}

// A drifting medusa in the midnight zone, glowing faintly as its bell contracts.
vec3 medusa(vec2 p, float aspect, float level, float t) {
  float visibility = falloff(0.3, 0.95, abs(level - 2.0));
  if (visibility <= 0.0) return vec3(0.0);

  float landscape = smoothstep(0.8, 1.4, aspect);
  vec2 center = vec2(
    aspect * 0.83 + 0.02 * sin(t * 0.11),
    mix(0.2, 0.27, landscape) + (level - 2.0) * 1.15 + 0.03 * sin(t * 0.37)
  );
  vec2 l = (p - center) / mix(0.05, 0.06, landscape);
  if (abs(l.x) > 2.4 || l.y > 1.6 || l.y < -5.2) return vec3(0.0);

  float pulse = 0.5 + 0.5 * sin(t * 1.25);
  float rx = 1.0 - 0.1 * pulse;
  float ry = 0.8 + 0.1 * pulse;
  float e = length(vec2(l.x / rx, max(l.y, 0.0) / ry));
  float margin = -0.16 * (1.0 - clamp((l.x * l.x) / (rx * rx), 0.0, 1.0));
  float underside = smoothstep(margin - 0.05, margin + 0.05, l.y);

  float rim = exp(-abs(e - 1.0) * 16.0) * underside;
  float bell = falloff(0.9, 1.0, e) * smoothstep(0.1, 1.0, e) * underside;
  float canals = pow(abs(cos(atan(l.x, l.y + 0.2) * 4.0)), 24.0) * bell;

  float tentacles = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i) / 7.0;
    float below = max(0.0, margin - l.y);
    float reach = 3.0 + 1.8 * hash(vec2(fi * 13.0, 3.0));
    float x = (fi * 2.0 - 1.0) * rx * 0.86 + 0.065 * below * sin(below * 1.9 - t * 1.5 + fi * 6.0);
    tentacles += exp(-abs(l.x - x) * 40.0) * step(l.y, margin) * falloff(reach * 0.45, reach, below);
  }
  float arms = 0.0;
  for (int i = 0; i < 2; i++) {
    float side = float(i) * 2.0 - 1.0;
    float below = max(0.0, -0.05 - l.y);
    float x = side * (0.16 + 0.05 * below) + 0.08 * below * sin(below * 3.4 - t * 1.1 + side);
    arms += exp(-abs(l.x - x) * 14.0) * step(l.y, -0.05) * falloff(1.2, 2.4, below);
  }

  vec3 glow = vec3(0.5, 0.72, 1.0) * rim * 0.55
            + vec3(0.32, 0.4, 0.95) * (bell * 0.14 + canals * 0.12)
            + vec3(0.55, 0.62, 1.0) * (tentacles * 0.2 + arms * 0.16);
  return glow * (0.6 + 0.4 * pulse) * visibility * 0.55;
}

// An anglerfish in the abyss. Only its lure is obvious; the head, jaw and teeth
// show only where the lure's own light falls on them.
vec3 angler(vec2 p, float aspect, float level, float t) {
  float visibility = falloff(0.3, 0.95, abs(level - 3.0));
  if (visibility <= 0.0) return vec3(0.0);

  float landscape = smoothstep(0.8, 1.4, aspect);
  vec2 lure = vec2(
    aspect * 0.79 + 0.018 * sin(t * 0.21),
    mix(0.15, 0.3, landscape) + (level - 3.0) * 1.15 + 0.02 * sin(t * 0.53)
  );
  vec2 q = p - lure;
  float r2 = dot(q, q);
  if (r2 > 0.16) return vec3(0.0);

  float throb = 0.5 + 0.5 * sin(t * 0.9);
  throb = 0.55 + 0.45 * throb * throb;
  vec3 col = vec3(0.45, 1.0, 0.86) * (exp(-r2 * 9000.0) * 1.4 + exp(-r2 * 380.0) * 0.16) * throb;
  float lit = exp(-sqrt(r2) * 9.0) * throb;

  float body = ellipse(q - vec2(0.11, -0.085), vec2(0.095, 0.07));
  body = smoothUnion(body, ellipse(q - vec2(0.068, -0.118), vec2(0.082, 0.03)), 0.02);
  body = smoothUnion(body, ellipse(q - vec2(0.24, -0.08), vec2(0.13, 0.05)), 0.04);
  col += vec3(0.3, 0.72, 0.66) * exp(-abs(body) * 300.0) * lit * 0.22;
  col += vec3(0.2, 0.5, 0.48) * step(body, 0.0) * lit * 0.03;

  float rod = segmentDistance(q, vec2(0.075, -0.018), vec2(0.004, 0.003));
  col += vec3(0.3, 0.7, 0.62) * exp(-rod * 1400.0) * lit * 0.6;

  vec2 eye = q - vec2(0.07, -0.055);
  col += vec3(0.7, 1.0, 0.95) * exp(-dot(eye, eye) * 60000.0) * lit * 0.8;

  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 tooth = (q - vec2(0.004 + fi * 0.012, -0.092 + 0.004 * sin(fi * 2.1))) * vec2(1.0, 0.35);
    col += vec3(0.6, 0.95, 0.9) * exp(-dot(tooth, tooth) * 90000.0) * lit * 0.9;
  }
  return col * visibility;
}

// The trench floor rising into the lamps, and silt kicked up on touchdown.
vec3 seafloor(vec3 water, vec2 p, float aspect, float level) {
  float arrival = smoothstep(4.0, 5.0, level);
  if (arrival <= 0.0) return water;

  float x = p.x - aspect * 0.5;
  float horizon = mix(-0.45, 0.28, arrival) + 0.035 * fbm(vec2(p.x * 1.3, 2.0)) + 0.01 * sin(p.x * 4.2 + 1.0);
  float below = horizon - p.y;
  vec3 col = water;

  if (below > -0.01) {
    float z = 1.0 / (max(below, 0.0) + 0.035);
    vec2 g = vec2(x * z, z);
    float sediment = fbm(g * vec2(1.6, 0.9) + 3.0);
    float ripples = 0.5 + 0.5 * sin(g.y * 2.6 + g.x * 0.35 + sediment * 5.0);
    float burrows = smoothstep(0.62, 0.72, noise(g * 2.7));
    float grain = 0.68 + 0.32 * sediment + 0.1 * ripples - 0.2 * burrows;
    float lamp = exp(-z * 0.14) * falloff(0.0, 1.4, abs(x) * (0.55 + 0.05 * z));
    vec3 ground = vec3(0.16, 0.145, 0.12) * grain * (0.06 + 1.5 * lamp);
    ground = mix(ground, water, smoothstep(5.0, 22.0, z));
    col = mix(water, ground, smoothstep(-0.004, 0.004, below));
  }

  if (uSiltAge < 9.0) {
    float age = uSiltAge;
    vec2 s = vec2(x / (0.22 + age * 0.06), (p.y - horizon) / (0.05 + age * 0.035));
    float cloud = fbm(vec2(p.x * 4.0 - age * 0.15, p.y * 7.0 - age * 0.45));
    float shape = exp(-s.x * s.x * 1.4) * exp(-max(s.y, 0.0) * 1.4) * smoothstep(-0.6, 0.2, s.y);
    float fade = smoothstep(0.0, 0.4, age) * exp(-age / 3.2);
    col += vec3(0.13, 0.12, 0.1) * cloud * shape * fade * falloff(0.0, 0.9, abs(x)) * arrival;
  }
  return col;
}

// ------------------------------------------------------------------ composition

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  float t = uTime;
  float level = uLevel;

  vec3 col = waterColor(level, vUv.y);

  float daylight = falloff(0.0, 1.5, level);
  if (daylight > 0.0) {
    col += surfaceGlare(p, level, t) * 0.24 * daylight;
    col += vec3(0.32, 0.62, 0.8) * lightShafts(p, aspect, level, t) * 0.1 * daylight;
    vec2 fish = fishSchool(p, aspect, level, t);
    col = mix(col, col * 0.35, fish.x * 0.6);
    col += vec3(0.5, 0.7, 0.8) * fish.y * 0.12;
  }

  float lamps = smoothstep(0.65, 1.5, level);
  float cone = lampCone(p, aspect);
  col += vec3(0.42, 0.6, 0.72) * cone * lamps * 0.018;

  float ambient = falloff(0.2, 1.5, level) * (0.3 + 0.7 * vUv.y);
  col += vec3(0.68, 0.84, 0.95) * marineSnow(p, t) * max(ambient, cone * lamps * 1.6) * 0.16;

  col += lanternfish(p, level, t) * 0.35;
  col += bioluminescence(p, level, t) * 0.9;
  col += medusa(p, aspect, level, t);
  col += angler(p, aspect, level, t);
  col = seafloor(col, p, aspect, level);

  vec2 v = (vUv - 0.5) * vec2(aspect, 1.0);
  col *= 1.0 - dot(v, v) * 0.26;
  col *= 1.0 - clamp(abs(uSpeed) * 0.05, 0.0, 0.1);

  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy + fract(t * 7.0) * 61.0) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;
