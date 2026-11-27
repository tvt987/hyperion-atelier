# HYPERION // ATELIER v12.0 — Principal Architect Portfolio Command Center

**Live Primary Domain:** [https://tvt987.github.io/](https://tvt987.github.io/)  
**Live Standalone Lab Mirror:** [https://tvt987.github.io/hyperion-atelier/](https://tvt987.github.io/hyperion-atelier/)  
**Author:** Truong Van Tinh (`tinhkun102@gmail.com` · `+84 931 467 024`)

---

## Verified Portfolio Scale (v12.0)

- **29 Live Production Web Apps** deployed on GitHub Pages
- **26/26 Full-Stack Production Monorepos** (`18` `.NET 10` Clean Architecture APIs + `8` `Python 3.12 FastAPI` APIs) — `26/26 OpenAPI 3.1 Valid`, `26/26 Docker Compose Valid`, `0 SAST Findings / 1,118 Files`
- **Verified Local Production API Latency Proof (`Live UI ↔ API Proof` Hero Switcher)**: 8 measured Release endpoints (`AegisPulse 1.26ms`, `AeroForge SPC 1.27ms`, `Velox Ghost Lap 1.42ms`, `Chronos 1.47ms`, `OrbitalFlow Monte Carlo 1.56ms`, `MedCore FHIR R4 1.91ms`, `Helios Quant 1.95ms`, `VectraDoc Knowledge Graph 32.85ms`)
- **Swiss Architectural Print Monograph Light Mode (`[data-theme='paper']`)**: warm alabaster `#F8F7F4`, crisp `#FFFFFF` elevated surfaces, deep obsidian ink `#111318`, `#E2E0D8` hairlines
- **12 Free Local-First Pro Tools** (`TVT Pro Tools v2.0`, 40kB split bundle, `73/73 CI`)
- **TVT Studio v8.5** (`Supabase RLS`, 26-app catalog, 83kB split bundle, MBBank SePay Auto-Pay, `49/49 CI`)
- **3,481 Automated Live CI Tests** (`3,457` showcase CI + `24` Hyperion Atelier CI)

---

## Technical Architecture & Code-Splitting Strategy

1. **Aggressive `React.lazy` + Vite Rollup `manualChunks` Code-Splitting**:
   - Dedicated vendor/data chunks (`react`, `motion`, `data`) keeping initial entry JS `< 65 kB`.
   - Conditional on-demand lazy chunks for `AskTinhModal` (`/`), `CommandPaletteModal` (`Ctrl+K`), `FlagshipLightbox`, `NavierStokesFluidCanvas` (`fluidEnabled`), `WebGpuAmbientField` (`particlesEnabled`), `PlatformInspectorPopover`, and `<Suspense>`-isolated `DistributedSystemsLab`.
2. **Hero `Live UI ↔ API Proof` Interactive Showcase & Direct Executive Contact Bar**:
   - Zero-layout-shift segmented mode toggle inside `HeroFlagshipShowcase`: defaults to crisp live production screenshots and switches smoothly to 8 verified local Release `.NET 10` & `FastAPI` HTTP 200 latency bars + portfolio audit proofs + 1-click live app & source launch.
3. **Off-Main-Thread Multi-Mode Compute Lab (`Web Worker` + `Float32Array`)**:
   - **Consistent Hashing Ring**: 8 physical shards x 12 FNV-1a virtual ring tokens with interactive shard outage simulation & zero-dropped-packet clockwise key remapping.
   - **Raft Consensus Quorum**: 5-node state machine with leader heartbeats, election timeout arcs, `RequestVote` RPC waves, and CP split-brain minority halting.
   - **HNSW 384-d Vector Graph**: 3-layer greedy beam search with interactive semantic query coordinate injection and real Float32Array micro-benchmarks.
4. **On-Device AI Digital Twin & Deterministic JD Fit Matcher**:
   - Chrome Built-in `LanguageModel` probe with 0ms local Hybrid BM25 RAG fallback and deterministic JD-to-CV scoring engine.
5. **Security & Modern Platform APIs**:
   - Strict CSP + `strict-origin-when-cross-origin` Referrer-Policy, zero `dangerouslySetInnerHTML`/`innerHTML`/`eval`, native View Transitions API, HTML Popover + CSS Anchor Positioning, Web Speech Voice Pilot, and Procedural Spatial Web Audio DSP.

## Local Development & Verification

```bash
npm install
npm test        # Vitest suite (24 tests: Consistent Hashing, Raft, HNSW, AI Twin, Verified API Benchmarks, Wave 1 28-App Registry)
npm run build   # Strict TypeScript (tsc -b) + Vite 6 / Tailwind v4 code-split production bundle (< 65 kB entry JS)
npm run preview
```
