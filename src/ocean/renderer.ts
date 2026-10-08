import type { Descent } from './descent';
import { WATER_UNIFORMS } from './palette';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './shaders';

export interface OceanScene {
  descent: Descent;
  /** Maps a step position to the renderer's level (0 = surface … 5 = seafloor). */
  levelAt(position: number): number;
  /** Step position of the seafloor, where silt is kicked up on arrival. */
  floorPosition: number;
}

const UNIFORMS = [
  'uResolution',
  'uTime',
  'uLevel',
  'uTravel',
  'uSpeed',
  'uSiltAge',
  'uTop',
  'uBottom',
] as const;
type UniformName = (typeof UNIFORMS)[number];

/** The scene is soft, so cap the drawing buffer and let the browser upscale. */
const MAX_PIXELS = 2_400_000;
const MIN_RESOLUTION_SCALE = 0.5;
const SLOW_FRAME_MS = 24;
/** Time used for the single still frame drawn when motion is reduced. */
const STILL_TIME = 42;

export class OceanRenderer {
  private readonly gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms = {} as Record<UniformName, WebGLUniformLocation | null>;
  private readonly resizeObserver: ResizeObserver;
  private readonly epoch = performance.now();
  private frame = 0;
  private running = false;
  private unsubscribe: (() => void) | null = null;
  private resolutionScale = 1;
  private slowFrames = 0;
  private lastFrameAt = 0;
  private arrivedAt: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly scene: OceanScene,
    private readonly animate: boolean,
  ) {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL is unavailable.');
    this.gl = gl;
    this.initialise();

    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.animate) {
      this.frame = requestAnimationFrame(this.tick);
    } else {
      this.draw(performance.now());
      this.unsubscribe = this.scene.descent.subscribe(() => this.draw(performance.now()));
    }
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.unsubscribe?.();
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }

  private initialise(): void {
    const { gl } = this;
    const program = linkProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(program);

    // One oversized triangle covers the viewport without a diagonal seam.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    for (const name of UNIFORMS) this.uniforms[name] = gl.getUniformLocation(program, name);
    gl.uniform3fv(this.uniforms.uTop, WATER_UNIFORMS.top);
    gl.uniform3fv(this.uniforms.uBottom, WATER_UNIFORMS.bottom);

    this.program = program;
    this.buffer = buffer;
  }

  private readonly tick = (now: number) => {
    this.frame = requestAnimationFrame(this.tick);
    this.adaptResolution(now);
    this.draw(now);
  };

  private draw(now: number): void {
    const { gl, uniforms, scene } = this;
    if (gl.isContextLost()) return;

    const { position, velocity } = scene.descent.sample(now);
    if (position >= scene.floorPosition - 1e-3) this.arrivedAt ??= now;
    else this.arrivedAt = null;

    const siltAge = this.animate && this.arrivedAt !== null ? (now - this.arrivedAt) / 1_000 : 99;
    gl.uniform2f(uniforms.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(uniforms.uTime, this.animate ? (now - this.epoch) / 1_000 : STILL_TIME);
    gl.uniform1f(uniforms.uLevel, scene.levelAt(position));
    gl.uniform1f(uniforms.uTravel, position);
    gl.uniform1f(uniforms.uSpeed, this.animate ? velocity : 0);
    gl.uniform1f(uniforms.uSiltAge, siltAge);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private resize(): void {
    const { canvas } = this;
    const { clientWidth, clientHeight } = canvas;
    let scale = Math.min(window.devicePixelRatio || 1, 2) * this.resolutionScale;
    const pixels = clientWidth * clientHeight * scale * scale;
    if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels);

    const width = Math.max(1, Math.round(clientWidth * scale));
    const height = Math.max(1, Math.round(clientHeight * scale));
    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    if (this.running && !this.animate) this.draw(performance.now());
  }

  /** Steps the resolution down if the GPU can't keep up; never back up, to avoid oscillating. */
  private adaptResolution(now: number): void {
    const delta = now - this.lastFrameAt;
    this.lastFrameAt = now;
    if (delta > 100 || document.hidden) return;

    this.slowFrames = delta > SLOW_FRAME_MS ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 45 && this.resolutionScale > MIN_RESOLUTION_SCALE) {
      this.resolutionScale = Math.max(MIN_RESOLUTION_SCALE, this.resolutionScale * 0.8);
      this.slowFrames = 0;
      this.resize();
    }
  }

  private readonly handleContextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(this.frame);
  };

  private readonly handleContextRestored = () => {
    this.initialise();
    this.canvas.width = 0; // force the next resize to reapply the viewport
    this.resize();
    if (this.running && this.animate) this.frame = requestAnimationFrame(this.tick);
  };
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed to compile: ${log}`);
  }
  return shader;
}

function linkProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`Shader program failed to link: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}
