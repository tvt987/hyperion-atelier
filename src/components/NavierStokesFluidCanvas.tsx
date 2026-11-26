import { useEffect, useRef } from 'react';
import { hexToRgb01 } from '../engines/accentEngine';
import type { AtelierTheme } from '../engines/themeTransition';

export interface FluidTelemetry {
  active: boolean;
  label: string;
}

interface NavierStokesFluidCanvasProps {
  enabled: boolean;
  theme: AtelierTheme;
  accentHex: string;
  onTelemetryChange?: (telemetry: FluidTelemetry) => void;
}

const SIM_RES = 256;
const DYE_RES = 512;
const JACOBI_ITERS = 14;

const BASE_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const SPLAT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}
`;

const CURL_FRAG = `#version 300 es
precision highp float;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

const VORTICITY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curlStrength;
uniform float dt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curlStrength * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * dt;
  vel = clamp(vel, vec2(-1000.0), vec2(1000.0));
  fragColor = vec4(vel, 0.0, 1.0);
}
`;

const DIVERGENCE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

const CLEAR_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float value;
void main() {
  fragColor = value * texture(uTexture, vUv);
}
`;

const PRESSURE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

const GRADIENT_SUBTRACT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}
`;

const ADVECT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  vec4 result = texture(uSource, coord);
  float decay = 1.0 + dissipation * dt;
  fragColor = result / decay;
}
`;

