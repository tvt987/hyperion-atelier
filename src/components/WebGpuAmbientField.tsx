import { useEffect, useRef } from 'react';
import { ambientAudio } from '../engines/ambientAudio';
import type { AtelierTheme } from '../engines/themeTransition';
import {
  CANVAS_FALLBACK_PARTICLE_COUNT,
  WEBGPU_PARTICLE_COMPUTE_WGSL,
  WEBGPU_PARTICLE_COUNT,
  WEBGPU_PARTICLE_RENDER_WGSL,
  WEBGPU_WORKGROUP_SIZE,
} from '../engines/webgpuShaders';

export interface AmbientFieldTelemetry {
  backend: 'webgpu' | 'canvas-fallback';
  particleCount: number;
  label: string;
}

interface WebGpuAmbientFieldProps {
  enabled?: boolean;
  theme: AtelierTheme;
  scrollVelocityRef: React.MutableRefObject<number>;
  onTelemetryChange?: (telemetry: AmbientFieldTelemetry) => void;
}

// Minimal strict structural interfaces for WebGPU API (zero external @webgpu/types needed)
interface GpuBufferLike {
  destroy(): void;
}
interface GpuBindGroupLike {}
interface GpuComputePipelineLike {
  getBindGroupLayout(index: number): unknown;
}
interface GpuRenderPipelineLike {
  getBindGroupLayout(index: number): unknown;
}
interface GpuTextureViewLike {}
interface GpuComputePassLike {
  setPipeline(p: GpuComputePipelineLike): void;
  setBindGroup(index: number, bg: GpuBindGroupLike): void;
  dispatchWorkgroups(x: number): void;
  end(): void;
}
interface GpuRenderPassLike {
  setPipeline(p: GpuRenderPipelineLike): void;
  setBindGroup(index: number, bg: GpuBindGroupLike): void;
  draw(vertexCount: number, instanceCount?: number): void;
  end(): void;
}
interface GpuCommandEncoderLike {
  beginComputePass(): GpuComputePassLike;
  beginRenderPass(desc: {
    colorAttachments: Array<{
      view: GpuTextureViewLike;
      clearValue: { r: number; g: number; b: number; a: number };
      loadOp: 'clear';
      storeOp: 'store';
    }>;
  }): GpuRenderPassLike;
  finish(): unknown;
}
interface GpuDeviceLike {
  createShaderModule(desc: { code: string }): unknown;
  createBuffer(desc: { size: number; usage: number }): GpuBufferLike;
  createComputePipeline(desc: {
    layout: 'auto';
    compute: { module: unknown; entryPoint: string };
  }): GpuComputePipelineLike;
  createRenderPipeline(desc: {
    layout: 'auto';
    vertex: { module: unknown; entryPoint: string };
    fragment: {
      module: unknown;
      entryPoint: string;
      targets: Array<{
        format: string;
        blend: {
          color: { srcFactor: string; dstFactor: string; operation: string };
          alpha: { srcFactor: string; dstFactor: string; operation: string };
        };
      }>;
    };
    primitive: { topology: 'triangle-list' };
  }): GpuRenderPipelineLike;
  createBindGroup(desc: {
    layout: unknown;
    entries: Array<{ binding: number; resource: { buffer: GpuBufferLike } }>;
  }): GpuBindGroupLike;
  createCommandEncoder(): GpuCommandEncoderLike;
  queue: {
    writeBuffer(buffer: GpuBufferLike, offset: number, data: ArrayBufferView): void;
    submit(commandBuffers: unknown[]): void;
  };
  destroy?: () => void;
}
interface GpuAdapterLike {
  requestDevice(): Promise<GpuDeviceLike | null>;
}
interface GpuLike {
  requestAdapter(opts?: { powerPreference?: 'high-performance' | 'low-power' }): Promise<GpuAdapterLike | null>;
  getPreferredCanvasFormat(): string;
}
interface GpuCanvasContextLike {
  configure(desc: { device: GpuDeviceLike; format: string; alphaMode: 'premultiplied' | 'opaque' }): void;
  getCurrentTexture(): { createView(): GpuTextureViewLike };
}

const GPU_BUFFER_USAGE_UNIFORM = 0x0040;
const GPU_BUFFER_USAGE_STORAGE = 0x0080;
const GPU_BUFFER_USAGE_COPY_DST = 0x0008;

