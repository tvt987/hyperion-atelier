import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ACCENT_SWATCHES,
  hexToRgb01,
  isEyeDropperSupported,
  pickColorWithEyeDropper,
} from '../engines/accentEngine';
import { ambientAudio } from '../engines/ambientAudio';
import { tactileAudio } from '../engines/tactileAudio';
import type { AtelierTheme } from '../engines/themeTransition';

interface WebGLMonolithCanvasProps {
  theme: AtelierTheme;
  accentHex: string;
  onAccentChange: (hex: string | null) => void;
  scrollProgressRef: React.MutableRefObject<number>;
  scrollVelocityRef: React.MutableRefObject<number>;
  onFpsSample?: (fps: number) => void;
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform float u_scroll;
  uniform float u_velocity;
  uniform float u_paper;
  uniform float u_morph;
  uniform float u_audio;
  uniform vec3 u_accent;
  uniform float u_iridescence;
  uniform float u_ripple;
  varying vec2 vUv;

  mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
  }

  float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    float m = p.x + p.y + p.z - s;
    vec3 q;
    if (3.0 * p.x < m) q = p.xyz;
    else if (3.0 * p.y < m) q = p.yzx;
    else if (3.0 * p.z < m) q = p.zxy;
    else return m * 0.57735027;
    float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
    return length(vec3(q.x, q.y - s + k, q.z - k));
  }

  float sdBoxFrame(vec3 p, vec3 b, float e) {
    p = abs(p) - b;
    vec3 q = abs(p + e) - e;
    return min(min(
      length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
      length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
      length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
  }

  float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
  }

  float mapScene(vec3 p) {
    vec3 q = p;
    vec2 mTilt = (u_mouse - 0.5) * 1.1;
    q.xz *= rot(u_time * 0.34 + mTilt.x + u_scroll * 1.8);
    q.yz *= rot(0.38 + u_time * 0.21 - mTilt.y);

    float audioPulse = u_audio * 0.14;

    vec3 t1 = q;
    t1.xy *= rot(u_time * 0.52);
    float ringOuter = sdTorus(t1, vec2(1.02 + audioPulse * 0.4, 0.11 + audioPulse * 0.12));

    vec3 t2 = q;
    t2.yz *= rot(-u_time * 0.64 + 0.9);
    float ringInner = sdTorus(t2, vec2(0.68, 0.092 + audioPulse * 0.1));

    float coreOct = sdOctahedron(q, 0.52 + audioPulse * 0.35);
    float gyroPreset = opSmoothUnion(opSmoothUnion(ringOuter, ringInner, 0.22), coreOct, 0.28);

    vec3 fPos = q;
    fPos.xy *= rot(0.35 * sin(u_time * 0.48));
    float boxFrame = sdBoxFrame(fPos, vec3(0.86 + audioPulse * 0.22), 0.08);
    float innerSphere = length(q) - (0.50 + audioPulse * 0.28) + (0.04 + u_audio * 0.035) * u_ripple * sin(8.0 * q.x + u_time * 2.0) * sin(8.0 * q.y);
    float framePreset = opSmoothUnion(boxFrame, innerSphere, 0.24);

    float dFluid = length(q) - (0.66 + audioPulse * 0.3);
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float ang = u_time * (0.62 + fi * 0.14) + fi * 1.57079;
      float orbitR = 0.76 + audioPulse * 0.65;
      vec3 orbOffset = vec3(cos(ang) * orbitR, sin(ang * 1.3) * 0.60, sin(ang) * orbitR);
      float droplet = length(q - orbOffset) - (0.29 + audioPulse * 0.16);
      dFluid = opSmoothUnion(dFluid, droplet, 0.38);
    }

    float w01 = clamp(u_morph, 0.0, 1.0);
    float w12 = clamp(u_morph - 1.0, 0.0, 1.0);
    float baseShape = mix(gyroPreset, framePreset, w01);
    baseShape = mix(baseShape, dFluid, w12);

    float harmonic = 0.015 * sin(10.0 * q.x + u_time * 2.0) * cos(10.0 * q.y - u_time * 1.6) * sin(10.0 * q.z);
    baseShape += harmonic * u_ripple * (1.0 + min(abs(u_velocity) * 0.05, 1.0) + u_audio * 2.6);

    vec3 cursorOrbPos = vec3((u_mouse.x - 0.5) * 2.0, (u_mouse.y - 0.5) * 1.8, 0.45);
    float cursorDroplet = length(p - cursorOrbPos) - 0.23;

    return opSmoothUnion(baseShape, cursorDroplet, 0.42);
  }

  vec3 calcNormal(vec3 p) {
    const float h = 0.0014;
    const vec2 k = vec2(1.0, -1.0);
    return normalize(
      k.xyy * mapScene(p + k.xyy * h) +
      k.yyx * mapScene(p + k.yyx * h) +
      k.yxy * mapScene(p + k.yxy * h) +
      k.xxx * mapScene(p + k.xxx * h)
    );
  }

  float calcAO(vec3 pos, vec3 nor) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
      float h = 0.03 + 0.13 * float(i) / 4.0;
      float d = mapScene(pos + h * nor);
      occ += (h - d) * sca;
      sca *= 0.72;
    }
    return clamp(1.0 - 2.3 * occ, 0.0, 1.0);
  }

  vec3 thinFilmPalette(float t) {
    vec3 a = vec3(0.55, 0.36, 0.28);
    vec3 b = vec3(0.45, 0.32, 0.26);
    vec3 c = vec3(1.0, 0.8, 0.6);
    vec3 d = vec3(0.00, 0.15, 0.32);
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec3 ro = vec3(0.0, 0.0, 3.62);
    vec3 rd = normalize(vec3(uv, -1.52));

    vec3 darkBg = vec3(0.043, 0.046, 0.058);
    vec3 paperBg = vec3(0.945, 0.935, 0.915);
    vec3 bg = mix(darkBg, paperBg, u_paper);

    float rDist = length(uv);
    float ring1 = smoothstep(0.005, 0.0, abs(rDist - (0.45 + u_audio * 0.035)));
    vec3 cadCol = mix(vec3(0.16, 0.17, 0.21), vec3(0.80, 0.78, 0.74), u_paper);
    bg = mix(bg, cadCol, ring1 * (0.28 + u_audio * 0.25));

    float centerGlow = exp(-rDist * 2.3);
    bg += mix(
      u_accent * centerGlow * (0.16 + u_audio * 0.24),
      u_accent * centerGlow * (0.08 + u_audio * 0.14),
      u_paper
    );

    float t = 0.0;
    float hit = 0.0;
    for (int i = 0; i < 60; i++) {
      vec3 pos = ro + rd * t;
      float d = mapScene(pos);
      if (d < 0.0015) {
        hit = 1.0;
        break;
      }
      t += d * 0.85;
      if (t > 6.8) break;
    }

    vec3 col = bg;

    if (hit > 0.5) {
      vec3 pos = ro + rd * t;
      vec3 nor = calcNormal(pos);
      float ao = calcAO(pos, nor);

      vec3 keyDir = normalize(vec3(1.5, 2.1, 1.9));
      vec3 fillDir = normalize(vec3(-1.8, 0.6, 1.1));
      vec3 rimDir = normalize(vec3(0.2, -1.6, -1.2));
      vec3 refl = reflect(rd, nor);

      float diffKey = max(dot(nor, keyDir), 0.0);
      float diffFill = max(dot(nor, fillDir), 0.0);
      float fresnel = pow(clamp(1.0 + dot(nor, rd), 0.0, 1.0), 2.6);
      float specSharp = pow(max(dot(refl, keyDir), 0.0), 46.0);
      float specBroad = pow(max(dot(refl, fillDir), 0.0), 10.0);
      float underCaustic = max(dot(nor, rimDir), 0.0);

      float envBands = 0.5 + 0.5 * sin(refl.y * 5.5 + refl.x * 2.2);
      vec3 irid = thinFilmPalette(fresnel * 0.85 + pos.y * 0.25 + u_time * 0.06 + u_audio * 0.2);

      vec3 gunmetal = vec3(0.11, 0.115, 0.13) + diffKey * vec3(0.38, 0.39, 0.42);
      gunmetal += diffFill * vec3(0.14, 0.16, 0.21);
      gunmetal += envBands * vec3(0.16, 0.17, 0.21) * (0.45 + 0.55 * fresnel);
      gunmetal = mix(gunmetal, irid, clamp(fresnel * (0.34 + u_audio * 0.22) * u_iridescence, 0.0, 0.92));
      gunmetal += fresnel * u_accent * (1.18 + u_audio * 0.72);
      gunmetal += underCaustic * u_accent * (0.40 + u_audio * 0.25);
      gunmetal += specBroad * mix(u_accent, vec3(1.0, 0.78, 0.58), 0.45) * 0.48;
      gunmetal += specSharp * vec3(1.0, 0.97, 0.93) * 1.2;
      gunmetal *= mix(0.4, 1.0, ao);

      vec3 porcelain = vec3(0.78, 0.76, 0.72) + diffKey * vec3(0.26, 0.25, 0.23);
      porcelain += diffFill * vec3(0.10, 0.10, 0.11);
      porcelain -= (1.0 - ao) * 0.34;
      porcelain = mix(porcelain, u_accent, clamp(fresnel * (0.65 + u_audio * 0.3) * (0.55 + 0.45 * u_iridescence) + underCaustic * 0.24, 0.0, 0.92));
      porcelain += specSharp * vec3(1.0) * 0.85;

      col = mix(gunmetal, porcelain, u_paper);
    }

    col = col / (1.0 + col * 0.16);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const PRESETS = [
  { id: 0, label: 'Gyro' },
  { id: 1, label: 'Frame' },
  { id: 2, label: 'Ferro' },
] as const;

export function WebGLMonolithCanvas({
  theme,
  accentHex,
  onAccentChange,
  scrollProgressRef,
  scrollVelocityRef,
  onFpsSample,
}: WebGLMonolithCanvasProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const targetPaperRef = useRef<number>(theme === 'paper' ? 1 : 0);
  const targetMorphRef = useRef<number>(0);
  const targetAccentRef = useRef<[number, number, number]>(hexToRgb01(accentHex));
  const targetIridescenceRef = useRef<number>(1.0);
  const targetRippleRef = useRef<number>(1.0);
  const targetSpeedRef = useRef<number>(1.0);

  const [activePreset, setActivePreset] = useState<number>(0);
  const [tunerOpen, setTunerOpen] = useState<boolean>(false);
  const [iridescence, setIridescence] = useState<number>(1.0);
  const [ripple, setRipple] = useState<number>(1.0);
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1.0);
  const eyeDropperAvailable = isEyeDropperSupported();

  useEffect(() => {
    targetPaperRef.current = theme === 'paper' ? 1 : 0;
  }, [theme]);

  useEffect(() => {
    targetAccentRef.current = hexToRgb01(accentHex);
  }, [accentHex]);

  useEffect(() => {
    targetIridescenceRef.current = iridescence;
  }, [iridescence]);

  useEffect(() => {
    targetRippleRef.current = ripple;
  }, [ripple]);

  useEffect(() => {
    targetSpeedRef.current = orbitSpeed;
  }, [orbitSpeed]);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let rafId = 0;
    let disposed = false;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      renderer = null;
    }

    if (!renderer) {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.style.width = '100%';
      fallbackCanvas.style.height = '100%';
      container.appendChild(fallbackCanvas);
      const ctx = fallbackCanvas.getContext('2d');
      let t = 0;
      const drawFallback = () => {
        if (disposed || !ctx) return;
        const w = (fallbackCanvas.width = container.clientWidth || 520);
        const h = (fallbackCanvas.height = container.clientHeight || 520);
        const isPaper = targetPaperRef.current > 0.5;
        const audio = ambientAudio.getBassEnergy();
        const [r, g, b] = targetAccentRef.current;
        ctx.fillStyle = isPaper ? '#F1EFEA' : '#0B0C10';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
        ctx.lineWidth = 1.6 + audio * 1.4;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.ellipse(
            w * 0.5,
            h * 0.5,
            70 + i * 22 + audio * 18,
            40 + i * 14 + audio * 10,
            t * 0.014 * targetSpeedRef.current + i * 0.4,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
        t++;
        rafId = requestAnimationFrame(drawFallback);
      };
      drawFallback();
      return () => {
        disposed = true;
        cancelAnimationFrame(rafId);
        fallbackCanvas.remove();
      };
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.85);
    const initW = Math.max(300, container.clientWidth);
    const initH = Math.max(340, container.clientHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(initW, initH);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const [initR, initG, initB] = targetAccentRef.current;
    const uniforms = {
      u_resolution: { value: new THREE.Vector2(initW * dpr, initH * dpr) },
      u_mouse: { value: new THREE.Vector2(0.62, 0.58) },
      u_time: { value: 1.4 },
      u_scroll: { value: 0 },
      u_velocity: { value: 0 },
      u_paper: { value: targetPaperRef.current },
      u_morph: { value: 0 },
      u_audio: { value: 0 },
      u_accent: { value: new THREE.Vector3(initR, initG, initB) },
      u_iridescence: { value: targetIridescenceRef.current },
      u_ripple: { value: targetRippleRef.current },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const pointerTarget = { x: 0.62, y: 0.58 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        pointerTarget.x = (e.clientX - rect.left) / Math.max(1, rect.width);
        pointerTarget.y = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
      } else {
        pointerTarget.x = e.clientX / Math.max(1, window.innerWidth);
        pointerTarget.y = 1.0 - e.clientY / Math.max(1, window.innerHeight);
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      if (!renderer || !container) return;
      const w = Math.max(280, container.clientWidth);
      const h = Math.max(300, container.clientHeight);
      const nextDpr = Math.min(window.devicePixelRatio || 1, 1.85);
      renderer.setPixelRatio(nextDpr);
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w * nextDpr, h * nextDpr);
    });
    resizeObserver.observe(container);

    let lastNow = performance.now();
    let frameCounter = 0;
    let lastFpsStamp = lastNow;
    let smoothSpeed = 1.0;

    const renderLoop = (now: number) => {
      if (disposed) return;
      rafId = requestAnimationFrame(renderLoop);
      if (document.hidden || !renderer) return;

      const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) * 0.001));
      lastNow = now;
      smoothSpeed += (targetSpeedRef.current - smoothSpeed) * 0.1;

      const audioEnergy = ambientAudio.getBassEnergy();
      const [ar, ag, ab] = targetAccentRef.current;

      uniforms.u_time.value += dt * smoothSpeed;
      uniforms.u_mouse.value.x += (pointerTarget.x - uniforms.u_mouse.value.x) * 0.08;
      uniforms.u_mouse.value.y += (pointerTarget.y - uniforms.u_mouse.value.y) * 0.08;
      uniforms.u_scroll.value += (scrollProgressRef.current - uniforms.u_scroll.value) * 0.09;
      uniforms.u_velocity.value += (scrollVelocityRef.current - uniforms.u_velocity.value) * 0.12;
      uniforms.u_paper.value += (targetPaperRef.current - uniforms.u_paper.value) * 0.09;
      uniforms.u_morph.value += (targetMorphRef.current - uniforms.u_morph.value) * 0.075;
      uniforms.u_audio.value += (audioEnergy - uniforms.u_audio.value) * 0.16;
      uniforms.u_accent.value.x += (ar - uniforms.u_accent.value.x) * 0.14;
      uniforms.u_accent.value.y += (ag - uniforms.u_accent.value.y) * 0.14;
      uniforms.u_accent.value.z += (ab - uniforms.u_accent.value.z) * 0.14;
      uniforms.u_iridescence.value += (targetIridescenceRef.current - uniforms.u_iridescence.value) * 0.14;
      uniforms.u_ripple.value += (targetRippleRef.current - uniforms.u_ripple.value) * 0.14;

      renderer.render(scene, camera);

      frameCounter++;
      if (now - lastFpsStamp >= 1000) {
        onFpsSample?.(Math.round((frameCounter * 1000) / (now - lastFpsStamp)));
        frameCounter = 0;
        lastFpsStamp = now;
      }
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      quad.geometry.dispose();
      material.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [onFpsSample, scrollProgressRef, scrollVelocityRef]);

  const handleEyeDropper = async () => {
    tactileAudio.playLatch();
    const picked = await pickColorWithEyeDropper();
    if (picked) {
      onAccentChange(picked);
    }
  };

  const handleReset = () => {
    tactileAudio.playTick(1280);
    setIridescence(1.0);
    setRipple(1.0);
    setOrbitSpeed(1.0);
    onAccentChange(null);
  };

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[500px] rounded-[24px] overflow-hidden border border-[var(--hairline)] bg-[var(--bg-elevated)] shadow-[var(--card-shadow)]">
      <div ref={stageRef} data-cursor="SDF 3D" className="absolute inset-0 z-0" />

      {/* Floating GLSL Uniform Tuner & EyeDropper Micro-Popover */}
      {tunerOpen && (
        <div
          data-testid="shader-tuner-panel"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-[min(300px,calc(100%-24px))] p-3.5 rounded-2xl liquid-glass font-mono-tech text-[10.5px] space-y-3 text-[var(--fg-primary)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-2">
            <span className="font-bold tracking-wider uppercase">GLSL UNIFORMS</span>
            <button
              type="button"
              data-testid="btn-shader-reset"
              onClick={handleReset}
              className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--accent)] transition cursor-pointer"
            >
              RESET
            </button>
          </div>

          <div className="space-y-2">
            <label className="block space-y-1">
              <div className="flex justify-between text-[var(--fg-secondary)]">
                <span>IRIDESCENCE</span>
                <span className="text-[var(--fg-primary)]">{iridescence.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                data-testid="slider-iridescence"
                min={0}
                max={2.4}
                step={0.1}
                value={iridescence}
                onChange={(e) => setIridescence(Number.parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)] h-1 cursor-pointer"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-[var(--fg-secondary)]">
                <span>RIPPLE</span>
                <span className="text-[var(--fg-primary)]">{ripple.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                data-testid="slider-ripple"
                min={0}
                max={2.6}
                step={0.1}
                value={ripple}
                onChange={(e) => setRipple(Number.parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)] h-1 cursor-pointer"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-[var(--fg-secondary)]">
                <span>ORBIT SPEED</span>
                <span className="text-[var(--fg-primary)]">{orbitSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                data-testid="slider-speed"
                min={0.2}
                max={2.4}
                step={0.1}
                value={orbitSpeed}
                onChange={(e) => setOrbitSpeed(Number.parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)] h-1 cursor-pointer"
              />
            </label>
          </div>

          {/* Dynamic Accent Swatches + EyeDropper API */}
          <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {ACCENT_SWATCHES.map((sw) => {
                const active = accentHex.toUpperCase() === sw.hex;
                return (
                  <button
                    key={sw.hex}
                    type="button"
                    data-testid={`accent-swatch-${sw.name.toLowerCase()}`}
                    aria-label={`Accent ${sw.name}`}
                    onClick={() => {
                      tactileAudio.playTick(1480);
                      onAccentChange(sw.hex);
                    }}
                    style={{
                      backgroundColor: sw.hex,
                      boxShadow: active ? '0 0 0 2px var(--fg-primary)' : undefined,
                    }}
                    className="w-4 h-4 rounded-full transition-transform hover:scale-110 cursor-pointer"
                  />
                );
              })}
            </div>

            {eyeDropperAvailable && (
              <button
                type="button"
                data-testid="btn-eyedropper"
                onClick={() => void handleEyeDropper()}
                className="px-2 py-0.5 rounded-full border border-[var(--hairline)] hover:border-[var(--accent)] text-[10px] text-[var(--fg-primary)] transition cursor-pointer"
              >
                Pick
              </button>
            )}
          </div>
        </div>
      )}

      {/* Minimal Floating Liquid Glass Morph + Tune Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 rounded-full liquid-glass">
        {PRESETS.map((preset) => {
          const selected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              data-testid={`shader-preset-${preset.id}`}
              onClick={() => {
                tactileAudio.playLatch();
                setActivePreset(preset.id);
                targetMorphRef.current = preset.id;
              }}
              style={{
                backgroundColor: selected ? 'var(--fg-primary)' : 'transparent',
                color: selected ? 'var(--bg-primary)' : 'var(--fg-secondary)',
              }}
              className="px-3 py-1 rounded-full font-mono-tech text-[11px] font-semibold tracking-wide transition cursor-pointer"
            >
              {preset.label}
            </button>
          );
        })}

        <span aria-hidden="true" className="w-px h-3.5 bg-[var(--hairline-strong)] mx-0.5" />

        <button
          type="button"
          data-testid="btn-shader-tune"
          onClick={() => {
            tactileAudio.playTick(1520);
            setTunerOpen((v) => !v);
          }}
          style={{
            backgroundColor: tunerOpen ? 'var(--accent)' : 'transparent',
            color: tunerOpen ? '#ffffff' : 'var(--fg-secondary)',
          }}
          className="px-2.5 py-1 rounded-full font-mono-tech text-[11px] font-semibold tracking-wide hover:text-[var(--fg-primary)] transition cursor-pointer"
        >
          Tune
        </button>
      </div>
    </div>
  );
}
