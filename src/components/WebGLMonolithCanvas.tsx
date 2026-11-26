import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { tactileAudio } from '../engines/tactileAudio';
import type { AtelierTheme } from '../engines/themeTransition';

interface WebGLMonolithCanvasProps {
  theme: AtelierTheme;
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

    vec3 t1 = q;
    t1.xy *= rot(u_time * 0.52);
    float ringOuter = sdTorus(t1, vec2(1.02, 0.11));

    vec3 t2 = q;
    t2.yz *= rot(-u_time * 0.64 + 0.9);
    float ringInner = sdTorus(t2, vec2(0.68, 0.092));

    float coreOct = sdOctahedron(q, 0.52);
    float gyroPreset = opSmoothUnion(opSmoothUnion(ringOuter, ringInner, 0.22), coreOct, 0.28);

    vec3 fPos = q;
    fPos.xy *= rot(0.35 * sin(u_time * 0.48));
    float boxFrame = sdBoxFrame(fPos, vec3(0.86), 0.08);
    float innerSphere = length(q) - 0.50 + 0.04 * sin(8.0 * q.x + u_time * 2.0) * sin(8.0 * q.y);
    float framePreset = opSmoothUnion(boxFrame, innerSphere, 0.24);

    float dFluid = length(q) - 0.66;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float ang = u_time * (0.62 + fi * 0.14) + fi * 1.57079;
      vec3 orbOffset = vec3(cos(ang) * 0.76, sin(ang * 1.3) * 0.60, sin(ang) * 0.76);
      float droplet = length(q - orbOffset) - 0.29;
      dFluid = opSmoothUnion(dFluid, droplet, 0.38);
    }

    float w01 = clamp(u_morph, 0.0, 1.0);
    float w12 = clamp(u_morph - 1.0, 0.0, 1.0);
    float baseShape = mix(gyroPreset, framePreset, w01);
    baseShape = mix(baseShape, dFluid, w12);

    float harmonic = 0.015 * sin(10.0 * q.x + u_time * 2.0) * cos(10.0 * q.y - u_time * 1.6) * sin(10.0 * q.z);
    baseShape += harmonic * (1.0 + min(abs(u_velocity) * 0.05, 1.0));

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
    float ring1 = smoothstep(0.005, 0.0, abs(rDist - 0.45));
    vec3 cadCol = mix(vec3(0.16, 0.17, 0.21), vec3(0.80, 0.78, 0.74), u_paper);
    bg = mix(bg, cadCol, ring1 * 0.28);

    float centerGlow = exp(-rDist * 2.3);
    bg += mix(
      vec3(1.0, 0.30, 0.02) * centerGlow * 0.16,
      vec3(0.85, 0.24, 0.02) * centerGlow * 0.08,
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
      vec3 irid = thinFilmPalette(fresnel * 0.85 + pos.y * 0.25 + u_time * 0.06);

      vec3 gunmetal = vec3(0.11, 0.115, 0.13) + diffKey * vec3(0.38, 0.39, 0.42);
      gunmetal += diffFill * vec3(0.14, 0.16, 0.21);
      gunmetal += envBands * vec3(0.16, 0.17, 0.21) * (0.45 + 0.55 * fresnel);
      gunmetal = mix(gunmetal, irid, fresnel * 0.34);
      gunmetal += fresnel * vec3(1.0, 0.31, 0.02) * 1.18;
      gunmetal += underCaustic * vec3(1.0, 0.26, 0.0) * 0.40;
      gunmetal += specBroad * vec3(1.0, 0.52, 0.24) * 0.48;
      gunmetal += specSharp * vec3(1.0, 0.97, 0.93) * 1.2;
      gunmetal *= mix(0.4, 1.0, ao);

      vec3 porcelain = vec3(0.78, 0.76, 0.72) + diffKey * vec3(0.26, 0.25, 0.23);
      porcelain += diffFill * vec3(0.10, 0.10, 0.11);
      porcelain -= (1.0 - ao) * 0.34;
      porcelain = mix(porcelain, vec3(0.86, 0.23, 0.02), fresnel * 0.65 + underCaustic * 0.24);
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
  scrollProgressRef,
  scrollVelocityRef,
  onFpsSample,
}: WebGLMonolithCanvasProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const targetPaperRef = useRef<number>(theme === 'paper' ? 1 : 0);
  const targetMorphRef = useRef<number>(0);
  const [activePreset, setActivePreset] = useState<number>(0);

  useEffect(() => {
    targetPaperRef.current = theme === 'paper' ? 1 : 0;
  }, [theme]);

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
        ctx.fillStyle = isPaper ? '#F1EFEA' : '#0B0C10';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = isPaper ? '#D93B00' : '#FF4D00';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.5, 70 + i * 22, 40 + i * 14, t * 0.014 + i * 0.4, 0, Math.PI * 2);
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

    const uniforms = {
      u_resolution: { value: new THREE.Vector2(initW * dpr, initH * dpr) },
      u_mouse: { value: new THREE.Vector2(0.62, 0.58) },
      u_time: { value: 0 },
      u_scroll: { value: 0 },
      u_velocity: { value: 0 },
      u_paper: { value: targetPaperRef.current },
      u_morph: { value: 0 },
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

    const startTime = performance.now();
    let frameCounter = 0;
    let lastFpsStamp = startTime;

    const renderLoop = (now: number) => {
      if (disposed) return;
      rafId = requestAnimationFrame(renderLoop);
      if (document.hidden || !renderer) return;

      uniforms.u_time.value = (now - startTime) * 0.001 + 1.4;
      uniforms.u_mouse.value.x += (pointerTarget.x - uniforms.u_mouse.value.x) * 0.08;
      uniforms.u_mouse.value.y += (pointerTarget.y - uniforms.u_mouse.value.y) * 0.08;
      uniforms.u_scroll.value += (scrollProgressRef.current - uniforms.u_scroll.value) * 0.09;
      uniforms.u_velocity.value += (scrollVelocityRef.current - uniforms.u_velocity.value) * 0.12;
      uniforms.u_paper.value += (targetPaperRef.current - uniforms.u_paper.value) * 0.09;
      uniforms.u_morph.value += (targetMorphRef.current - uniforms.u_morph.value) * 0.075;

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

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[500px] rounded-[24px] overflow-hidden border border-[var(--hairline)] bg-[var(--bg-elevated)] shadow-[var(--card-shadow)]">
      <div ref={stageRef} data-cursor="SDF 3D" className="absolute inset-0 z-0" />

      {/* Minimal Floating Pill Morph Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 rounded-full bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--hairline)]">
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
              className="px-3.5 py-1 rounded-full font-mono-tech text-[11px] font-semibold tracking-wide transition cursor-pointer"
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
