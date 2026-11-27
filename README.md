# HYPERION // ATELIER v11.0 — Code-Split Portfolio Command Center

**Live Primary Domain:** [https://tvt987.github.io/](https://tvt987.github.io/)  
**Live Standalone Lab Mirror:** [https://tvt987.github.io/hyperion-atelier/](https://tvt987.github.io/hyperion-atelier/)  
**Author:** Truong Van Tinh (`tinhkun102@gmail.com` · `+84 931 467 024`)

---

## Verified Portfolio Scale (v11.0)

- **29 Live Production Web Apps** deployed on GitHub Pages
- **26/26 Full-Stack Production Monorepos** (`18` `.NET 10` Clean Architecture APIs + `8` `Python 3.12 FastAPI` APIs) with Docker Compose, OpenAPI 3.1, and ADRs
- **12 Free Local-First Pro Tools** (`TVT Pro Tools v2.0`, 40kB split bundle, `73/73 CI`)
- **TVT Studio v8.0** (`Supabase RLS`, 26-app catalog, 83kB split bundle, MBBank SePay Auto-Pay, `49/49 CI`)
- **2,870+ Automated Live CI Tests** across live web apps (`3,000+` across GitHub)

---

## Technical Architecture & Code-Splitting Strategy

1. **Aggressive `React.lazy` + Vite Rollup `manualChunks` Code-Splitting**:
   - Dedicated vendor/data chunks (`react`, `motion`, `data`) with unused `three` chunk removed.
   - Conditional on-demand lazy chunks for `AskTinhModal` (`/`), `CommandPaletteModal` (`Ctrl+K`), `FlagshipLightbox`, `NavierStokesFluidCanvas` (`fluidEnabled`), `WebGpuAmbientField` (`particlesEnabled`), `PlatformInspectorPopover`, and `<Suspense>`-isolated `DistributedSystemsLab`.
2. **Real Live Production Hero Showcase & Direct Executive Contact Bar**:
   - Instant interactive showcase of live production builds with direct one-click Email, Phone, Zalo QR, GitHub, LinkedIn, and 3 tailored CV PDFs (Backend, Full-Stack, Applied AI).
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
npm test        # Vitest suite (20 tests: Consistent Hashing, Raft, HNSW, AI Twin, 28-App v11.0 Registry)
npm run build   # Strict TypeScript (tsc -b) + Vite 6 / Tailwind v4 code-split production bundle
npm run preview
```
