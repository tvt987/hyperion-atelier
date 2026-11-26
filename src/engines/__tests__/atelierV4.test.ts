import { describe, expect, it } from 'vitest';
import {
  computeCardTilt,
  computeGaussianDockLift,
  computeGaussianDockScale,
  formatOdometerValue,
  parseOdometerMetric,
} from '../mathUtils';
import {
  CANVAS_FALLBACK_PARTICLE_COUNT,
  detectPlatformCapabilities,
  WEBGPU_PARTICLE_COMPUTE_WGSL,
  WEBGPU_PARTICLE_COUNT,
  WEBGPU_PARTICLE_RENDER_WGSL,
  WEBGPU_WORKGROUP_SIZE,
} from '../webgpuShaders';

describe('HYPERION ATELIER v4.0 — WebGPU Shaders, Capabilities & Kinetic Math', () => {
  it('defines valid WGSL compute and render pipelines aligned for 32,768 particles', () => {
    expect(WEBGPU_PARTICLE_COUNT).toBe(32768);
    expect(WEBGPU_WORKGROUP_SIZE).toBe(64);
    expect(WEBGPU_PARTICLE_COUNT % WEBGPU_WORKGROUP_SIZE).toBe(0);
    expect(CANVAS_FALLBACK_PARTICLE_COUNT).toBe(900);

    // Compute shader structural checks
    expect(WEBGPU_PARTICLE_COMPUTE_WGSL).toContain('@compute @workgroup_size(64)');
    expect(WEBGPU_PARTICLE_COMPUTE_WGSL).toContain('struct Uniforms');
    expect(WEBGPU_PARTICLE_COMPUTE_WGSL).toContain('struct Particle');
    expect(WEBGPU_PARTICLE_COMPUTE_WGSL).toContain('fn curlFlow');
    expect(WEBGPU_PARTICLE_COMPUTE_WGSL).toContain('var<storage, read_write> particles');
    expect(WEBGPU_PARTICLE_COMPUTE_WGSL).toContain('u.audio');
    expect(WEBGPU_PARTICLE_COMPUTE_WGSL).toContain('u.scrollVel');

    // Render shader structural checks
    expect(WEBGPU_PARTICLE_RENDER_WGSL).toContain('@vertex');
    expect(WEBGPU_PARTICLE_RENDER_WGSL).toContain('fn vs_main');
    expect(WEBGPU_PARTICLE_RENDER_WGSL).toContain('@fragment');
    expect(WEBGPU_PARTICLE_RENDER_WGSL).toContain('fn fs_main');
    expect(WEBGPU_PARTICLE_RENDER_WGSL).toContain('u.isPaper');
  });

  it('safely detects platform capabilities in non-browser and browser runtimes', () => {
    const caps = detectPlatformCapabilities();
    expect(typeof caps.webgpuApi).toBe('boolean');
    expect(typeof caps.webgl2).toBe('boolean');
    expect(typeof caps.webWorkers).toBe('boolean');
    expect(typeof caps.viewTransitions).toBe('boolean');
    expect(typeof caps.popoverApi).toBe('boolean');
    expect(typeof caps.anchorPositioning).toBe('boolean');
    expect(typeof caps.scrollDrivenAnimations).toBe('boolean');
    expect(typeof caps.speculationRules).toBe('boolean');
    expect(typeof caps.webAudio).toBe('boolean');
  });

  it('computes smooth Gaussian proximity magnification and upward lift for the bottom dock', () => {
    const peak = computeGaussianDockScale(0, 1.38, 68);
    const neighbor = computeGaussianDockScale(48, 1.38, 68);
    const far = computeGaussianDockScale(320, 1.38, 68);

    expect(peak).toBeCloseTo(1.38, 4);
    expect(neighbor).toBeGreaterThan(1.2);
    expect(neighbor).toBeLessThan(peak);
    expect(far).toBeCloseTo(1.0, 3);

    expect(computeGaussianDockLift(1.38, 1.38, 8)).toBeCloseTo(8, 4);
    expect(computeGaussianDockLift(1.0, 1.38, 8)).toBeCloseTo(0, 4);
    expect(computeGaussianDockLift(1.19, 1.38, 8)).toBeCloseTo(4, 3);
  });

  it('parses and formats Odometer metrics cleanly across integer, suffix, and decimal zero targets', () => {
    const cases = ['700+', '139K', '0.00%', '135+'];
    for (const raw of cases) {
      const parsed = parseOdometerMetric(raw);
      expect(formatOdometerValue(parsed, 1)).toBe(raw);
    }

    const rps = parseOdometerMetric('139K');
    expect(formatOdometerValue(rps, 0)).toBe('0K');
    expect(formatOdometerValue(rps, 0.5)).toMatch(/^\d+K$/);

    const zeroLeak = parseOdometerMetric('0.00%');
    expect(zeroLeak.decimals).toBe(2);
    expect(formatOdometerValue(zeroLeak, 0)).toBe('1.25%');
    expect(formatOdometerValue(zeroLeak, 1)).toBe('0.00%');
  });

  it('computes symmetric bounded 3D card tilt angles and sheen azimuth', () => {
    const center = computeCardTilt(0.5, 0.5, 4.5);
    expect(center.rotateX).toBeCloseTo(0, 5);
    expect(center.rotateY).toBeCloseTo(0, 5);

    const topRight = computeCardTilt(1, 0, 4.5);
    expect(topRight.rotateX).toBeCloseTo(4.5, 5);
    expect(topRight.rotateY).toBeCloseTo(4.5, 5);

    const clamped = computeCardTilt(-2, 5, 4.5);
    expect(clamped.rotateX).toBeCloseTo(-4.5, 5);
    expect(clamped.rotateY).toBeCloseTo(-4.5, 5);
  });
});
