# HYPERION // ATELIER — Swiss-Industrial Creative Engineering & Distributed Systems Lab

**Live Primary Domain:** [https://tvt987.github.io/](https://tvt987.github.io/)  
**Live Standalone Lab Mirror:** [https://tvt987.github.io/hyperion-atelier/](https://tvt987.github.io/hyperion-atelier/)  
**Author:** Truong Van Tinh (`tinhkun102@gmail.com` · `+84 931 467 024`)

---

## Technical Architecture & Modern Web Platform Stack (2026)

1. **Real-Time GLSL Signed-Distance-Field (SDF) Raymarching Shader (`Three.js` / `WebGL2`)**:
   - 48-step raymarched ferrofluid gyro-monolith with smooth-union (`opSmoothUnion`) cursor attractor sphere, ambient occlusion (`calcAO`), Fresnel caustic rim lighting, DPR capping, and real-time interpolation between **Carbon Obsidian** and **Brushed Alabaster Ceramic**.
2. **Off-Main-Thread Multi-Mode Compute Engine (`Web Worker` + `Float32Array`)**:
   - **Consistent Hashing Ring**: 8 physical shards × 12 FNV-1a virtual ring tokens with interactive node failure & zero-dropped-packet clockwise key remapping.
   - **Raft Consensus Quorum**: 5-node state machine with leader heartbeats, randomized follower election timeout arcs, `RequestVote` RPC waves, and CP split-brain minority halting.
   - **HNSW 384-d Vector Graph**: 3-layer Hierarchical Navigable Small World greedy beam search with interactive semantic query coordinate injection.
3. **Native Browser `View Transitions API` (`document.startViewTransition`)**:
   - Hardware-composited circular aperture `clip-path` wipe morphing between **Obsidian Darkroom** and **Swiss Archival Paper** from exact pointer coordinates.
4. **Lenis Momentum Inertial Scroll + GSAP `ScrollTrigger` + Native CSS `animation-timeline: scroll()`**:
   - Synchronized velocity-reactive shader uniforms, scrubbed word-by-word manifesto illumination, and compositor-thread scroll progress hairline.
5. **Procedural Web Audio API Micro-Acoustics & Spring-Physics Reticle**:
   - Zero-asset synthesized mechanical relay clicks (`OscillatorNode` + `BiquadFilterNode`) and Hooke's Law spring cursor reticle.

## Local Development & Verification

```bash
npm install
npm test        # Vitest suite (Consistent Hashing, Raft Quorum, HNSW, SIMD Benchmark)
npm run build   # Strict TypeScript (tsc -b) + Vite 6 / Tailwind v4 production bundle
npm run preview
```
