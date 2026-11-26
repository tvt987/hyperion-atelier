/**
 * HYPERION ATELIER v4.0 — Real WebGPU (WGSL) Compute + Render Pipeline Shaders
 * Simulates 32,768 divergence-free curl-noise particles driven by pointer vortex,
 * scroll velocity impulse, and live Web Audio FFT bass energy.
 */

export const WEBGPU_PARTICLE_COUNT = 32768;
export const WEBGPU_WORKGROUP_SIZE = 64;
export const CANVAS_FALLBACK_PARTICLE_COUNT = 900;

export const WEBGPU_PARTICLE_COMPUTE_WGSL = /* wgsl */ `
struct Uniforms {
  resolution : vec2<f32>,
  pointer    : vec2<f32>,
  time       : f32,
  scrollVel  : f32,
  audio      : f32,
  isPaper    : f32,
};

struct Particle {
  pos  : vec2<f32>,
  vel  : vec2<f32>,
  seed : f32,
  life : f32,
  pad0 : f32,
  pad1 : f32,
};

@group(0) @binding(0) var<uniform> u : Uniforms;
@group(0) @binding(1) var<storage, read_write> particles : array<Particle>;

fn potential(p : vec2<f32>, t : f32) -> f32 {
  let a = sin(p.x * 2.1 + t * 0.34) * cos(p.y * 2.3 - t * 0.28);
  let b = 0.52 * sin((p.x * 3.7 - p.y * 2.9) + t * 0.41);
  let c = 0.28 * cos((p.x * 5.1 + p.y * 4.6) - t * 0.55);
  return a + b + c;
}

fn curlFlow(p : vec2<f32>, t : f32) -> vec2<f32> {
  let eps = 0.008;
  let dpdx = (potential(p + vec2<f32>(eps, 0.0), t) - potential(p - vec2<f32>(eps, 0.0), t)) / (2.0 * eps);
  let dpdy = (potential(p + vec2<f32>(0.0, eps), t) - potential(p - vec2<f32>(0.0, eps), t)) / (2.0 * eps);
  return vec2<f32>(dpdy, -dpdx);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let idx = gid.x;
  if (idx >= arrayLength(&particles)) {
    return;
  }

  var p = particles[idx];
  let aspect = u.resolution.x / max(u.resolution.y, 1.0);
  let scaledPos = vec2<f32>(p.pos.x * aspect, p.pos.y);

  // Divergence-free magnetic curl flow
  let curl = curlFlow(scaledPos * 1.15 + vec2<f32>(p.seed * 0.15, -p.seed * 0.11), u.time);
  let audioBoost = 1.0 + u.audio * 2.25;

  // Pointer spring attraction + tangential swirl
  let ptrNdc = vec2<f32>(u.pointer.x * 2.0 - 1.0, (1.0 - u.pointer.y) * 2.0 - 1.0);
  let toPtr = vec2<f32>((ptrNdc.x - p.pos.x) * aspect, ptrNdc.y - p.pos.y);
  let distSq = dot(toPtr, toPtr) + 0.045;
  let invDist = inverseSqrt(distSq);
  let pull = toPtr * invDist * (0.00042 / (distSq + 0.12));
  let swirl = vec2<f32>(-toPtr.y, toPtr.x) * invDist * (0.00068 / (distSq + 0.09));

  // Audio radial breathing + scroll velocity impulse
  let radial = normalize(p.pos + vec2<f32>(0.0001, 0.0001)) * (u.audio * 0.00055);
  let scrollImpulse = vec2<f32>(0.0, clamp(u.scrollVel * 0.00014, -0.0045, 0.0045));

  var vel = p.vel * 0.925;
  vel += vec2<f32>(curl.x / max(aspect, 0.5), curl.y) * 0.00046 * audioBoost;
  vel += vec2<f32>((pull.x + swirl.x) / max(aspect, 0.5), pull.y + swirl.y);
  vel += radial + scrollImpulse;

  // Clamp peak speed for silky ambient motion
  let speed = length(vel);
  if (speed > 0.014) {
    vel = (vel / speed) * 0.014;
  }

  var pos = p.pos + vel;

  // Seamless toroidal wrap
  if (pos.x > 1.06) { pos.x = -1.06; }
  if (pos.x < -1.06) { pos.x = 1.06; }
  if (pos.y > 1.06) { pos.y = -1.06; }
  if (pos.y < -1.06) { pos.y = 1.06; }

  p.pos = pos;
  p.vel = vel;
  p.life = fract(p.life + 0.0022 + speed * 0.45);

  particles[idx] = p;
}
`;