const DISPLAY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float isPaper;
void main() {
  vec3 c = texture(uTexture, vUv).rgb;
  float lum = max(c.r, max(c.g, c.b));
  float alpha = clamp(lum * mix(0.85, 0.58, isPaper), 0.0, 0.85);
  vec3 toned = mix(c, c * 0.72, isPaper);
  fragColor = vec4(toned * alpha, alpha);
}
`;

interface FboTarget {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
}

interface DoubleFbo {
  read: FboTarget;
  write: FboTarget;
  swap: () => void;
}

interface ProgramBundle {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

function compileProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string
): ProgramBundle | null {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  gl.shaderSource(vs, vertSrc);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }

  gl.shaderSource(fs, fragSrc);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
  }
  return { program, uniforms };
}

function createFbo(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number
): FboTarget | null {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) return null;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    return null;
  }

  return {
    texture,
    fbo,
    width,
    height,
    texelSizeX: 1 / width,
    texelSizeY: 1 / height,
  };
}

function createDoubleFbo(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number
): DoubleFbo | null {
  const a = createFbo(gl, width, height, internalFormat, format, type, filter);
  const b = createFbo(gl, width, height, internalFormat, format, type, filter);
  if (!a || !b) return null;
  return {
    read: a,
    write: b,
    swap() {
      const tmp = this.read;
      this.read = this.write;
      this.write = tmp;
    },
  };
}

export function NavierStokesFluidCanvas({
  enabled,
  theme,
  accentHex,
  onTelemetryChange,
}: NavierStokesFluidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPaperRef = useRef<number>(theme === 'paper' ? 1 : 0);
  const accentRgbRef = useRef<[number, number, number]>(hexToRgb01(accentHex));

  useEffect(() => {
    isPaperRef.current = theme === 'paper' ? 1 : 0;
  }, [theme]);

  useEffect(() => {
    accentRgbRef.current = hexToRgb01(accentHex);
  }, [accentHex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!enabled) {
      onTelemetryChange?.({ active: false, label: 'PAUSED' });
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onTelemetryChange?.({ active: false, label: 'REDUCED MOTION' });
      return;
    }

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      onTelemetryChange?.({ active: false, label: 'FALLBACK' });
      return;
    }

    const floatExt = gl.getExtension('EXT_color_buffer_float');
    if (!floatExt) {
      onTelemetryChange?.({ active: false, label: 'FALLBACK (NO FLOAT FBO)' });
      return;
    }

    const linearExt = gl.getExtension('OES_texture_float_linear');
    const filterMode = linearExt ? gl.LINEAR : gl.NEAREST;

    // Compile all 9 Eulerian Stable Fluids shader programs
    const splatProg = compileProgram(gl, BASE_VERT, SPLAT_FRAG);
    const curlProg = compileProgram(gl, BASE_VERT, CURL_FRAG);
    const vortProg = compileProgram(gl, BASE_VERT, VORTICITY_FRAG);
    const divProg = compileProgram(gl, BASE_VERT, DIVERGENCE_FRAG);
    const clearProg = compileProgram(gl, BASE_VERT, CLEAR_FRAG);
    const pressProg = compileProgram(gl, BASE_VERT, PRESSURE_FRAG);
    const gradProg = compileProgram(gl, BASE_VERT, GRADIENT_SUBTRACT_FRAG);
    const advectProg = compileProgram(gl, BASE_VERT, ADVECT_FRAG);
    const displayProg = compileProgram(gl, BASE_VERT, DISPLAY_FRAG);

    const programs = [
      splatProg,
      curlProg,
      vortProg,
      divProg,
      clearProg,
      pressProg,
      gradProg,
      advectProg,
      displayProg,
    ];
    if (programs.some((p) => !p)) {
      onTelemetryChange?.({ active: false, label: 'SHADER FALLBACK' });
      return;
    }

    // Allocate Ping-Pong FBOs (256x256 sim, 512x512 dye)
    const velocity = createDoubleFbo(
      gl,
      SIM_RES,
      SIM_RES,
      gl.RG16F,
      gl.RG,
      gl.HALF_FLOAT,
      filterMode
    );
    const dye = createDoubleFbo(
      gl,
      DYE_RES,
      DYE_RES,
      gl.RGBA16F,
      gl.RGBA,
      gl.HALF_FLOAT,
      filterMode
    );
    const divergence = createFbo(
      gl,
      SIM_RES,
      SIM_RES,
      gl.R16F,
      gl.RED,
      gl.HALF_FLOAT,
      gl.NEAREST
    );
    const curl = createFbo(
      gl,
      SIM_RES,
      SIM_RES,
      gl.R16F,
      gl.RED,
      gl.HALF_FLOAT,
      gl.NEAREST
    );
    const pressure = createDoubleFbo(
      gl,
      SIM_RES,
      SIM_RES,
      gl.R16F,
      gl.RED,
      gl.HALF_FLOAT,
      gl.NEAREST
    );

    if (!velocity || !dye || !divergence || !curl || !pressure) {
      onTelemetryChange?.({ active: false, label: 'FBO FALLBACK' });
      return;
    }

    // Fullscreen quad VAO
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const blit = (target: FboTarget | null) => {
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const bindTex = (unit: number, tex: WebGLTexture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(320, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(320, Math.floor(window.innerHeight * dpr));
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const splatQueue: Array<{ x: number; y: number; dx: number; dy: number; boost?: number }> = [];
    let lastX = -1;
    let lastY = -1;
    let huePhase = 0;

    const onPointerMove = (ev: PointerEvent) => {
      const nx = ev.clientX / Math.max(1, window.innerWidth);
      const ny = 1.0 - ev.clientY / Math.max(1, window.innerHeight);
      if (lastX < 0) {
        lastX = nx;
        lastY = ny;
        return;
      }
      const dx = (nx - lastX) * 5400;
      const dy = (ny - lastY) * 5400;
      lastX = nx;
      lastY = ny;
      if (Math.abs(dx) + Math.abs(dy) > 1.2) {
        splatQueue.push({ x: nx, y: ny, dx, dy });
        if (splatQueue.length > 6) splatQueue.shift();
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // Gentle opening ambient ribbon impulse
    splatQueue.push({ x: 0.72, y: 0.56, dx: -160, dy: 90, boost: 0.55 });
    splatQueue.push({ x: 0.24, y: 0.48, dx: 130, dy: -85, boost: 0.42 });

    onTelemetryChange?.({ active: true, label: 'FBO 256² · 14-JACOBI' });

    const applySplat = (x: number, y: number, dx: number, dy: number, boost = 1) => {
      const aspect = canvas.width / Math.max(1, canvas.height);
      huePhase += 0.14;
      const [ar, ag, ab] = accentRgbRef.current;
      // Blend live accent with subtle iridescent cyan/pearl highlight
      const harmonic = 0.5 + 0.5 * Math.sin(huePhase);
      const dr = (ar * 0.72 + 0.14 * (1 - harmonic)) * 0.42 * boost;
      const dg = (ag * 0.65 + 0.34 * harmonic) * 0.42 * boost;
      const db = (ab * 0.72 + 0.58 * harmonic) * 0.42 * boost;

      // Velocity splat
      gl.useProgram(splatProg!.program);
      bindTex(0, velocity.read.texture);
      gl.uniform1i(splatProg!.uniforms.uTarget, 0);
      gl.uniform1f(splatProg!.uniforms.aspectRatio, aspect);
      gl.uniform2f(splatProg!.uniforms.point, x, y);
      gl.uniform3f(splatProg!.uniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatProg!.uniforms.radius, 0.0028);
      gl.uniform2f(splatProg!.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      blit(velocity.write);
      velocity.swap();

      // Dye splat
      bindTex(0, dye.read.texture);
      gl.uniform1i(splatProg!.uniforms.uTarget, 0);
      gl.uniform3f(splatProg!.uniforms.color, dr, dg, db);
      gl.uniform1f(splatProg!.uniforms.radius, 0.0042);
      gl.uniform2f(splatProg!.uniforms.texelSize, dye.read.texelSizeX, dye.read.texelSizeY);
      blit(dye.write);
      dye.swap();
    };

    let rafId = 0;
    let disposed = false;
    let prevStamp = performance.now();

    const step = (now: number) => {
      if (disposed) return;
      rafId = requestAnimationFrame(step);
      if (document.hidden) return;

      const dt = Math.min(0.0167, Math.max(0.004, (now - prevStamp) * 0.001));
      prevStamp = now;

      gl.disable(gl.BLEND);

      while (splatQueue.length > 0) {
        const s = splatQueue.shift()!;
        applySplat(s.x, s.y, s.dx, s.dy, s.boost ?? 1);
      }

      // 1. Curl
      gl.useProgram(curlProg!.program);
      gl.uniform2f(curlProg!.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      bindTex(0, velocity.read.texture);
      gl.uniform1i(curlProg!.uniforms.uVelocity, 0);
      blit(curl);

      // 2. Vorticity confinement
      gl.useProgram(vortProg!.program);
      gl.uniform2f(vortProg!.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      bindTex(0, velocity.read.texture);
      gl.uniform1i(vortProg!.uniforms.uVelocity, 0);
      bindTex(1, curl.texture);
      gl.uniform1i(vortProg!.uniforms.uCurl, 1);
      gl.uniform1f(vortProg!.uniforms.curlStrength, 24.0);
      gl.uniform1f(vortProg!.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      // 3. Divergence
      gl.useProgram(divProg!.program);
      gl.uniform2f(divProg!.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      bindTex(0, velocity.read.texture);
      gl.uniform1i(divProg!.uniforms.uVelocity, 0);
      blit(divergence);

      // 4. Clear / damp pressure
      gl.useProgram(clearProg!.program);
      gl.uniform2f(clearProg!.uniforms.texelSize, pressure.read.texelSizeX, pressure.read.texelSizeY);
      bindTex(0, pressure.read.texture);
      gl.uniform1i(clearProg!.uniforms.uTexture, 0);
      gl.uniform1f(clearProg!.uniforms.value, 0.8);
      blit(pressure.write);
      pressure.swap();

      // 5. 14-Iteration Jacobi Pressure Solver
      gl.useProgram(pressProg!.program);
      gl.uniform2f(pressProg!.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      bindTex(1, divergence.texture);
      gl.uniform1i(pressProg!.uniforms.uDivergence, 1);
      for (let i = 0; i < JACOBI_ITERS; i++) {
        bindTex(0, pressure.read.texture);
        gl.uniform1i(pressProg!.uniforms.uPressure, 0);
        blit(pressure.write);
        pressure.swap();
      }

      // 6. Gradient Subtract (Helmholtz-Hodge projection)
      gl.useProgram(gradProg!.program);
      gl.uniform2f(gradProg!.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      bindTex(0, pressure.read.texture);
      gl.uniform1i(gradProg!.uniforms.uPressure, 0);
      bindTex(1, velocity.read.texture);
      gl.uniform1i(gradProg!.uniforms.uVelocity, 1);
      blit(velocity.write);
      velocity.swap();

      // 7. Semi-Lagrangian Velocity Advection
      gl.useProgram(advectProg!.program);
      gl.uniform2f(advectProg!.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      bindTex(0, velocity.read.texture);
      gl.uniform1i(advectProg!.uniforms.uVelocity, 0);
      bindTex(1, velocity.read.texture);
      gl.uniform1i(advectProg!.uniforms.uSource, 1);
      gl.uniform1f(advectProg!.uniforms.dt, dt);
      gl.uniform1f(advectProg!.uniforms.dissipation, 0.45);
      blit(velocity.write);
      velocity.swap();

      // 8. Semi-Lagrangian Dye Advection
      gl.uniform2f(advectProg!.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
      bindTex(0, velocity.read.texture);
      gl.uniform1i(advectProg!.uniforms.uVelocity, 0);
      bindTex(1, dye.read.texture);
      gl.uniform1i(advectProg!.uniforms.uSource, 1);
      gl.uniform1f(advectProg!.uniforms.dt, dt);
      gl.uniform1f(advectProg!.uniforms.dissipation, 1.55);
      blit(dye.write);
      dye.swap();

      // 9. Display translucent iridescent dye field to screen
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(displayProg!.program);
      gl.uniform2f(displayProg!.uniforms.texelSize, 1 / canvas.width, 1 / canvas.height);
      bindTex(0, dye.read.texture);
      gl.uniform1i(displayProg!.uniforms.uTexture, 0);
      gl.uniform1f(displayProg!.uniforms.isPaper, isPaperRef.current);
      blit(null);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);

      const destroyFbo = (t: FboTarget) => {
        gl.deleteFramebuffer(t.fbo);
        gl.deleteTexture(t.texture);
      };
      destroyFbo(velocity.read);
      destroyFbo(velocity.write);
      destroyFbo(dye.read);
      destroyFbo(dye.write);
      destroyFbo(pressure.read);
      destroyFbo(pressure.write);
      destroyFbo(divergence);
      destroyFbo(curl);
      if (vbo) gl.deleteBuffer(vbo);
      if (vao) gl.deleteVertexArray(vao);
      programs.forEach((p) => {
        if (p) gl.deleteProgram(p.program);
      });
    };
  }, [enabled, onTelemetryChange]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="navier-stokes-canvas"
      className={`fixed inset-0 w-full h-full z-[1] pointer-events-none transition-opacity duration-500 ${
        enabled ? 'opacity-[0.42]' : 'opacity-0'
      }`}
    />
  );
}