export function WebGpuAmbientField({
  enabled = true,
  theme,
  scrollVelocityRef,
  onTelemetryChange,
}: WebGpuAmbientFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themePaperRef = useRef<number>(theme === 'paper' ? 1 : 0);

  useEffect(() => {
    themePaperRef.current = theme === 'paper' ? 1 : 0;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!enabled) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let disposed = false;
    let rafId = 0;
    let cleanupResources: (() => void) | null = null;

    const pointer = { x: 0.56, y: 0.42, tx: 0.56, ty: 0.42 };
    const onPointerMove = (ev: PointerEvent) => {
      pointer.tx = ev.clientX / Math.max(1, window.innerWidth);
      pointer.ty = ev.clientY / Math.max(1, window.innerHeight);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startCanvasFallback = () => {
      if (disposed) return;
      onTelemetryChange?.({
        backend: 'canvas-fallback',
        particleCount: CANVAS_FALLBACK_PARTICLE_COUNT,
        label: 'CANVAS FALLBACK · 900',
      });

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const count = CANVAS_FALLBACK_PARTICLE_COUNT;
      const px = new Float32Array(count);
      const py = new Float32Array(count);
      const vx = new Float32Array(count);
      const vy = new Float32Array(count);
      const seeds = new Float32Array(count);

      // Deterministic LCG seed so hydration & visuals are crisp and balanced
      let rng = 133791;
      const nextRand = () => {
        rng = (rng * 1664525 + 1013904223) >>> 0;
        return rng / 4294967296;
      };

      for (let i = 0; i < count; i++) {
        px[i] = nextRand();
        py[i] = nextRand();
        vx[i] = 0;
        vy[i] = 0;
        seeds[i] = nextRand();
      }

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.max(320, Math.floor(window.innerWidth * dpr));
        canvas.height = Math.max(320, Math.floor(window.innerHeight * dpr));
      };
      resize();
      window.addEventListener('resize', resize, { passive: true });

      const startMs = performance.now();
      let smoothAudio = 0;

      const renderFrame = (now: number) => {
        if (disposed) return;
        if (!prefersReducedMotion) {
          rafId = requestAnimationFrame(renderFrame);
        }
        if (document.hidden) return;

        const w = canvas.width;
        const h = canvas.height;
        const t = (now - startMs) * 0.00055;
        const isPaper = themePaperRef.current > 0.5;
        const audioRaw = ambientAudio.getBassEnergy();
        smoothAudio += (audioRaw - smoothAudio) * 0.14;
        const scrollImpulse = Math.max(-0.0024, Math.min(0.0024, scrollVelocityRef.current * 0.00008));

        pointer.x += (pointer.tx - pointer.x) * 0.08;
        pointer.y += (pointer.ty - pointer.y) * 0.08;

        ctx.clearRect(0, 0, w, h);

        const baseColor = isPaper ? '24, 26, 32' : '212, 218, 232';
        const hotColor = isPaper ? '217, 59, 0' : '255, 77, 0';
        const alphaBase = isPaper ? 0.16 : 0.22;

        for (let i = 0; i < count; i++) {
          const x = px[i];
          const y = py[i];
          const s = seeds[i];

          // Curl-like trigonometric velocity
          const ang =
            Math.sin(x * 5.2 + t + s * 2.1) * Math.cos(y * 4.8 - t * 0.9) * Math.PI * 2 +
            Math.cos((x - y) * 6.4 + t * 0.7);
          const flowScale = 0.00038 * (1 + smoothAudio * 1.9);

          let dvx = Math.cos(ang) * flowScale;
          let dvy = Math.sin(ang) * flowScale - scrollImpulse;

          // Pointer swirl
          const dx = pointer.x - x;
          const dy = pointer.y - y;
          const d2 = dx * dx + dy * dy + 0.025;
          if (d2 < 0.24) {
            const inv = 0.00018 / d2;
            dvx += (dx * 0.35 - dy * 0.85) * inv;
            dvy += (dy * 0.35 + dx * 0.85) * inv;
          }

          vx[i] = vx[i] * 0.91 + dvx;
          vy[i] = vy[i] * 0.91 + dvy;

          let nx = x + vx[i];
          let ny = y + vy[i];
          if (nx < -0.02) nx = 1.02;
          if (nx > 1.02) nx = -0.02;
          if (ny < -0.02) ny = 1.02;
          if (ny > 1.02) ny = -0.02;
          px[i] = nx;
          py[i] = ny;

          const speed = Math.min(1, Math.hypot(vx[i], vy[i]) * 260);
          const isHot = s > 0.82;
          const r = (0.75 + speed * 0.95 + smoothAudio * 0.65) * (w > 1000 ? 1.05 : 0.9);
          const a = alphaBase * (0.42 + speed * 0.65 + smoothAudio * 0.42);

          ctx.fillStyle = `rgba(${isHot ? hotColor : baseColor}, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(nx * w, ny * h, r, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      rafId = requestAnimationFrame(renderFrame);
      cleanupResources = () => {
        window.removeEventListener('resize', resize);
      };
    };

    const initWebGpu = async (): Promise<boolean> => {
      const gpu = (navigator as unknown as { gpu?: GpuLike }).gpu;
      if (!gpu) return false;

      try {
        const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (!adapter || disposed) return false;
        const device = await adapter.requestDevice();
        if (!device || disposed) return false;

        const context = canvas.getContext('webgpu') as unknown as GpuCanvasContextLike | null;
        if (!context) {
          device.destroy?.();
          return false;
        }

        const format = gpu.getPreferredCanvasFormat();
        context.configure({
          device,
          format,
          alphaMode: 'premultiplied',
        });

        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
          canvas.width = Math.max(320, Math.floor(window.innerWidth * dpr));
          canvas.height = Math.max(320, Math.floor(window.innerHeight * dpr));
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        // Initialize 32,768 particles (8 floats = 32 bytes each)
        const particleFloats = new Float32Array(WEBGPU_PARTICLE_COUNT * 8);
        let rng = 20260409;
        const rand = () => {
          rng = (rng * 1664525 + 1013904223) >>> 0;
          return rng / 4294967296;
        };
        for (let i = 0; i < WEBGPU_PARTICLE_COUNT; i++) {
          const base = i * 8;
          particleFloats[base] = rand() * 2 - 1;
          particleFloats[base + 1] = rand() * 2 - 1;
          particleFloats[base + 2] = 0;
          particleFloats[base + 3] = 0;
          particleFloats[base + 4] = rand();
          particleFloats[base + 5] = rand();
          particleFloats[base + 6] = 0;
          particleFloats[base + 7] = 0;
        }

        const particleBuffer = device.createBuffer({
          size: particleFloats.byteLength,
          usage: GPU_BUFFER_USAGE_STORAGE | GPU_BUFFER_USAGE_COPY_DST,
        });
        device.queue.writeBuffer(particleBuffer, 0, particleFloats);

        const uniformData = new Float32Array(8);
        const uniformBuffer = device.createBuffer({
          size: uniformData.byteLength,
          usage: GPU_BUFFER_USAGE_UNIFORM | GPU_BUFFER_USAGE_COPY_DST,
        });

        const computeModule = device.createShaderModule({ code: WEBGPU_PARTICLE_COMPUTE_WGSL });
        const renderModule = device.createShaderModule({ code: WEBGPU_PARTICLE_RENDER_WGSL });

        const computePipeline = device.createComputePipeline({
          layout: 'auto',
          compute: { module: computeModule, entryPoint: 'main' },
        });

        const renderPipeline = device.createRenderPipeline({
          layout: 'auto',
          vertex: { module: renderModule, entryPoint: 'vs_main' },
          fragment: {
            module: renderModule,
            entryPoint: 'fs_main',
            targets: [
              {
                format,
                blend: {
                  color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                  alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                },
              },
            ],
          },
          primitive: { topology: 'triangle-list' },
        });

        const computeBindGroup = device.createBindGroup({
          layout: computePipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: particleBuffer } },
          ],
        });

        const renderBindGroup = device.createBindGroup({
          layout: renderPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: particleBuffer } },
          ],
        });

        onTelemetryChange?.({
          backend: 'webgpu',
          particleCount: WEBGPU_PARTICLE_COUNT,
          label: 'WEBGPU WGSL · 32K',
        });

        const startMs = performance.now();
        let smoothAudio = 0;
        const workgroups = Math.ceil(WEBGPU_PARTICLE_COUNT / WEBGPU_WORKGROUP_SIZE);

        const frame = (now: number) => {
          if (disposed) return;
          if (!prefersReducedMotion) {
            rafId = requestAnimationFrame(frame);
          }
          if (document.hidden) return;

          pointer.x += (pointer.tx - pointer.x) * 0.08;
          pointer.y += (pointer.ty - pointer.y) * 0.08;
          const audioRaw = ambientAudio.getBassEnergy();
          smoothAudio += (audioRaw - smoothAudio) * 0.14;

          uniformData[0] = canvas.width;
          uniformData[1] = canvas.height;
          uniformData[2] = pointer.x;
          uniformData[3] = pointer.y;
          uniformData[4] = (now - startMs) * 0.001;
          uniformData[5] = scrollVelocityRef.current;
          uniformData[6] = smoothAudio;
          uniformData[7] = themePaperRef.current;
          device.queue.writeBuffer(uniformBuffer, 0, uniformData);

          const encoder = device.createCommandEncoder();

          const cPass = encoder.beginComputePass();
          cPass.setPipeline(computePipeline);
          cPass.setBindGroup(0, computeBindGroup);
          cPass.dispatchWorkgroups(workgroups);
          cPass.end();

          const rPass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                loadOp: 'clear',
                storeOp: 'store',
              },
            ],
          });
          rPass.setPipeline(renderPipeline);
          rPass.setBindGroup(0, renderBindGroup);
          rPass.draw(6, WEBGPU_PARTICLE_COUNT);
          rPass.end();

          device.queue.submit([encoder.finish()]);
        };

        rafId = requestAnimationFrame(frame);
        cleanupResources = () => {
          window.removeEventListener('resize', resize);
          particleBuffer.destroy();
          uniformBuffer.destroy();
          device.destroy?.();
        };

        return true;
      } catch {
        return false;
      }
    };

    void initWebGpu().then((ok) => {
      if (!ok && !disposed) {
        startCanvasFallback();
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      cleanupResources?.();
    };
  }, [enabled, onTelemetryChange, scrollVelocityRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="webgpu-ambient-field"
      className={`fixed inset-0 w-full h-full z-0 pointer-events-none transition-opacity duration-500 ${
        enabled ? 'opacity-65' : 'opacity-0'
      }`}
    />
  );
}