export const WEBGPU_PARTICLE_RENDER_WGSL = /* wgsl */ `
struct Uniforms {
  resolution : vec2<f32>,
  pointer    : vec2<f32>,
  time       : f32,
  scrollVel  : f32,
  audio      : f32,
  isPaper    : f32,
};

struct Particle {
  pos  : vec2<f32>,
  vel  : vec2<f32>,
  seed : f32,
  life : f32,
  pad0 : f32,
  pad1 : f32,
};

struct VsOut {
  @builtin(position) clipPos : vec4<f32>,
  @location(0) localUv       : vec2<f32>,
  @location(1) energy        : f32,
  @location(2) seed          : f32,
};

@group(0) @binding(0) var<uniform> u : Uniforms;
@group(0) @binding(1) var<storage, read> particles : array<Particle>;

@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32,
  @builtin(instance_index) iIdx : u32
) -> VsOut {
  var quad = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0)
  );

  let p = particles[iIdx];
  let corner = quad[vIdx];
  let speed = clamp(length(p.vel) * 140.0, 0.0, 1.0);
  let pxRadius = (1.15 + speed * 1.15 + u.audio * 0.95);
  let ndcOffset = vec2<f32>(
    corner.x * (pxRadius * 2.0 / max(u.resolution.x, 1.0)),
    corner.y * (pxRadius * 2.0 / max(u.resolution.y, 1.0))
  );

  var out : VsOut;
  out.clipPos = vec4<f32>(p.pos + ndcOffset, 0.0, 1.0);
  out.localUv = corner;
  out.energy = clamp(speed * 0.72 + u.audio * 0.55, 0.0, 1.0);
  out.seed = p.seed;
  return out;
}

@fragment
fn fs_main(in : VsOut) -> @location(0) vec4<f32> {
  let d = length(in.localUv);
  if (d > 1.0) {
    discard;
  }
  let soft = pow(1.0 - d, 1.85);
  let accentMix = smoothstep(0.55, 0.98, fract(in.seed * 13.37 + in.energy * 0.35));

  // Obsidian palette: titanium silver + vermilion ember
  let obsBase = vec3<f32>(0.76, 0.79, 0.88);
  let obsHot  = vec3<f32>(1.0, 0.34, 0.04);
  let obsCol  = mix(obsBase, obsHot, accentMix * (0.45 + 0.55 * in.energy));

  // Paper palette: fine graphite + deep vermilion ink
  let papBase = vec3<f32>(0.18, 0.19, 0.24);
  let papHot  = vec3<f32>(0.85, 0.23, 0.02);
  let papCol  = mix(papBase, papHot, accentMix * (0.4 + 0.5 * in.energy));

  let col = mix(obsCol, papCol, u.isPaper);
  let alpha = soft * mix(0.24, 0.18, u.isPaper) * (0.65 + 0.75 * in.energy);
  return vec4<f32>(col * alpha, alpha);
}
`;

export interface PlatformCapabilities {
  webgpuApi: boolean;
  webgl2: boolean;
  webWorkers: boolean;
  viewTransitions: boolean;
  popoverApi: boolean;
  anchorPositioning: boolean;
  scrollDrivenAnimations: boolean;
  speculationRules: boolean;
  webAudio: boolean;
}

export function detectPlatformCapabilities(): PlatformCapabilities {
  const hasNav = typeof navigator !== 'undefined';
  const hasWin = typeof window !== 'undefined';
  const hasDoc = typeof document !== 'undefined';
  const hasCss = typeof CSS !== 'undefined' && typeof CSS.supports === 'function';

  let webgl2 = false;
  if (hasDoc) {
    try {
      const c = document.createElement('canvas');
      webgl2 = Boolean(c.getContext('webgl2'));
    } catch {
      webgl2 = false;
    }
  }

  let speculationRules = false;
  if (typeof HTMLScriptElement !== 'undefined') {
    const supportsFn = (HTMLScriptElement as unknown as { supports?: (type: string) => boolean }).supports;
    if (typeof supportsFn === 'function') {
      try {
        speculationRules = Boolean(supportsFn('speculationrules'));
      } catch {
        speculationRules = false;
      }
    }
  }

  return {
    webgpuApi: hasNav && 'gpu' in navigator,
    webgl2,
    webWorkers: typeof Worker !== 'undefined',
    viewTransitions: hasDoc && 'startViewTransition' in document,
    popoverApi: typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype,
    anchorPositioning: hasCss && CSS.supports('anchor-name', '--gpu-inspector-anchor'),
    scrollDrivenAnimations: hasCss && CSS.supports('animation-timeline', 'view()'),
    speculationRules,
    webAudio:
      hasWin &&
      ('AudioContext' in window ||
        Boolean((window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext)),
  };
}
